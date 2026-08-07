import { createServer, IncomingMessage, ServerResponse } from 'http';
import { generateWithOllama, OllamaConfigError, OllamaRequestError } from './ollama';

type AgentType = 'support' | 'sales' | 'voice' | 'booking' | 'custom';

type Environment = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  OPENAI_API_KEY?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
  INTERNAL_SERVICE_SECRET?: string;
};

export interface OrchestrationRequest {
  channel: 'whatsapp' | 'facebook' | 'email' | 'api';
  text: string;
}

export interface OrchestrationDecision {
  agentType: AgentType;
  reason: string;
}

export function decideAgent(request: OrchestrationRequest): OrchestrationDecision {
  const lower = request.text.toLowerCase();

  if (lower.includes('buy') || lower.includes('price') || lower.includes('plan')) {
    return { agentType: 'sales', reason: 'pricing_or_purchase_intent' };
  }

  if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
    return { agentType: 'booking', reason: 'scheduling_intent' };
  }

  return { agentType: 'support', reason: 'default_support_route' };
}

function log(level: 'info' | 'error', event: string, metadata: Record<string, unknown> = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: 'ai-orchestrator',
    event,
    ...metadata,
  };

  const output = JSON.stringify(payload);
  if (level === 'error') {
    console.error(output);
    return;
  }
  console.log(output);
}

function parseNodeEnv(value: string | undefined): Environment['NODE_ENV'] {
  const nodeEnv = value ?? 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    throw new Error('NODE_ENV must be one of: development, test, production');
  }
  return nodeEnv;
}

function isValidUrl(value: string, protocols: string[]) {
  try {
    const parsed = new URL(value);
    return protocols.includes(parsed.protocol.replace(':', ''));
  } catch {
    return false;
  }
}

function loadEnvironment(): Environment {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
  const port = Number(process.env.PORT ?? 3003);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  const env: Environment = {
    NODE_ENV: nodeEnv,
    PORT: port,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL?.trim(),
    OLLAMA_MODEL: process.env.OLLAMA_MODEL?.trim(),
    INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
  };

  const missingInProd: string[] = [];
  if (env.NODE_ENV === 'production') {
    if (!env.OPENAI_API_KEY) missingInProd.push('OPENAI_API_KEY');
    if (!env.DATABASE_URL) missingInProd.push('DATABASE_URL');
    if (!env.REDIS_URL) missingInProd.push('REDIS_URL');
    if (!env.INTERNAL_SERVICE_SECRET) missingInProd.push('INTERNAL_SERVICE_SECRET');
  }

  if (missingInProd.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missingInProd.join(', ')}`);
  }

  if (env.NODE_ENV === 'production') {
    if (env.DATABASE_URL && !isValidUrl(env.DATABASE_URL, ['postgres', 'postgresql'])) {
      throw new Error('DATABASE_URL must be a valid postgres/postgresql URL');
    }
    if (env.REDIS_URL && !isValidUrl(env.REDIS_URL, ['redis', 'rediss'])) {
      throw new Error('REDIS_URL must be a valid redis/rediss URL');
    }
    if (env.OPENAI_API_KEY && !env.OPENAI_API_KEY.startsWith('sk-')) {
      throw new Error('OPENAI_API_KEY must start with sk-');
    }
  }

  const hasOllamaBaseUrl = Boolean(env.OLLAMA_BASE_URL);
  const hasOllamaModel = Boolean(env.OLLAMA_MODEL);
  if (hasOllamaBaseUrl !== hasOllamaModel) {
    throw new Error(
      'Both OLLAMA_BASE_URL and OLLAMA_MODEL must be set together, or neither should be set.',
    );
  }
  if (hasOllamaBaseUrl && !isValidUrl(env.OLLAMA_BASE_URL!, ['http', 'https'])) {
    throw new Error('OLLAMA_BASE_URL must be a valid http/https URL');
  }

  return env;
}

function sendJson(res: ServerResponse, statusCode: number, payload: Record<string, unknown>) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function createErrorId() {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: string[] = [];
  const body = await new Promise<string>((resolve, reject) => {
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => chunks.push(chunk));
    req.on('end', () => resolve(chunks.join('')));
    req.on('error', (error) =>
      reject(new Error(`Failed to read request body: ${error instanceof Error ? error.message : String(error)}`)),
    );
  });

  if (!body) {
    return {};
  }

  return JSON.parse(body) as Record<string, unknown>;
}

async function handleOllamaGenerate(req: IncomingMessage, res: ServerResponse, env: Environment) {
  if (!env.OLLAMA_BASE_URL || !env.OLLAMA_MODEL) {
    throw new OllamaConfigError(
      'Ollama is not configured. Set OLLAMA_BASE_URL and OLLAMA_MODEL to enable this endpoint.',
    );
  }

  const body = await readJsonBody(req);
  const { prompt, system } = body;

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    sendJson(res, 400, { error: 'Request body must include a non-empty string "prompt".' });
    return;
  }
  if (system !== undefined && typeof system !== 'string') {
    sendJson(res, 400, { error: 'Request field "system" must be a string when provided.' });
    return;
  }

  const response = await generateWithOllama({
    baseUrl: env.OLLAMA_BASE_URL,
    model: env.OLLAMA_MODEL,
    prompt,
    system,
  });

  sendJson(res, 200, {
    provider: 'ollama',
    model: env.OLLAMA_MODEL,
    response,
  });
}

function isAuthorizedInternalRequest(req: IncomingMessage, env: Environment): boolean {
  if (!env.INTERNAL_SERVICE_SECRET) {
    return true;
  }
  const provided = req.headers['x-internal-secret'];
  return provided === env.INTERNAL_SERVICE_SECRET;
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, ready: boolean, env: Environment) {
  if (!req.url) {
    res.writeHead(404);
    res.end();
    return;
  }

  if (req.url === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'ai-orchestrator', timestamp: new Date().toISOString() });
    return;
  }
  if (req.url === '/metrics') {
    res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4' });
    res.end(
      '# HELP assistant_bd_service_up Service health status\n' +
        '# TYPE assistant_bd_service_up gauge\n' +
        'assistant_bd_service_up{service="ai-orchestrator"} 1\n',
    );
    return;
  }

  if (req.url === '/ready') {
    sendJson(res, ready ? 200 : 503, {
      status: ready ? 'ok' : 'starting',
      service: 'ai-orchestrator',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (req.url === '/orchestrate') {
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' });
      res.end();
      return;
    }

    if (!isAuthorizedInternalRequest(req, env)) {
      sendJson(res, 401, { error: 'Unauthorized: missing or invalid x-internal-secret header.' });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const { text, channel } = body;

      if (typeof text !== 'string' || text.trim().length === 0) {
        sendJson(res, 400, { error: 'Request body must include a non-empty string "text".' });
        return;
      }

      const validChannels = ['whatsapp', 'facebook', 'email', 'api'];
      const resolvedChannel = typeof channel === 'string' && validChannels.includes(channel)
        ? (channel as OrchestrationRequest['channel'])
        : 'api';

      const decision = decideAgent({ text: text.trim(), channel: resolvedChannel });

      log('info', 'agent_routed', { agentType: decision.agentType, reason: decision.reason, channel: resolvedChannel });

      sendJson(res, 200, {
        agentType: decision.agentType,
        reason: decision.reason,
        channel: resolvedChannel,
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(res, 400, { error: 'Invalid JSON body.' });
        return;
      }
      const errorId = createErrorId();
      log('error', 'orchestrate_unexpected_error', {
        errorId,
        error: error instanceof Error ? error.message : String(error),
      });
      sendJson(res, 500, { error: 'Unexpected error during orchestration.', errorId });
    }
    return;
  }

  if (req.url === '/ollama/generate') {
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' });
      res.end();
      return;
    }

    if (!isAuthorizedInternalRequest(req, env)) {
      sendJson(res, 401, { error: 'Unauthorized: missing or invalid x-internal-secret header.' });
      return;
    }

    try {
      await handleOllamaGenerate(req, res, env);
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(res, 400, { error: 'Invalid JSON body.' });
        return;
      }
      if (error instanceof OllamaConfigError) {
        sendJson(res, 503, { error: error.message });
        return;
      }
      if (error instanceof OllamaRequestError) {
        sendJson(res, error.statusCode, { error: error.message });
        return;
      }

      const errorId = createErrorId();
      log('error', 'ollama_generate_unexpected_error', {
        errorId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      sendJson(res, 500, {
        error: 'Unexpected error while generating response from Ollama.',
        errorId,
      });
    }
    return;
  }

  res.writeHead(404);
  res.end();
}

async function main() {
  const env = loadEnvironment();
  let ready = false;

  const server = createServer((req, res) => {
    void handleRequest(req, res, ready, env).catch((error) => {
      const errorId = createErrorId();
      log('error', 'request_handling_failed', {
        errorId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Unexpected server error.', errorId });
      } else {
        res.end();
      }
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(env.PORT, '0.0.0.0', () => resolve());
  });

  ready = true;
  log('info', 'service_ready', { port: env.PORT, nodeEnv: env.NODE_ENV });

  const shutdown = async (signal: string) => {
    log('info', 'shutdown_started', { signal });
    ready = false;
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    log('info', 'shutdown_completed', { signal });
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

if (require.main === module) {
  main().catch((error) => {
    log('error', 'service_start_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}
