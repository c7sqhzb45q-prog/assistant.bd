import axios, { AxiosError } from 'axios';
import { WorkflowService } from './workflow.service';
import { ExecuteWorkflowDto } from './workflow.dto';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeConfigService(url = 'http://localhost:3002') {
  return { get: (_key: string) => url } as any;
}

const makeDto = (overrides: Partial<ExecuteWorkflowDto> = {}): ExecuteWorkflowDto => ({
  name: 'Test Workflow',
  enabled: true,
  triggerData: { message: 'hello', channel: 'api' },
  actions: [{ id: 'a1', type: 'run_agent', config: { message: 'hello', channel: 'api' } }],
  ...overrides,
});

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkflowService(makeConfigService());
  });

  describe('execute', () => {
    it('calls workflow engine /execute and returns result', async () => {
      const engineResponse = {
        executionId: 'exec_abc',
        workflowId: 'wf_1',
        success: true,
        output: { agentType: 'sales', reason: 'pricing_or_purchase_intent', channel: 'api' },
        duration: 42,
        actionsExecuted: 1,
      };

      mockedAxios.post = jest.fn().mockResolvedValue({ data: engineResponse });

      const dto = makeDto({ triggerData: { message: 'I want to buy', channel: 'api' } });
      const result = await service.execute(dto);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/execute'),
        expect.objectContaining({
          workflow: expect.objectContaining({ name: 'Test Workflow' }),
          triggerData: { message: 'I want to buy', channel: 'api' },
        }),
        expect.objectContaining({ timeout: 15_000 }),
      );
      expect(result).toMatchObject({ success: true, actionsExecuted: 1 });
    });

    it('uses provided workflow id', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { executionId: 'exec_1', workflowId: 'wf_custom', success: true, duration: 5, actionsExecuted: 0 },
      });

      const dto = makeDto({ id: 'wf_custom', actions: [] });
      await service.execute(dto);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          workflow: expect.objectContaining({ id: 'wf_custom' }),
        }),
        expect.any(Object),
      );
    });

    it('throws InternalServerErrorException on network error', async () => {
      const error = new AxiosError('Network Error');
      mockedAxios.post = jest.fn().mockRejectedValue(error);

      await expect(service.execute(makeDto())).rejects.toThrow(InternalServerErrorException);
    });

    it('passes conditions in workflow definition', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { executionId: 'exec_1', workflowId: 'wf_1', success: true, duration: 5, actionsExecuted: 0 },
      });

      const dto = makeDto({
        conditions: [{ id: 'c1', field: 'channel', operator: 'equals', value: 'api' }],
      });
      await service.execute(dto);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          workflow: expect.objectContaining({
            definition: expect.objectContaining({
              conditions: expect.arrayContaining([
                expect.objectContaining({ field: 'channel', operator: 'equals', value: 'api' }),
              ]),
            }),
          }),
        }),
        expect.any(Object),
      );
    });

    it('defaults enabled to true when not provided', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { executionId: 'exec_1', workflowId: 'wf_1', success: true, duration: 5, actionsExecuted: 0 },
      });

      const dto = makeDto({ enabled: undefined });
      await service.execute(dto);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          workflow: expect.objectContaining({ enabled: true }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('getHistory', () => {
    it('returns history from workflow engine', async () => {
      const historyItems = [
        {
          id: 'exec_1',
          workflowId: 'wf_1',
          workflowName: 'Test',
          success: true,
          duration: 10,
          actionsExecuted: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      mockedAxios.get = jest.fn().mockResolvedValue({ data: { history: historyItems } });

      const result = await service.getHistory();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('exec_1');
    });

    it('returns empty array when workflow engine is unreachable', async () => {
      mockedAxios.get = jest.fn().mockRejectedValue(new Error('Connection refused'));

      const result = await service.getHistory();
      expect(result).toEqual([]);
    });
  });
});

