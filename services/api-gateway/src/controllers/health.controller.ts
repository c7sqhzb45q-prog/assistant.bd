import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../modules/auth/public.decorator';

const payloadSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', example: 'ok' },
    timestamp: { type: 'string', example: '2026-01-01T00:00:00.000Z' },
    service: { type: 'string', example: 'api-gateway' },
  },
  required: ['status', 'timestamp', 'service'],
};

@Controller('health')
@ApiTags('health')
@Public()
export class HealthController {
  @Get()
  @ApiOkResponse({ schema: payloadSchema })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }

  @Get('ready')
  @ApiOkResponse({ schema: payloadSchema })
  ready() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics() {
    return `# HELP assistant_bd_service_up Service health status
# TYPE assistant_bd_service_up gauge
assistant_bd_service_up{service="api-gateway"} 1
`;
  }

}

