import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WorkflowExecutor, WorkflowContext, getExecutionHistory } from './executor';
import type { Workflow } from '@assistant.bd/types';

type Environment = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  INTERNAL_SERVICE_SECRET?: string;
};

const executor = new WorkflowExecutor();

function log(level: 'info' | 'error', event: string, metadata: Record<string, unknown> = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: 'workflow-engine',
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
  const port = Number(process.env.PORT ?? 3002);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  const env: Environment = {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
  };

  const missingInProd: string[] = [];
  if (env.NODE_ENV === 'production') {
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
  }

  return env;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function createErrorId() {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: string[] = [];
  const body = await new Promise<string>((resolve, reject) => {
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => chunks.push(chunk));
    req.on('end', () => resolve(chunks.join('')));
    req.on('error', (error) =>
      reject(new Error(`Failed to read request body: ${error instanceof Error ? error.message : String(error)}`)),
    );
  });
  if (!body) return {};
  return JSON.parse(body) as Record<string, unknown>;
}

function isAuthorizedInternalRequest(req: IncomingMessage, env: Environment): boolean {
  if (!env.INTERNAL_SERVICE_SECRET) {
    log('info', 'internal_secret_not_configured_skipping_auth', {
      url: req.url,
      warning: 'INTERNAL_SERVICE_SECRET is not set; skipping internal auth check',
    });
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
    sendJson(res, 200, { status: 'ok', service: 'workflow-engine', timestamp: new Date().toISOString() });
    return;
  }

  if (req.url === '/metrics') {
    res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4' });
    res.end(
      '# HELP assistant_bd_service_up Service health status\n' +
        '# TYPE assistant_bd_service_up gauge\n' +
        'assistant_bd_service_up{service="workflow-engine"} 1\n',
    );
    return;
  }

  if (req.url === '/ready') {
    sendJson(res, ready ? 200 : 503, {
      status: ready ? 'ok' : 'starting',
      service: 'workflow-engine',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (req.url === '/execute') {
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
      const { workflow: workflowData, triggerData } = body;

      if (!workflowData || typeof workflowData !== 'object') {
        sendJson(res, 400, { error: 'Request body must include a "workflow" object.' });
        return;
      }

      const wf = workflowData as Partial<Workflow>;
      if (typeof wf.name !== 'string' || !wf.name.trim()) {
        sendJson(res, 400, { error: 'workflow.name must be a non-empty string.' });
        return;
      }

      const contextData = triggerData && typeof triggerData === 'object'
        ? (triggerData as Record<string, unknown>)
        : {};

      const workflowId = typeof wf.id === 'string' ? wf.id : generateId('wf');
      const executionId = generateId('exec');

      const workflow: Workflow = {
        id: workflowId,
        teamId: (wf.teamId ?? 'demo_team') as string,
        name: wf.name,
        description: wf.description,
        enabled: typeof wf.enabled === 'boolean' ? wf.enabled : true,
        definition: wf.definition ?? { triggers: [], actions: [] },
        createdAt: wf.createdAt ? new Date(wf.createdAt as unknown as string) : new Date(),
      };

      const context: WorkflowContext = {
        workflowId,
        triggerId: 'trigger_1',
        data: contextData as Record<string, any>,
        executionId,
        startTime: new Date(),
      };

      const result = await executor.execute(workflow, context);

      log('info', 'workflow_executed', {
        workflowId,
        executionId,
        success: result.success,
        duration: result.duration,
        actionsExecuted: result.actionsExecuted,
      });

      sendJson(res, result.success ? 200 : 422, { executionId, workflowId, ...result });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(res, 400, { error: 'Invalid JSON body.' });
        return;
      }
      const errorId = createErrorId();
      log('error', 'execute_unexpected_error', {
        errorId,
        error: error instanceof Error ? error.message : String(error),
      });
      sendJson(res, 500, { error: 'Unexpected error during workflow execution.', errorId });
    }
    return;
  }

  if (req.url === '/history') {
    if (req.method !== 'GET') {
      res.writeHead(405, { Allow: 'GET' });
      res.end();
      return;
    }
    if (!isAuthorizedInternalRequest(req, env)) {
      sendJson(res, 401, { error: 'Unauthorized: missing or invalid x-internal-secret header.' });
      return;
    }
    sendJson(res, 200, { history: getExecutionHistory() });
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
  log('info', 'service_ready', { port: env.PORT, nodeEnv: env.NODE_ENV, executorReady: Boolean(executor) });

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
