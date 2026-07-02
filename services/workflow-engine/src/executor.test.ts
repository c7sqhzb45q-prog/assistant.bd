import { WorkflowExecutor, WorkflowContext } from './executor';
import type { Workflow } from '@assistant.bd/types';

function makeContext(data: Record<string, any> = {}): WorkflowContext {
  return {
    workflowId: 'wf_test',
    triggerId: 'trigger_1',
    data,
    executionId: 'exec_test',
    startTime: new Date(),
  };
}

function makeWorkflow(overrides: Partial<Workflow> = {}): Workflow {
  return {
    id: 'wf_test',
    teamId: 'team_test',
    name: 'Test Workflow',
    enabled: true,
    definition: {
      triggers: [{ id: 'trigger_1', type: 'webhook', config: {} }],
      actions: [],
    },
    createdAt: new Date(),
    ...overrides,
  };
}

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor();
  });

  describe('condition evaluation', () => {
    it('skips actions when "equals" condition is not met', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          conditions: [{ id: 'c1', type: 'if', expression: '', field: 'channel', operator: 'equals', value: 'email' } as any],
          actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }],
        },
      });

      const context = makeContext({ channel: 'whatsapp' });
      const result = await executor.execute(workflow, context);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(0);
      expect(result.output).toMatchObject({ skipped: true, reason: 'conditions_not_met' });
    });

    it('runs actions when "equals" condition is met', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          conditions: [{ id: 'c1', type: 'if', expression: '', field: 'channel', operator: 'equals', value: 'whatsapp' } as any],
          actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }],
        },
      });

      const context = makeContext({ channel: 'whatsapp' });
      const result = await executor.execute(workflow, context);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(1);
    });

    it('evaluates "contains" operator correctly', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          conditions: [{ id: 'c1', type: 'if', expression: '', field: 'message', operator: 'contains', value: 'buy' } as any],
          actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }],
        },
      });

      const context = makeContext({ message: 'I want to buy a plan' });
      const result = await executor.execute(workflow, context);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(1);
    });

    it('evaluates "not_equals" operator correctly', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          conditions: [{ id: 'c1', type: 'if', expression: '', field: 'priority', operator: 'not_equals', value: 'low' } as any],
          actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }],
        },
      });

      const context = makeContext({ priority: 'high' });
      const result = await executor.execute(workflow, context);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(1);
    });

    it('evaluates "greater_than" operator correctly', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          conditions: [{ id: 'c1', type: 'if', expression: '', field: 'score', operator: 'greater_than', value: 5 } as any],
          actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }],
        },
      });

      const context = makeContext({ score: 8 });
      const result = await executor.execute(workflow, context);
      expect(result.actionsExecuted).toBe(1);
    });

    it('evaluates "in" operator correctly', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          conditions: [{ id: 'c1', type: 'if', expression: '', field: 'channel', operator: 'in', value: ['whatsapp', 'facebook'] } as any],
          actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }],
        },
      });

      const context = makeContext({ channel: 'whatsapp' });
      const result = await executor.execute(workflow, context);
      expect(result.actionsExecuted).toBe(1);
    });

    it('evaluates nested field paths correctly', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          conditions: [{ id: 'c1', type: 'if', expression: '', field: 'user.role', operator: 'equals', value: 'admin' } as any],
          actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }],
        },
      });

      const context = makeContext({ user: { role: 'admin' } });
      const result = await executor.execute(workflow, context);
      expect(result.actionsExecuted).toBe(1);
    });

    it('returns false for conditions with invalid/unknown operator', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          conditions: [{ id: 'c1', type: 'if', expression: '', field: 'x', operator: 'unknown_op', value: 1 } as any],
          actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }],
        },
      });

      const context = makeContext({ x: 1 });
      const result = await executor.execute(workflow, context);
      // Unknown operator evaluates to false → conditions not met → actions skipped
      expect(result.actionsExecuted).toBe(0);
    });
  });

  describe('workflow execution', () => {
    it('fails for disabled workflow', async () => {
      const workflow = makeWorkflow({ enabled: false });
      const context = makeContext();
      const result = await executor.execute(workflow, context);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/disabled/i);
    });

    it('executes actions when no conditions defined', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          actions: [
            { id: 'a1', type: 'create_task', config: { title: 'Do something' } },
            { id: 'a2', type: 'send_message', config: { channel: 'email' } },
          ],
        },
      });

      const context = makeContext();
      const result = await executor.execute(workflow, context);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(2);
    });

    it('returns execution duration', async () => {
      const workflow = makeWorkflow({
        definition: { triggers: [], actions: [{ id: 'a1', type: 'create_task', config: { title: 'test' } }] },
      });

      const result = await executor.execute(workflow, makeContext());
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('throws on unknown action type', async () => {
      const workflow = makeWorkflow({
        definition: {
          triggers: [],
          actions: [{ id: 'a1', type: 'unknown_type' as any, config: {} }],
        },
      });

      const result = await executor.execute(workflow, makeContext());
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/unknown action/i);
    });
  });
});
