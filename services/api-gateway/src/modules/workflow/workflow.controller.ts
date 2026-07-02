import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ExecuteWorkflowDto } from './workflow.dto';
import { WorkflowService } from './workflow.service';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflows: WorkflowService) {}

  @Post('execute')
  @ApiCreatedResponse({ description: 'Workflow executed successfully.' })
  @ApiUnprocessableEntityResponse({ description: 'Workflow conditions not met or execution error.' })
  execute(@Body() dto: ExecuteWorkflowDto) {
    return this.workflows.execute(dto);
  }

  @Get('history')
  @ApiOkResponse({ description: 'Recent workflow execution history.' })
  history() {
    return this.workflows.getHistory();
  }
}
