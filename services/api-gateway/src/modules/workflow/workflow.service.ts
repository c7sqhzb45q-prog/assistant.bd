import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { ExecuteWorkflowDto } from './workflow.dto';
import type { WorkflowExecutionRecord } from '@assistant.bd/types';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveServiceUrl(value: string | undefined, defaultUrl: string): string {
  const raw = value ?? defaultUrl;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Service URL must use http or https');
    }
    return raw;
  } catch {
    return defaultUrl;
  }
}

@Injectable()
export class WorkflowService {
  private readonly engineUrl: string;

  constructor(private readonly config: ConfigService) {
    this.engineUrl = resolveServiceUrl(
      this.config.get<string>('WORKFLOW_ENGINE_URL'),
      'http://localhost:3002',
    );
  }

  async execute(dto: ExecuteWorkflowDto) {
    const workflowId = dto.id ?? generateId('wf');

    const payload = {
      workflow: {
        id: workflowId,
        teamId: 'demo_team',
        name: dto.name,
        enabled: dto.enabled ?? true,
        definition: {
          triggers: [{ id: 'trigger_1', type: 'api', config: {} }],
          conditions: (dto.conditions ?? []).map((c) => ({
            id: c.id,
            type: 'if',
            expression: '',
            field: c.field,
            operator: c.operator,
            value: c.value,
          })),
          actions: (dto.actions ?? []).map((a) => ({
            id: a.id,
            type: a.type,
            config: a.config ?? {},
          })),
        },
        createdAt: new Date().toISOString(),
      },
      triggerData: dto.triggerData,
    };

    try {
      const { data } = await axios.post<ExecutionResponse>(
        `${this.engineUrl}/execute`,
        payload,
        { timeout: 15_000 },
      );
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const message: string = (error.response?.data as { error?: string } | undefined)?.error
          ?? error.message;

        if (status === 422) {
          throw new UnprocessableEntityException(message);
        }

        throw new InternalServerErrorException(
          `Workflow engine returned ${status ?? 'no response'}: ${message}`,
        );
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`Workflow execution failed: ${message}`);
    }
  }

  async getHistory(): Promise<WorkflowExecutionRecord[]> {
    try {
      const { data } = await axios.get<{ history: WorkflowExecutionRecord[] }>(
        `${this.engineUrl}/history`,
        { timeout: 5_000 },
      );
      return data.history;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[WorkflowService] Failed to fetch execution history: ${message}`);
      return [];
    }
  }
}

export interface ExecutionResponse {
  executionId: string;
  workflowId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
  actionsExecuted: number;
}
