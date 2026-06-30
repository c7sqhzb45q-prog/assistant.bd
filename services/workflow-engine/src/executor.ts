/**
 * Workflow Engine - Core execution logic
 * Handles: triggers, conditions, and actions
 */

import { Workflow, Action } from '@assistant.bd/types';

export interface WorkflowContext {
  workflowId: string;
  triggerId: string;
  data: Record<string, any>;
  executionId: string;
  startTime: Date;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
  actionsExecuted: number;
}

export class WorkflowExecutor {
  /**
   * Execute a complete workflow
   */
  async execute(
    workflow: Workflow,
    context: WorkflowContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`[Workflow] Executing ${workflow.id}`, context);

      if (!workflow.enabled) {
        throw new Error('Workflow is disabled');
      }

      const definition = workflow.definition;

      // Step 1: Evaluate conditions
      if (definition.conditions && definition.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(
          definition.conditions,
          context,
        );

        if (!conditionsMet) {
          console.log(
            `[Workflow] Conditions not met for ${workflow.id}, skipping actions`,
          );
          return {
            success: true,
            output: { skipped: true, reason: 'conditions_not_met' },
            duration: Date.now() - startTime,
            actionsExecuted: 0,
          };
        }
      }

      // Step 2: Execute actions in sequence
      let actionsExecuted = 0;
      let lastOutput: any = null;

      for (const action of definition.actions) {
        try {
          console.log(`[Workflow] Executing action ${action.id}`);
          lastOutput = await this.executeAction(action, context, lastOutput);
          actionsExecuted++;
        } catch (error) {
          console.error(`[Workflow] Action ${action.id} failed:`, error);
          // Continue or fail based on error handling strategy
          throw error;
        }
      }

      return {
        success: true,
        output: lastOutput,
        duration: Date.now() - startTime,
        actionsExecuted,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Workflow] Execution failed: ${message}`);
      return {
        success: false,
        error: message,
        duration: Date.now() - startTime,
        actionsExecuted: 0,
      };
    }
  }

  /**
   * Evaluate all conditions
   */
  private async evaluateConditions(conditions: any[], context: WorkflowContext) {
    // Simplified condition evaluation
    // In production, use a proper rule engine (e.g., Drools, JSON Logic)

    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: any, context: WorkflowContext): boolean {
    // Safe condition evaluation using structured comparisons
    // Conditions use: { field, operator, value } instead of raw expressions

    try {
      const { field, operator, value } = condition;

      if (!field || !operator) {
        console.error('Condition missing required field or operator:', condition);
        return false;
      }

      const fieldValue = this.getNestedValue(context.data, field);

      switch (operator) {
        case 'equals':
        case '===':
          return fieldValue === value;
        case 'not_equals':
        case '!==':
          return fieldValue !== value;
        case 'greater_than':
        case '>':
          return fieldValue != null && fieldValue > value;
        case 'less_than':
        case '<':
          return fieldValue != null && fieldValue < value;
        case 'greater_than_or_equals':
        case '>=':
          return fieldValue != null && fieldValue >= value;
        case 'less_than_or_equals':
        case '<=':
          return fieldValue != null && fieldValue <= value;
        case 'contains':
          return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value);
        case 'not_contains':
          return typeof fieldValue === 'string' && typeof value === 'string' && !fieldValue.includes(value);
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(value) && !value.includes(fieldValue);
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'not_exists':
          return fieldValue === undefined || fieldValue === null;
        default:
          console.error(`Unknown condition operator: ${operator}`);
          return false;
      }
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  /**
   * Safely access a nested property using dot notation (e.g. "priority" or "user.role")
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: Action,
    context: WorkflowContext,
    previousOutput: any,
  ): Promise<any> {
    switch (action.type) {
      case 'send_message':
        return this.sendMessage(action.config, context);

      case 'api_call':
        return this.callAPI(action.config, context, previousOutput);

      case 'create_task':
        return this.createTask(action.config, context);

      case 'run_agent':
        return this.runAgent(action.config, context);

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send a message (WhatsApp, Email, etc)
   */
  private async sendMessage(config: any, _context: WorkflowContext) {
    console.log(`[Action] Sending message via ${config.channel}`);
    // Call messaging service
    return {
      messageId: 'msg_123',
      status: 'sent',
      timestamp: new Date(),
    };
  }

  /**
   * Call external API
   */
  private async callAPI(
    config: any,
    _context: WorkflowContext,
    _previousOutput: any,
  ) {
    console.log(`[Action] Calling API: ${config.url}`);
    // Make HTTP request
    return {
      status: 200,
      data: {},
    };
  }

  /**
   * Create a task/reminder
   */
  private async createTask(config: any, _context: WorkflowContext) {
    console.log(`[Action] Creating task: ${config.title}`);
    return {
      taskId: 'task_123',
      created: true,
    };
  }

  /**
   * Run an AI agent
   */
  private async runAgent(config: any, _context: WorkflowContext) {
    console.log(`[Action] Running agent: ${config.agentId}`);
    // Route to AI Orchestrator
    return {
      agentResponse: 'Agent processed the request',
    };
  }
}

export default new WorkflowExecutor();
