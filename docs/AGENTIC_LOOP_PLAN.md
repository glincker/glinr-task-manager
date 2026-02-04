# GLINR Agentic Loop Implementation Plan

> **Goal**: Build a proper session-based agentic loop system that runs continuously until task completion, like OpenClaw's pi-agent-core.

## Problem Statement

Current GLINR chat:
- Stops after 5 tool calls (hardcoded `maxSteps`)
- No context persistence between tool calls
- No session state management
- Model doesn't follow through with multi-step tasks
- Uses deprecated Vercel AI SDK API (`maxSteps`)

OpenClaw reference:
- Infinite steps until task completion
- Session-based execution with event subscription
- Rich context passed between steps
- Goal completion detection
- Event-driven architecture

## Comparison: OpenClaw vs GLINR

| Feature | OpenClaw | GLINR (Current) |
|---------|----------|-----------------|
| Step Limit | Infinite (until goal complete) | Fixed 5 steps |
| Session State | Full session management | None |
| Context | Rich context between steps | Tool descriptions only |
| Stop Condition | Goal completion detection | Step count |
| Event System | Full event subscription | Basic SSE |
| Tool Guidance | Dynamic hints in responses | Static descriptions |

## Solution Architecture

### Directory Structure
```
src/
├── agents/
│   ├── index.ts              # Public exports
│   ├── types.ts              # Agent types/interfaces
│   ├── state.ts              # AgentState management
│   ├── executor.ts           # AgentExecutor class
│   ├── stop-conditions.ts    # Custom stop condition functions
│   └── context-builder.ts    # Build context for each step
├── chat/
│   └── execution/
│       └── tools/
│           └── complete-task.ts  # Task completion tool
```

### Phase 1: Agent Types & State (Foundation)

**File: `src/agents/types.ts`**
```typescript
export type AgentStatus = 'idle' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';

export interface AgentState {
  sessionId: string;
  conversationId: string;
  status: AgentStatus;
  goal: string;
  currentStep: number;
  maxBudget: number;        // Max tokens to spend
  usedBudget: number;       // Tokens used so far
  toolCallHistory: ToolCallRecord[];
  pendingToolCalls: ToolCallRecord[];
  context: Record<string, unknown>;  // Accumulated context
  createdAt: number;
  updatedAt: number;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'approved' | 'denied' | 'executed' | 'failed';
  startedAt: number;
  completedAt?: number;
}

export interface StopCondition {
  name: string;
  check: (state: AgentState, lastResult: unknown) => boolean | Promise<boolean>;
}

export interface AgentConfig {
  maxSteps?: number;           // Optional hard limit (default: 100)
  maxBudget?: number;          // Token budget
  stopConditions: StopCondition[];
  onStep?: (state: AgentState) => void;
  onComplete?: (state: AgentState) => void;
  onError?: (error: Error, state: AgentState) => void;
}
```

### Phase 2: Stop Conditions

**File: `src/agents/stop-conditions.ts`**
```typescript
import type { AgentState, StopCondition } from './types.js';

// Stop after N steps (safety limit)
export function stepCountIs(maxSteps: number): StopCondition {
  return {
    name: `stepCount:${maxSteps}`,
    check: (state) => state.currentStep >= maxSteps,
  };
}

// Stop when specific tool is called
export function hasToolCall(toolName: string): StopCondition {
  return {
    name: `hasToolCall:${toolName}`,
    check: (state) => state.toolCallHistory.some(t => t.name === toolName),
  };
}

// Stop when budget exceeded
export function budgetExceeded(): StopCondition {
  return {
    name: 'budgetExceeded',
    check: (state) => state.usedBudget >= state.maxBudget,
  };
}

// Stop when task marked complete (via complete_task tool)
export function taskCompleted(): StopCondition {
  return {
    name: 'taskCompleted',
    check: (state) => {
      const lastCall = state.toolCallHistory[state.toolCallHistory.length - 1];
      return lastCall?.name === 'complete_task' && lastCall.status === 'executed';
    },
  };
}

// Stop when model indicates no more actions needed
export function noMoreActions(): StopCondition {
  return {
    name: 'noMoreActions',
    check: (state, lastResult) => {
      // Check if model response indicates completion
      if (typeof lastResult === 'object' && lastResult !== null) {
        const result = lastResult as Record<string, unknown>;
        return result.done === true || result.complete === true;
      }
      return false;
    },
  };
}

// Default stop conditions for GLINR
export const defaultStopConditions: StopCondition[] = [
  stepCountIs(100),          // Hard safety limit
  budgetExceeded(),          // Token budget limit
  taskCompleted(),           // Task marked complete
];
```

### Phase 3: Complete Task Tool

**File: `src/chat/execution/tools/complete-task.ts`**
```typescript
import { z } from 'zod';
import type { ToolDefinition } from '../types.js';

const CompleteTaskParamsSchema = z.object({
  summary: z.string().describe('Summary of what was accomplished'),
  artifacts: z.array(z.object({
    type: z.enum(['ticket', 'commit', 'file', 'pr', 'other']),
    id: z.string(),
    description: z.string().optional(),
  })).optional().describe('Artifacts created during task'),
  nextSteps: z.array(z.string()).optional().describe('Suggested follow-up actions'),
});

export const completeTaskTool: ToolDefinition = {
  name: 'complete_task',
  description: `Mark the current task as complete. Call this when you have FULLY accomplished the user's request.

IMPORTANT: Only call this when:
1. All requested actions have been performed
2. The user's goal has been achieved
3. You have a summary of what was done

DO NOT call this if you're still in the middle of completing a task.`,
  category: 'agent',
  securityLevel: 'safe',
  parameters: CompleteTaskParamsSchema,

  async execute(_context, params) {
    return {
      success: true,
      data: {
        complete: true,
        summary: params.summary,
        artifacts: params.artifacts || [],
        nextSteps: params.nextSteps || [],
      },
    };
  },
};
```

### Phase 4: Agent Executor

**File: `src/agents/executor.ts`**
```typescript
import { generateText } from 'ai';
import type { AgentState, AgentConfig, ToolCallRecord } from './types.js';
import { defaultStopConditions } from './stop-conditions.js';
import { EventEmitter } from 'events';

export class AgentExecutor extends EventEmitter {
  private state: AgentState;
  private config: AgentConfig;
  private abortController: AbortController;

  constructor(
    sessionId: string,
    conversationId: string,
    goal: string,
    config: Partial<AgentConfig> = {}
  ) {
    super();
    this.abortController = new AbortController();
    this.config = {
      maxSteps: config.maxSteps ?? 100,
      maxBudget: config.maxBudget ?? 100000,
      stopConditions: config.stopConditions ?? defaultStopConditions,
      ...config,
    };
    this.state = {
      sessionId,
      conversationId,
      status: 'idle',
      goal,
      currentStep: 0,
      maxBudget: this.config.maxBudget!,
      usedBudget: 0,
      toolCallHistory: [],
      pendingToolCalls: [],
      context: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async run(model: any, messages: any[], tools: Record<string, any>): Promise<AgentState> {
    this.state.status = 'running';
    this.emit('start', this.state);

    try {
      while (!this.shouldStop()) {
        this.state.currentStep++;
        this.state.updatedAt = Date.now();
        this.emit('step:start', this.state);

        // Build context for this step
        const stepContext = this.buildStepContext();

        // Run one step
        const result = await generateText({
          model,
          messages: [
            ...messages,
            // Inject accumulated context
            {
              role: 'system',
              content: `AGENT CONTEXT:\n${JSON.stringify(stepContext, null, 2)}`,
            },
          ],
          tools,
          maxSteps: 1, // One step at a time for control
          abortSignal: this.abortController.signal,
        });

        // Track token usage
        this.state.usedBudget += result.usage?.totalTokens ?? 0;

        // Process tool calls
        for (const step of result.steps) {
          for (const toolCall of step.toolCalls) {
            const record: ToolCallRecord = {
              id: toolCall.toolCallId,
              name: toolCall.toolName,
              args: toolCall.args,
              result: step.toolResults.find(r => r.toolCallId === toolCall.toolCallId)?.result,
              status: 'executed',
              startedAt: Date.now(),
              completedAt: Date.now(),
            };
            this.state.toolCallHistory.push(record);

            // Extract context from tool results
            this.extractContext(record);
          }
        }

        this.emit('step:complete', this.state, result);

        // Check stop conditions
        for (const condition of this.config.stopConditions) {
          if (await condition.check(this.state, result)) {
            this.state.status = 'completed';
            this.emit('complete', this.state, condition.name);
            return this.state;
          }
        }
      }

      this.state.status = 'completed';
      this.emit('complete', this.state, 'maxSteps');
      return this.state;

    } catch (error) {
      this.state.status = 'failed';
      this.emit('error', error, this.state);
      throw error;
    }
  }

  private shouldStop(): boolean {
    return (
      this.state.status !== 'running' ||
      this.state.currentStep >= (this.config.maxSteps ?? 100)
    );
  }

  private buildStepContext(): Record<string, unknown> {
    return {
      step: this.state.currentStep,
      goal: this.state.goal,
      toolsUsed: this.state.toolCallHistory.map(t => t.name),
      lastToolResult: this.state.toolCallHistory[this.state.toolCallHistory.length - 1]?.result,
      accumulatedContext: this.state.context,
      hint: this.getNextHint(),
    };
  }

  private extractContext(record: ToolCallRecord): void {
    // Extract useful context from tool results
    if (record.result && typeof record.result === 'object') {
      const result = record.result as Record<string, unknown>;

      // Store hints from tools
      if (result.hint) {
        this.state.context.lastHint = result.hint;
      }

      // Store project keys from list_projects
      if (record.name === 'list_projects' && result.projects) {
        this.state.context.availableProjects = result.projects;
      }

      // Store created ticket info
      if (record.name === 'create_ticket' && result.ticket) {
        this.state.context.createdTickets = [
          ...((this.state.context.createdTickets as any[]) || []),
          result.ticket,
        ];
      }
    }
  }

  private getNextHint(): string {
    const lastHint = this.state.context.lastHint as string;
    if (lastHint) return lastHint;

    // Default hints based on goal
    if (this.state.goal.toLowerCase().includes('ticket') && !this.state.context.createdTickets) {
      if (!this.state.context.availableProjects) {
        return 'First call list_projects to get available project keys.';
      }
      return 'You have project keys. Now call create_ticket to create the ticket.';
    }

    return 'Continue working towards the goal. Call complete_task when done.';
  }

  cancel(): void {
    this.abortController.abort();
    this.state.status = 'cancelled';
    this.emit('cancelled', this.state);
  }

  getState(): AgentState {
    return { ...this.state };
  }
}
```

### Phase 5: Update Chat Routes

**File: `src/routes/chat.ts` (modifications)**
```typescript
// Add import
import { AgentExecutor } from '../agents/executor.js';
import { completeTaskTool } from '../chat/execution/tools/complete-task.js';

// In the chat handler, replace generateText with AgentExecutor:
async function handleAgenticChat(request, conversationId, messages, tools, model) {
  // Create agent executor
  const agent = new AgentExecutor(
    request.sessionId ?? crypto.randomUUID(),
    conversationId,
    extractGoal(messages), // Get user's goal from messages
    {
      maxSteps: 100,
      maxBudget: 100000,
    }
  );

  // Add complete_task tool
  const allTools = {
    ...tools,
    complete_task: completeTaskTool,
  };

  // Set up event handlers for SSE streaming
  agent.on('step:start', (state) => {
    sendSSE({ type: 'step:start', step: state.currentStep });
  });

  agent.on('step:complete', (state, result) => {
    sendSSE({ type: 'step:complete', step: state.currentStep, result });
  });

  agent.on('complete', (state, reason) => {
    sendSSE({ type: 'complete', reason, state });
  });

  // Run the agent
  const finalState = await agent.run(model, messages, allTools);
  return finalState;
}
```

## Implementation Order

1. **Phase 1**: Create `src/agents/types.ts` - Define all types
2. **Phase 2**: Create `src/agents/stop-conditions.ts` - Stop condition functions
3. **Phase 3**: Create `src/chat/execution/tools/complete-task.ts` - Completion tool
4. **Phase 4**: Create `src/agents/executor.ts` - Main executor class
5. **Phase 5**: Create `src/agents/index.ts` - Public exports
6. **Phase 6**: Update `src/routes/chat.ts` - Integrate AgentExecutor
7. **Phase 7**: Update `src/providers/ai-sdk.ts` - Remove deprecated `maxSteps`

## Testing Plan

1. Test ticket creation flow:
   - User says "create a bug ticket"
   - Agent calls `list_projects` → gets hint
   - Agent calls `create_ticket` with project key
   - Agent calls `complete_task` with summary
   - Loop stops, user sees result

2. Test budget limits:
   - Set low budget
   - Verify agent stops when budget exceeded

3. Test cancellation:
   - Start long-running task
   - Cancel mid-execution
   - Verify clean shutdown

## Migration Notes

- Keep existing `maxSteps` as fallback initially
- Gradually migrate all chat endpoints to use `AgentExecutor`
- Add feature flag for agentic mode vs simple chat mode
- Monitor token usage during testing

## Success Criteria

- [ ] Agent continues until task is complete (not fixed step count)
- [ ] Context persists between tool calls
- [ ] Hints guide model to next action
- [ ] `complete_task` tool signals goal completion
- [ ] Token budget prevents runaway costs
- [ ] Events stream to UI in real-time
- [ ] Cancellation works cleanly
