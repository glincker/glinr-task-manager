/**
 * Agentic Chat Executor
 *
 * Handles agentic mode chat using the AgentExecutor for multi-step task completion.
 * This is the bridge between the chat routes and the agent system.
 */

import { randomUUID } from 'node:crypto';
import { AgentExecutor, type AgentState, type AgentConfig } from '../agents/index.js';
import { aiProvider, MODEL_ALIASES, type ChatMessage } from '../providers/index.js';
import { logger } from '../utils/logger.js';
import type { ChatToolHandler } from './tool-handler.js';

// =============================================================================
// Types
// =============================================================================

export interface AgenticChatRequest {
  conversationId: string;
  messages: ChatMessage[];
  systemPrompt: string;
  model?: string;
  temperature?: number;
  toolHandler: ChatToolHandler;
  tools: Array<{
    name: string;
    description: string;
    parameters: unknown;
  }>;
  onStep?: (state: AgentState) => void;
  onToolCall?: (state: AgentState, toolName: string, args: Record<string, unknown>) => void;
  onToolResult?: (state: AgentState, toolName: string, result: unknown) => void;
}

export interface AgenticChatResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    status: 'success' | 'error';
  }>;
  agentState: {
    sessionId: string;
    totalSteps: number;
    stopReason: string;
    artifacts: Array<{
      type: string;
      id: string;
      description?: string;
    }>;
  };
}

// =============================================================================
// Agentic Chat Executor
// =============================================================================

/**
 * Execute an agentic chat conversation.
 * Uses the AgentExecutor to run tools continuously until task completion.
 */
export async function executeAgenticChat(
  request: AgenticChatRequest
): Promise<AgenticChatResponse> {
  const sessionId = randomUUID();

  // Extract the user's goal from the last user message
  const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
  const goal = lastUserMessage?.content || 'Complete the user request';

  logger.info('[AgenticChat] Starting agentic execution', {
    sessionId,
    conversationId: request.conversationId,
    goal: goal.substring(0, 100),
  });

  // Create agent configuration
  const agentConfig: Partial<AgentConfig> = {
    maxSteps: 50, // Allow up to 50 steps for complex tasks
    maxBudget: 50000, // 50k token budget
    securityMode: 'ask', // Prompt for approval when needed
    enableStreaming: true,
  };

  // Create the agent executor
  const agent = new AgentExecutor(sessionId, request.conversationId, goal, agentConfig);

  // Set up event handlers
  if (request.onStep) {
    agent.on('step:start', request.onStep);
  }

  if (request.onToolCall) {
    agent.on('tool:call', (state, toolCall) => {
      request.onToolCall!(state, toolCall.name, toolCall.args);
    });
  }

  if (request.onToolResult) {
    agent.on('tool:result', (state, toolCall) => {
      request.onToolResult!(state, toolCall.name, toolCall.result);
    });
  }

  // Resolve the model
  const modelRef = request.model || 'sonnet';
  const aliasEntry = MODEL_ALIASES[modelRef as keyof typeof MODEL_ALIASES];
  const provider = aliasEntry?.provider || 'anthropic';
  const modelId = aliasEntry?.model || modelRef;

  // Get the model instance
  const model = aiProvider.getModel(provider, modelId);

  // Convert tools to the format expected by the AI SDK
  const tools: Record<string, any> = {};
  for (const tool of request.tools) {
    tools[tool.name] = {
      description: tool.description,
      parameters: tool.parameters,
    };
  }

  // Build messages with system prompt
  const messages = [
    { role: 'system' as const, content: request.systemPrompt },
    ...request.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];

  // Tool execution handler
  const onToolExecute = async (toolName: string, args: Record<string, unknown>): Promise<unknown> => {
    const result = await request.toolHandler.executeTool(toolName, args, randomUUID());
    return result;
  };

  try {
    // Run the agent
    const finalState = await agent.run(model, messages, tools, onToolExecute);

    // Build response
    const toolCalls = finalState.toolCallHistory.map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.args,
      result: tc.result,
      status: tc.status === 'executed' ? ('success' as const) : ('error' as const),
    }));

    // Extract summary from final result or last tool result
    let content = finalState.finalResult?.summary || 'Task completed.';

    // If the complete_task tool was called, use its summary
    const completeCall = finalState.toolCallHistory.find(
      (tc) => tc.name === 'complete_task' && tc.status === 'executed'
    );
    if (completeCall?.result) {
      const result = completeCall.result as Record<string, unknown>;
      if (result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        content = (data.summary as string) || content;
      }
    }

    logger.info('[AgenticChat] Completed agentic execution', {
      sessionId,
      steps: finalState.currentStep,
      toolCalls: toolCalls.length,
      stopReason: finalState.finalResult?.stopReason,
    });

    return {
      content,
      model: modelId,
      provider,
      usage: {
        promptTokens: Math.floor(finalState.usedBudget * 0.7), // Estimate
        completionTokens: Math.floor(finalState.usedBudget * 0.3),
        totalTokens: finalState.usedBudget,
        cost: 0, // Would need model info for accurate cost
      },
      toolCalls,
      agentState: {
        sessionId: finalState.sessionId,
        totalSteps: finalState.currentStep,
        stopReason: finalState.finalResult?.stopReason || 'unknown',
        artifacts: finalState.finalResult?.artifacts || [],
      },
    };
  } catch (error) {
    logger.error('[AgenticChat] Agentic execution failed', error instanceof Error ? error : undefined);

    // Return error response
    return {
      content: `Task execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      model: modelId,
      provider,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
      },
      agentState: {
        sessionId,
        totalSteps: 0,
        stopReason: 'error',
        artifacts: [],
      },
    };
  }
}

// =============================================================================
// Streaming Agentic Chat (Future Implementation)
// =============================================================================

/**
 * Execute an agentic chat with streaming updates.
 * TODO: Implement streaming for real-time UI updates.
 */
export async function* streamAgenticChat(
  _request: AgenticChatRequest
): AsyncGenerator<{
  type: 'step' | 'tool_call' | 'tool_result' | 'content' | 'complete';
  data: unknown;
}> {
  // Placeholder for streaming implementation
  yield {
    type: 'complete',
    data: { message: 'Streaming not yet implemented' },
  };
}
