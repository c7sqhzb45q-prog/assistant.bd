import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const logger = new Logger('api-gateway');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableShutdownHooks();

  const defaultOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'];
  const envOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('assistant.bd API Gateway')
    .setDescription('API Gateway for assistant.bd')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');

  logger.log(JSON.stringify({ event: 'service_ready', service: 'api-gateway', port }));
}

bootstrap().catch((err) => {
  logger.error(
    JSON.stringify({
      event: 'service_start_failed',
      service: 'api-gateway',
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(1);
});
