/**
 * Agent Executor
 *
 * The main orchestrator for the GLINR agentic loop system.
 * Runs tools continuously until task completion, with context persistence
 * between steps and proper stop condition handling.
 *
 * Based on patterns from:
 * - OpenClaw pi-agent-core (session-based execution)
 * - Vercel AI SDK v5.0 (stopWhen API)
 */

import { generateText } from 'ai';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import type {
  AgentState,
  AgentConfig,
  AgentContext,
  AgentResult,
  AgentEvents,
  ToolCallRecord,
  StepContext,
  StopCondition,
} from './types.js';
import { defaultStopConditions, taskCompleted } from './stop-conditions.js';
import { logger } from '../utils/logger.js';

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: Required<AgentConfig> = {
  maxSteps: 100,
  maxBudget: 100000, // 100k tokens
  stopConditions: defaultStopConditions,
  securityMode: 'ask',
  stepTimeoutMs: 60000, // 1 minute per step
  enableStreaming: true,
};

// =============================================================================
// Agent Executor Class
// =============================================================================

export class AgentExecutor extends EventEmitter<AgentEvents> {
  private state: AgentState;
  private config: Required<AgentConfig>;
  private abortController: AbortController;
  private isRunning: boolean = false;

  constructor(
    sessionId: string,
    conversationId: string,
    goal: string,
    config: Partial<AgentConfig> = {}
  ) {
    super();
    this.abortController = new AbortController();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Ensure taskCompleted is always included in stop conditions
    if (!this.config.stopConditions.some((c) => c.name === 'taskCompleted')) {
      this.config.stopConditions.push(taskCompleted());
    }

    this.state = {
      sessionId,
      conversationId,
      status: 'idle',
      goal,
      currentStep: 0,
      maxBudget: this.config.maxBudget,
      usedBudget: 0,
      toolCallHistory: [],
      pendingToolCalls: [],
      context: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    logger.info('[AgentExecutor] Created new agent', {
      sessionId,
      conversationId,
      goal: goal.substring(0, 100),
      maxSteps: this.config.maxSteps,
      maxBudget: this.config.maxBudget,
    });
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Run the agent until completion or stop condition.
   */
  async run(
    model: any,
    messages: any[],
    tools: Record<string, any>,
    onToolExecute?: (name: string, args: Record<string, unknown>) => Promise<unknown>
  ): Promise<AgentState> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    this.isRunning = true;
    this.state.status = 'running';
    this.state.updatedAt = Date.now();
    this.emit('start', this.state);

    logger.info('[AgentExecutor] Starting agent run', {
      sessionId: this.state.sessionId,
      goal: this.state.goal,
    });

    try {
      // Main agent loop
      while (this.shouldContinue()) {
        const stepResult = await this.executeStep(model, messages, tools, onToolExecute);

        // Check stop conditions
        const stoppedByCondition = await this.checkStopConditions(stepResult);
        if (stoppedByCondition) {
          break;
        }
      }

      // Finalize
      this.finalize();
      return this.state;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Cancel the running agent.
   */
  cancel(): void {
    logger.info('[AgentExecutor] Cancelling agent', { sessionId: this.state.sessionId });
    this.abortController.abort();
    this.state.status = 'cancelled';
    this.state.updatedAt = Date.now();
    this.emit('cancelled', this.state);
  }

  /**
   * Get the current state.
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Approve pending tool calls.
   */
  approvePendingTools(approved: boolean): void {
    if (this.state.status !== 'waiting_approval') {
      logger.warn('[AgentExecutor] No pending approvals');
      return;
    }

    logger.info('[AgentExecutor] Approval received', { approved });

    for (const toolCall of this.state.pendingToolCalls) {
      toolCall.status = approved ? 'approved' : 'denied';
    }

    this.state.status = 'running';
    this.emit('approval:received', this.state, approved);
  }

  // ===========================================================================
  // Core Loop
  // ===========================================================================

  private shouldContinue(): boolean {
    return (
      this.state.status === 'running' &&
      this.state.currentStep < this.config.maxSteps &&
      !this.abortController.signal.aborted
    );
  }

  private async executeStep(
    model: any,
    messages: any[],
    tools: Record<string, any>,
    onToolExecute?: (name: string, args: Record<string, unknown>) => Promise<unknown>
  ): Promise<unknown> {
    this.state.currentStep++;
    this.state.updatedAt = Date.now();
    this.emit('step:start', this.state);

    logger.debug('[AgentExecutor] Executing step', {
      step: this.state.currentStep,
      usedBudget: this.state.usedBudget,
    });

    // Build step context
    const stepContext = this.buildStepContext();

    // Prepare messages with injected context
    const messagesWithContext = this.injectContext(messages, stepContext);

    try {
      // Execute one step with the model
      const result = await generateText({
        model,
        messages: messagesWithContext,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        maxSteps: 1, // Single step for control
        abortSignal: this.abortController.signal,
      } as any);

      // Update budget
      const usage = result.usage as { promptTokens?: number; completionTokens?: number } | undefined;
      const tokensUsed = (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0);
      this.state.usedBudget += tokensUsed;

      // Process tool calls from this step
      await this.processToolCalls(result, onToolExecute);

      this.emit('step:complete', this.state, result);

      logger.debug('[AgentExecutor] Step completed', {
        step: this.state.currentStep,
        toolCalls: result.steps?.[0]?.toolCalls?.length ?? 0,
        tokensUsed,
        text: result.text?.substring(0, 100),
      });

      return result;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        logger.info('[AgentExecutor] Step aborted');
        throw error;
      }

      logger.error('[AgentExecutor] Step error', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  private async processToolCalls(
    result: any,
    onToolExecute?: (name: string, args: Record<string, unknown>) => Promise<unknown>
  ): Promise<void> {
    const steps = result.steps ?? [];

    for (const step of steps) {
      const toolCalls = step.toolCalls ?? [];
      const toolResults = step.toolResults ?? [];

      for (let i = 0; i < toolCalls.length; i++) {
        const toolCall = toolCalls[i];
        const toolResult = toolResults.find((r: any) => r.toolCallId === toolCall.toolCallId);

        const record: ToolCallRecord = {
          id: toolCall.toolCallId ?? randomUUID(),
          name: toolCall.toolName,
          args: toolCall.args ?? {},
          result: toolResult?.result,
          status: toolResult ? 'executed' : 'pending',
          startedAt: Date.now(),
          completedAt: toolResult ? Date.now() : undefined,
        };

        // If we have a custom executor and the tool wasn't already executed
        if (onToolExecute && !toolResult) {
          try {
            record.result = await onToolExecute(record.name, record.args);
            record.status = 'executed';
            record.completedAt = Date.now();
          } catch (error) {
            record.status = 'failed';
            record.error = error instanceof Error ? error.message : 'Unknown error';
            record.completedAt = Date.now();
          }
        }

        this.state.toolCallHistory.push(record);
        this.emit('tool:call', this.state, record);

        // Extract context from tool results
        this.extractContext(record);

        if (record.status === 'executed') {
          this.emit('tool:result', this.state, record);
        }
      }
    }
  }

  // ===========================================================================
  // Context Management
  // ===========================================================================

  private buildStepContext(): StepContext {
    return {
      step: this.state.currentStep,
      goal: this.state.goal,
      toolsUsed: this.state.toolCallHistory.map((t) => t.name),
      lastToolResult: this.getLastToolResult(),
      accumulatedContext: this.state.context,
      hint: this.getNextHint(),
      remainingBudget: this.state.maxBudget - this.state.usedBudget,
    };
  }

  private injectContext(messages: any[], stepContext: StepContext): any[] {
    // Find or create system message
    const systemIndex = messages.findIndex((m) => m.role === 'system');

    const contextBlock = `

## AGENT CONTEXT (Step ${stepContext.step})

**Goal:** ${stepContext.goal}

**Progress:**
- Steps completed: ${stepContext.step - 1}
- Tools used: ${stepContext.toolsUsed.length > 0 ? stepContext.toolsUsed.join(', ') : 'none yet'}
- Remaining budget: ${stepContext.remainingBudget.toLocaleString()} tokens

**Accumulated Context:**
${JSON.stringify(stepContext.accumulatedContext, null, 2)}

**Next Action Hint:**
${stepContext.hint}

**IMPORTANT:** Continue working towards the goal. When you have FULLY completed the task, call the \`complete_task\` tool with a summary of what was accomplished.
`;

    if (systemIndex >= 0) {
      // Append to existing system message
      const updatedMessages = [...messages];
      updatedMessages[systemIndex] = {
        ...updatedMessages[systemIndex],
        content: updatedMessages[systemIndex].content + contextBlock,
      };
      return updatedMessages;
    } else {
      // Add new system message at the beginning
      return [
        {
          role: 'system',
          content: `You are an AI agent working to complete the user's task.${contextBlock}`,
        },
        ...messages,
      ];
    }
  }

  private extractContext(record: ToolCallRecord): void {
    if (!record.result || typeof record.result !== 'object') {
      return;
    }

    const result = record.result as Record<string, unknown>;

    // Store hints from tools
    if (result.hint) {
      this.state.context.lastHint = result.hint as string;
    }

    // Store data from tool results
    if (result.data && typeof result.data === 'object') {
      const data = result.data as Record<string, unknown>;

      // Projects from list_projects
      if (record.name === 'list_projects' && data.projects) {
        this.state.context.availableProjects = (data.projects as any[]).map((p) => ({
          key: p.key,
          name: p.name,
          id: p.id,
        }));
      }

      // Tickets from create_ticket
      if (record.name === 'create_ticket' && data.id) {
        const tickets = (this.state.context.createdTickets ?? []) as any[];
        tickets.push({
          id: data.id as string,
          key: data.key as string,
          title: data.title as string,
          type: data.type as string,
        });
        this.state.context.createdTickets = tickets;
      }

      // Projects from create_project
      if (record.name === 'create_project' && data.id) {
        const projects = (this.state.context.availableProjects ?? []) as any[];
        projects.push({
          id: data.id as string,
          key: data.key as string,
          name: data.name as string,
        });
        this.state.context.availableProjects = projects;
      }
    }
  }

  private getLastToolResult(): unknown | undefined {
    const lastCall = this.state.toolCallHistory[this.state.toolCallHistory.length - 1];
    return lastCall?.result;
  }

  private getNextHint(): string {
    // Return last hint from tools
    const lastHint = this.state.context.lastHint;
    if (lastHint) {
      return lastHint;
    }

    // Generate hints based on goal and context
    const goal = this.state.goal.toLowerCase();

    // Ticket creation workflow
    if (
      (goal.includes('ticket') || goal.includes('task') || goal.includes('bug')) &&
      !this.state.context.createdTickets
    ) {
      if (!this.state.context.availableProjects) {
        return 'First, call list_projects to get available project keys for creating tickets.';
      }
      const projectKeys = (this.state.context.availableProjects as any[])?.map((p) => p.key).join(', ');
      return `You have project keys: ${projectKeys}. Now call create_ticket with one of these projectKeys.`;
    }

    // Project creation
    if (goal.includes('project') && !this.state.context.availableProjects?.length) {
      return 'Call create_project to create a new project, then you can create tickets in it.';
    }

    // Default hint
    if (this.state.toolCallHistory.length === 0) {
      return 'Start by gathering the information you need, then perform the requested actions.';
    }

    return 'Continue working towards the goal. Call complete_task when finished.';
  }

  // ===========================================================================
  // Stop Conditions
  // ===========================================================================

  private async checkStopConditions(lastResult: unknown): Promise<boolean> {
    for (const condition of this.config.stopConditions) {
      try {
        const shouldStop = await condition.check(this.state, lastResult);
        if (shouldStop) {
          logger.info('[AgentExecutor] Stop condition met', {
            condition: condition.name,
            step: this.state.currentStep,
          });
          this.state.status = 'completed';
          this.emit('complete', this.state, condition.name);
          return true;
        }
      } catch (error) {
        logger.error(
          `[AgentExecutor] Error checking stop condition: ${condition.name}`,
          error instanceof Error ? error : undefined
        );
      }
    }
    return false;
  }

  // ===========================================================================
  // Finalization
  // ===========================================================================

  private finalize(): void {
    const completedViaTask = this.state.toolCallHistory.some(
      (t) => t.name === 'complete_task' && t.status === 'executed'
    );

    // Extract summary from complete_task if available
    let summary = `Agent completed after ${this.state.currentStep} steps.`;
    const completionCall = this.state.toolCallHistory.find(
      (t) => t.name === 'complete_task' && t.status === 'executed'
    );
    if (completionCall?.result) {
      const result = completionCall.result as Record<string, unknown>;
      if (result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        summary = (data.summary as string) ?? summary;
      }
    }

    this.state.finalResult = {
      success: completedViaTask || this.state.status === 'completed',
      summary,
      artifacts: this.collectArtifacts(),
      nextSteps: this.collectNextSteps(),
      stopReason: completedViaTask ? 'taskCompleted' : 'maxSteps',
      totalSteps: this.state.currentStep,
      totalTokens: this.state.usedBudget,
    };

    this.state.updatedAt = Date.now();

    logger.info('[AgentExecutor] Agent finalized', {
      sessionId: this.state.sessionId,
      status: this.state.status,
      steps: this.state.currentStep,
      tokens: this.state.usedBudget,
      success: this.state.finalResult.success,
    });
  }

  private collectArtifacts(): AgentResult['artifacts'] {
    const artifacts: AgentResult['artifacts'] = [];

    // Collect from created tickets
    const tickets = this.state.context.createdTickets as any[];
    if (tickets) {
      for (const ticket of tickets) {
        artifacts.push({
          type: 'ticket',
          id: ticket.key ?? ticket.id,
          description: ticket.title,
        });
      }
    }

    // Collect from complete_task call
    const completionCall = this.state.toolCallHistory.find(
      (t) => t.name === 'complete_task' && t.status === 'executed'
    );
    if (completionCall?.result) {
      const result = completionCall.result as Record<string, unknown>;
      if (result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        const taskArtifacts = data.artifacts as any[];
        if (taskArtifacts) {
          for (const artifact of taskArtifacts) {
            // Avoid duplicates
            if (!artifacts.some((a) => a.id === artifact.id)) {
              artifacts.push(artifact);
            }
          }
        }
      }
    }

    return artifacts;
  }

  private collectNextSteps(): string[] {
    const completionCall = this.state.toolCallHistory.find(
      (t) => t.name === 'complete_task' && t.status === 'executed'
    );
    if (completionCall?.result) {
      const result = completionCall.result as Record<string, unknown>;
      if (result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        return (data.nextSteps as string[]) ?? [];
      }
    }
    return [];
  }

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  private handleError(error: Error): void {
    this.state.status = 'failed';
    this.state.updatedAt = Date.now();
    this.state.finalResult = {
      success: false,
      summary: `Agent failed: ${error.message}`,
      artifacts: this.collectArtifacts(),
      stopReason: 'error',
      totalSteps: this.state.currentStep,
      totalTokens: this.state.usedBudget,
    };
    this.emit('error', error, this.state);

    logger.error('[AgentExecutor] Agent failed', error);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an agent executor with default configuration.
 */
export function createAgent(
  sessionId: string,
  conversationId: string,
  goal: string,
  config?: Partial<AgentConfig>
): AgentExecutor {
  return new AgentExecutor(sessionId, conversationId, goal, config);
}

/**
 * Create an agent executor for simple tasks with lower limits.
 */
export function createSimpleAgent(
  sessionId: string,
  conversationId: string,
  goal: string
): AgentExecutor {
  return new AgentExecutor(sessionId, conversationId, goal, {
    maxSteps: 20,
    maxBudget: 20000,
  });
}

/**
 * Create an agent executor for complex tasks with higher limits.
 */
export function createComplexAgent(
  sessionId: string,
  conversationId: string,
  goal: string
): AgentExecutor {
  return new AgentExecutor(sessionId, conversationId, goal, {
    maxSteps: 200,
    maxBudget: 200000,
  });
}
