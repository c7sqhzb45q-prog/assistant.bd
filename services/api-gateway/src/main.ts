import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Enable CORS
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

  // Swagger (OpenAPI)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('assistant.bd API Gateway')
    .setDescription('API Gateway for assistant.bd')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 API Gateway running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
