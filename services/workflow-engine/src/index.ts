import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WorkflowExecutor } from './executor';

type Environment = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL?: string;
  REDIS_URL?: string;
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
  };

  const missingInProd: string[] = [];
  if (env.NODE_ENV === 'production') {
    if (!env.DATABASE_URL) missingInProd.push('DATABASE_URL');
    if (!env.REDIS_URL) missingInProd.push('REDIS_URL');
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

function handleHealth(req: IncomingMessage, res: ServerResponse, ready: boolean) {
  if (!req.url) {
    res.writeHead(404);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({ status: 'ok', service: 'workflow-engine', timestamp: new Date().toISOString() }),
    );
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
    res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        status: ready ? 'ok' : 'starting',
        service: 'workflow-engine',
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

main().catch((error) => {
  log('error', 'service_start_failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
