import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AuthModule } from './modules/auth/auth.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { AgentModule } from './modules/agent/agent.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { BillingModule } from './modules/billing/billing.module';
import { FirecrawlModule } from './modules/firecrawl/firecrawl.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().port().default(3001),
        DATABASE_URL: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
          otherwise: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).optional(),
        }),
        REDIS_URL: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),
          otherwise: Joi.string().uri({ scheme: ['redis', 'rediss'] }).optional(),
        }),
        JWT_SECRET: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(32).required(),
          otherwise: Joi.string().min(16).required(),
        }),
        FRONTEND_URL: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
        CORS_ORIGIN: Joi.string().optional(),
        FIRECRAWL_API_KEY: Joi.string().trim().optional(),
        WORKFLOW_ENGINE_URL: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
        ORCHESTRATOR_URL: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
        STRIPE_SECRET_KEY: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().pattern(/^sk_/).required(),
          otherwise: Joi.string().optional(),
        }),
      }),
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    AuthModule,
    WorkflowModule,
    AgentModule,
    ConversationModule,
    BillingModule,
    FirecrawlModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
