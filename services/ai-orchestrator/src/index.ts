import { createServer, IncomingMessage, ServerResponse } from 'http';

type AgentType = 'support' | 'sales' | 'voice' | 'booking' | 'custom';

type Environment = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  OPENAI_API_KEY?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
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

function loadEnvironment(): Environment {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as Environment['NODE_ENV'];
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
  };

  const missingInProd: string[] = [];
  if (env.NODE_ENV === 'production') {
    if (!env.OPENAI_API_KEY) missingInProd.push('OPENAI_API_KEY');
    if (!env.DATABASE_URL) missingInProd.push('DATABASE_URL');
    if (!env.REDIS_URL) missingInProd.push('REDIS_URL');
  }

  if (missingInProd.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missingInProd.join(', ')}`);
  }

  return env;
}

function handleHealth(req: IncomingMessage, res: ServerResponse, ready: boolean) {
  if (!req.url) {
    res.writeHead(404);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({ status: 'ok', service: 'ai-orchestrator', timestamp: new Date().toISOString() }),
    );
    return;
  }

  if (req.url === '/ready') {
    res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        status: ready ? 'ok' : 'starting',
        service: 'ai-orchestrator',
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  res.writeHead(404);
  res.end();
}

async function main() {
  const env = loadEnvironment();
  let ready = false;

  const server = createServer((req, res) => handleHealth(req, res, ready));

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

main().catch((error) => {
  log('error', 'service_start_failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
