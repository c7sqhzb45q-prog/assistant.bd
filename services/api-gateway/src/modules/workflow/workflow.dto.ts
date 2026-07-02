import {
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConditionDto {
  @ApiProperty({ example: 'cond_1' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'channel', description: 'Context data field path (dot notation)' })
  @IsString()
  field!: string;

  @ApiProperty({ example: 'equals' })
  @IsString()
  operator!: string;

  @ApiProperty({ example: 'whatsapp' })
  value: any;
}

export class ActionDto {
  @ApiProperty({ example: 'action_1' })
  @IsString()
  id!: string;

  @ApiProperty({ enum: ['send_message', 'api_call', 'create_task', 'run_agent'] })
  @IsIn(['send_message', 'api_call', 'create_task', 'run_agent'])
  type!: 'send_message' | 'api_call' | 'create_task' | 'run_agent';

  @ApiPropertyOptional({ example: { channel: 'whatsapp', message: 'Hello' } })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class ExecuteWorkflowDto {
  @ApiPropertyOptional({ example: 'wf_demo_001', description: 'Workflow ID (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Demo Workflow' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({
    example: { message: 'I want to buy a plan', channel: 'whatsapp' },
    description: 'Trigger/context data passed to the workflow',
  })
  @IsObject()
  triggerData!: Record<string, any>;

  @ApiPropertyOptional({ type: [ConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions?: ConditionDto[];

  @ApiProperty({ type: [ActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  actions!: ActionDto[];
}
