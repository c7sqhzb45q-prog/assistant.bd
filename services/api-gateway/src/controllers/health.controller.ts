import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-01-01T00:00:00.000Z' },
        service: { type: 'string', example: 'api-gateway' },
      },
      required: ['status', 'timestamp', 'service'],
    },
  })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }
}
