/**
 * Agentic Chat Executor
 *
 * Handles agentic mode chat using the AgentExecutor for multi-step task completion.
 * This is the bridge between the chat routes and the agent system.
 *
 * Features:
 * - Multi-step autonomous tool execution
 * - Real-time streaming updates
 * - Provider fallback on errors (OpenClaw-style)
 * - Robust error handling with error classification
 * - Provider cooldown tracking
 */

import { randomUUID } from 'node:crypto';
import { tool as createTool, jsonSchema } from 'ai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { AgentExecutor, type AgentState, type AgentConfig, type ToolCallRecord } from '../agents/index.js';
import { aiProvider, MODEL_ALIASES, type ChatMessage, type ProviderType } from '../providers/index.js';
import { normalizeToolSchema } from '../providers/schema-utils.js';
import { logger } from '../utils/logger.js';
import type { ChatToolHandler } from './tool-handler.js';
import {
  runWithModelFallback,
  getUserFriendlyErrorMessage,
  isProviderInCooldown,
  getProvidersInCooldown,
  describeFailoverError,
  coerceToFailoverError,
  type FallbackAttempt,
  type ModelResolver,
} from './failover/index.js';

// =============================================================================
// Model Resolution Helper
// =============================================================================

/**
 * Create a model resolver that uses aiProvider to get configured models.
 * This ensures Azure deployments and other provider-specific configs are used.
 */
function createModelResolver(): ModelResolver {
  return (provider: ProviderType): string | undefined => {
    try {
      // Use resolveModel with the provider name to get the configured default model
      // This handles Azure deployment names and other provider-specific configs
      const resolved = aiProvider.resolveModel(provider);
      if (resolved.provider === provider) {
        return resolved.model;
      }
    } catch {
      // Provider not configured, return undefined
    }
    return undefined;
  };
}

// =============================================================================
// Types
// =============================================================================

export interface AgenticChatRequest {
  conversationId: string;
  messages: ChatMessage[];
  systemPrompt: string;
  model?: string;
  provider?: string;
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
  /** Information about fallback attempts if any */
  fallbackInfo?: {
    usedFallback: boolean;
    requestedProvider: string;
    requestedModel: string;
    attempts: FallbackAttempt[];
  };
}

// =============================================================================
// Agentic Chat Executor
// =============================================================================

/**
 * Execute an agentic chat conversation.
 * Uses the AgentExecutor to run tools continuously until task completion.
 * Automatically falls back to other providers on failure.
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

  // Resolve the primary model and provider
  const explicitProvider = request.provider as ProviderType | undefined;
  const modelRef = request.model || 'sonnet';
  const aliasEntry = MODEL_ALIASES[modelRef as keyof typeof MODEL_ALIASES];
  const primaryProvider = explicitProvider || (aliasEntry?.provider || 'anthropic') as ProviderType;

  // For Azure and similar providers, use the configured deployment name, not hardcoded alias
  let primaryModel = aliasEntry?.model || modelRef;
  try {
    const resolved = aiProvider.resolveModel(primaryProvider);
    if (resolved.provider === primaryProvider && resolved.model) {
      primaryModel = resolved.model; // Use configured deployment (e.g., 'gpt4o')
    }
  } catch {
    // Keep the alias model if provider not configured
  }

  // Get configured providers
  const configuredProviders = aiProvider.getConfiguredProviders();

  // Log if any providers are in cooldown
  const cooldowns = getProvidersInCooldown();
  if (cooldowns.length > 0) {
    logger.info('[AgenticChat] Providers currently in cooldown', {
      cooldowns: cooldowns.map((c) => ({
        provider: c.provider,
        reason: c.reason,
        remainingMs: c.cooldownUntil - Date.now(),
      })),
    });
  }

  // Create agent configuration
  const agentConfig: Partial<AgentConfig> = {
    maxSteps: 50, // Allow up to 50 steps for complex tasks
    maxBudget: 50000, // 50k token budget
    securityMode: 'ask', // Prompt for approval when needed
    enableStreaming: true,
  };

  // Store raw tool definitions - we'll convert to AI SDK format per-provider
  const toolDefinitions = request.tools;

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
    // Run with automatic fallback between providers
    const fallbackResult = await runWithModelFallback({
      primaryProvider,
      primaryModel,
      configuredProviders,
      modelResolver: createModelResolver(),
      run: async (provider, model) => {
        // Get the model instance for this provider
        const modelInstance = aiProvider.getModel(provider, model);

        // Convert tool definitions to AI SDK format using createTool()
        // For Azure, we need to normalize schemas to avoid type: "None" errors
        // IMPORTANT: jsonSchema() requires a validate function to parse model responses
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const aiSdkTools: Record<string, any> = {};
        const isAzure = provider === 'azure';

        // Passthrough validator - accepts any value the model returns
        const passthroughValidate = (value: unknown) => ({
          success: true as const,
          value: value as Record<string, unknown>,
        });

        if (isAzure) {
          logger.info(`[AgenticChat] Azure detected - normalizing ${toolDefinitions.length} tool schemas`);
        }

        for (const toolDef of toolDefinitions) {
          try {
            if (isAzure) {
              // For Azure: Convert Zod schema to JSON Schema, then normalize
              const rawJsonSchema = zodToJsonSchema(toolDef.parameters as z.ZodType, {
                $refStrategy: 'none',
              });

              // Normalize for Azure compatibility (removes additionalProperties, etc.)
              const normalized = normalizeToolSchema(rawJsonSchema);
              if (normalized.type !== 'object') {
                normalized.type = 'object';
              }
              if (!normalized.properties) {
                normalized.properties = {};
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              aiSdkTools[toolDef.name] = createTool({
                description: toolDef.description,
                inputSchema: jsonSchema(normalized as any, { validate: passthroughValidate }),
              });
            } else {
              // For other providers: Convert Zod schema to JSON Schema first
              const rawJsonSchema = zodToJsonSchema(toolDef.parameters as z.ZodType, {
                $refStrategy: 'none',
              });
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              aiSdkTools[toolDef.name] = createTool({
                description: toolDef.description,
                inputSchema: jsonSchema(rawJsonSchema as any, { validate: passthroughValidate }),
              });
            }
          } catch (schemaError) {
            logger.warn(`[AgenticChat] Failed to create tool ${toolDef.name}, using minimal schema`, {
              error: schemaError instanceof Error ? schemaError.message : String(schemaError),
            });
            aiSdkTools[toolDef.name] = createTool({
              description: toolDef.description,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              inputSchema: jsonSchema({ type: 'object', properties: {} } as any, { validate: passthroughValidate }),
            });
          }
        }

        if (isAzure) {
          logger.info(`[AgenticChat] Azure schema normalization complete`);
        }

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

        // Run the agent with normalized tools
        return agent.run(modelInstance, messages, aiSdkTools, onToolExecute);
      },
      onError: (attempt) => {
        const described = describeFailoverError(attempt.error);
        logger.warn('[AgenticChat] Provider attempt failed', {
          provider: attempt.provider,
          model: attempt.model,
          error: described.message,
          reason: described.reason,
          attempt: attempt.attempt,
          total: attempt.total,
        });
      },
    });

    const finalState = fallbackResult.result;
    const actualProvider = fallbackResult.provider;
    const actualModel = fallbackResult.model;
    const usedFallback = actualProvider !== primaryProvider || actualModel !== primaryModel;

    if (usedFallback) {
      logger.info('[AgenticChat] Used fallback provider', {
        requested: `${primaryProvider}/${primaryModel}`,
        actual: `${actualProvider}/${actualModel}`,
        attempts: fallbackResult.attempts.length,
      });
    }

    // Build response
    const toolCalls = finalState.toolCallHistory.map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.args,
      result: tc.result,
      status: tc.status === 'executed' ? ('success' as const) : ('error' as const),
    }));

    // Extract content from final result
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
    } else if (finalState.finalResult?.stopReason === 'textResponse') {
      // No tools were called - the AI responded directly with text
      // This happens for simple messages like "hi" where tools aren't needed
      // Use the summary which should contain the model's text response
      content = finalState.finalResult.summary || 'Response provided.';
    }

    logger.info('[AgenticChat] Completed agentic execution', {
      sessionId,
      steps: finalState.currentStep,
      toolCalls: toolCalls.length,
      stopReason: finalState.finalResult?.stopReason,
      provider: actualProvider,
      model: actualModel,
      usedFallback,
    });

    return {
      content,
      model: actualModel,
      provider: actualProvider,
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
      fallbackInfo: {
        usedFallback,
        requestedProvider: primaryProvider,
        requestedModel: primaryModel,
        attempts: fallbackResult.attempts,
      },
    };
  } catch (error) {
    const err = error as Error;
    const described = describeFailoverError(err);

    logger.error('[AgenticChat] Agentic execution failed', {
      error: described.message,
      reason: described.reason,
      status: described.status,
    });

    // Get user-friendly error message
    const userMessage = getUserFriendlyErrorMessage(err, primaryProvider);

    // Return error response
    return {
      content: `Task execution failed: ${userMessage}`,
      model: primaryModel,
      provider: primaryProvider,
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
// Streaming Event Types
// =============================================================================

export interface AgenticStreamEvent {
  type:
    | 'session:start'
    | 'thinking:start'
    | 'thinking:update'
    | 'thinking:end'
    | 'step:start'
    | 'step:complete'
    | 'tool:call'
    | 'tool:result'
    | 'content'
    | 'summary'
    | 'complete'
    | 'error'
    | 'fallback';
  data: unknown;
  timestamp: number;
}

export interface StreamAgenticChatRequest extends AgenticChatRequest {
  /** Enable thinking/reasoning display (default: true) */
  showThinking?: boolean;
  /** Maximum steps before stopping (default: 50) */
  maxSteps?: number;
  /** Token budget (default: 50000) */
  maxBudget?: number;
}

// =============================================================================
// Streaming Agentic Chat Implementation
// =============================================================================

/**
 * Execute an agentic chat with streaming updates.
 * Yields events for real-time UI updates including:
 * - Session lifecycle (start, complete, error)
 * - Thinking/reasoning (what the AI is considering)
 * - Step progress (current step, remaining budget)
 * - Tool calls and results
 * - Fallback events when switching providers
 * - Final summary
 *
 * Features OpenClaw-style provider fallback: if the primary provider fails,
 * automatically tries other configured providers with cooldown tracking.
 *
 * Tool usage is guided by system prompt - we trust the AI to decide when
 * tools are needed vs when to respond directly (OpenClaw pattern).
 */
export async function* streamAgenticChat(
  request: StreamAgenticChatRequest
): AsyncGenerator<AgenticStreamEvent> {
  const sessionId = randomUUID();
  const showThinking = request.showThinking ?? true;

  // Extract the user's goal from the last user message
  const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
  const goal = lastUserMessage?.content || 'Complete the user request';

  logger.info('[AgenticChat] Starting streaming agentic execution', {
    sessionId,
    conversationId: request.conversationId,
    goal: goal.substring(0, 100),
    showThinking,
  });

  // Resolve the primary model and provider
  // If provider is explicitly given, use it directly
  const explicitProvider = request.provider as ProviderType | undefined;
  const modelRef = request.model || 'sonnet';
  const aliasEntry = MODEL_ALIASES[modelRef as keyof typeof MODEL_ALIASES];
  const primaryProvider = explicitProvider || (aliasEntry?.provider || 'anthropic') as ProviderType;

  // For Azure and similar providers, use the configured deployment name, not hardcoded alias
  let primaryModel = aliasEntry?.model || modelRef;
  try {
    const resolved = aiProvider.resolveModel(primaryProvider);
    if (resolved.provider === primaryProvider && resolved.model) {
      primaryModel = resolved.model; // Use configured deployment (e.g., 'gpt4o')
    }
  } catch {
    // Keep the alias model if provider not configured
  }

  logger.info('[AgenticChat] Provider resolution', {
    explicitProvider: explicitProvider || 'none',
    modelRef,
    primaryProvider,
    primaryModel,
  });

  // Get configured providers
  const configuredProviders = aiProvider.getConfiguredProviders();

  if (configuredProviders.length === 0) {
    yield {
      type: 'error',
      data: {
        message: 'No AI providers configured. Please configure at least one provider in Settings.',
        sessionId,
      },
      timestamp: Date.now(),
    };
    return;
  }

  // Log if any providers are in cooldown
  const cooldowns = getProvidersInCooldown();
  if (cooldowns.length > 0) {
    logger.info('[AgenticChat] Providers currently in cooldown', {
      cooldowns: cooldowns.map((c) => ({
        provider: c.provider,
        reason: c.reason,
        remainingMs: c.cooldownUntil - Date.now(),
      })),
    });
  }

  // Yield session start with model info
  yield {
    type: 'session:start',
    data: {
      sessionId,
      conversationId: request.conversationId,
      goal,
      model: primaryModel,
      provider: primaryProvider,
      configuredProviders,
      cooldownProviders: cooldowns.map((c) => c.provider),
    },
    timestamp: Date.now(),
  };

  // Create agent configuration
  const agentConfig: Partial<AgentConfig> = {
    maxSteps: request.maxSteps ?? 50,
    maxBudget: request.maxBudget ?? 50000,
    securityMode: 'ask',
    enableStreaming: true,
  };

  // Store raw tool definitions - we'll convert to AI SDK format per-provider
  const toolDefinitions = request.tools;

  // Build messages with system prompt
  const messages = [
    { role: 'system' as const, content: request.systemPrompt },
    ...request.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];

  // Event queue for streaming from callbacks
  const eventQueue: AgenticStreamEvent[] = [];
  let resolveQueue: (() => void) | null = null;

  const pushEvent = (event: AgenticStreamEvent) => {
    eventQueue.push(event);
    if (resolveQueue) {
      resolveQueue();
      resolveQueue = null;
    }
  };

  // Tool execution handler
  const onToolExecute = async (toolName: string, args: Record<string, unknown>): Promise<unknown> => {
    const result = await request.toolHandler.executeTool(toolName, args, randomUUID());
    return result;
  };

  // Track the result
  let finalState: AgentState | null = null;
  let agentError: Error | null = null;
  let agentComplete = false;
  let actualProvider = primaryProvider;
  let actualModel = primaryModel;
  let fallbackAttempts: FallbackAttempt[] = [];

  // Run the agent with fallback in a separate async context
  const runAgent = async () => {
    try {
      const fallbackResult = await runWithModelFallback({
        primaryProvider,
        primaryModel,
        configuredProviders,
        modelResolver: createModelResolver(),
        run: async (provider, model) => {
          // Notify if we're using a fallback
          if (provider !== primaryProvider || model !== primaryModel) {
            pushEvent({
              type: 'fallback',
              data: {
                from: { provider: actualProvider, model: actualModel },
                to: { provider, model },
                reason: fallbackAttempts.length > 0
                  ? fallbackAttempts[fallbackAttempts.length - 1]?.error
                  : 'Primary provider unavailable',
              },
              timestamp: Date.now(),
            });

            if (showThinking) {
              pushEvent({
                type: 'thinking:update',
                data: {
                  message: `Switching to ${provider}/${model}`,
                  provider,
                  model,
                  isRetry: true,
                },
                timestamp: Date.now(),
              });
            }
          }

          actualProvider = provider as ProviderType;
          actualModel = model;

          // Get the model instance for this provider
          const modelInstance = aiProvider.getModel(provider, model);

          // Create the agent executor
          const agent = new AgentExecutor(sessionId, request.conversationId, goal, agentConfig);

          // Set up event handlers
          agent.on('step:start', (state) => {
            if (showThinking) {
              pushEvent({
                type: 'thinking:start',
                data: {
                  step: state.currentStep,
                  message: `Planning step ${state.currentStep}...`,
                  remainingBudget: state.maxBudget - state.usedBudget,
                },
                timestamp: Date.now(),
              });
            }

            pushEvent({
              type: 'step:start',
              data: {
                step: state.currentStep,
                maxSteps: agentConfig.maxSteps,
                usedBudget: state.usedBudget,
                maxBudget: state.maxBudget,
              },
              timestamp: Date.now(),
            });
          });

          agent.on('step:complete', (state, result) => {
            if (showThinking) {
              pushEvent({
                type: 'thinking:end',
                data: {
                  step: state.currentStep,
                  message: `Step ${state.currentStep} completed`,
                  text: (result as any)?.text?.substring(0, 200),
                },
                timestamp: Date.now(),
              });
            }

            pushEvent({
              type: 'step:complete',
              data: {
                step: state.currentStep,
                usedBudget: state.usedBudget,
                toolCallsInStep: (result as any)?.steps?.[0]?.toolCalls?.length ?? 0,
              },
              timestamp: Date.now(),
            });
          });

          agent.on('tool:call', (state, toolCall) => {
            if (showThinking) {
              pushEvent({
                type: 'thinking:update',
                data: {
                  message: `Calling tool: ${toolCall.name}`,
                  tool: toolCall.name,
                  args: toolCall.args,
                },
                timestamp: Date.now(),
              });
            }

            pushEvent({
              type: 'tool:call',
              data: {
                id: toolCall.id,
                name: toolCall.name,
                args: toolCall.args,
                step: state.currentStep,
              },
              timestamp: Date.now(),
            });
          });

          agent.on('tool:result', (state, toolCall) => {
            pushEvent({
              type: 'tool:result',
              data: {
                id: toolCall.id,
                name: toolCall.name,
                result: toolCall.result,
                status: toolCall.status,
                error: toolCall.error,
                duration:
                  toolCall.completedAt && toolCall.startedAt
                    ? toolCall.completedAt - toolCall.startedAt
                    : undefined,
              },
              timestamp: Date.now(),
            });
          });

          // Convert tool definitions to AI SDK format using createTool()
          // For Azure, we need to normalize schemas to avoid type: "None" errors
          // IMPORTANT: jsonSchema() requires a validate function to parse model responses
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const aiSdkTools: Record<string, any> = {};
          const isAzure = provider === 'azure';

          // Passthrough validator - accepts any value the model returns
          const passthroughValidate = (value: unknown) => ({
            success: true as const,
            value: value as Record<string, unknown>,
          });

          if (isAzure) {
            logger.info(`[AgenticChat/Stream] Azure detected - normalizing ${toolDefinitions.length} tool schemas`);
          }

          for (const toolDef of toolDefinitions) {
            try {
              if (isAzure) {
                // For Azure: Convert Zod schema to JSON Schema, then normalize
                const rawJsonSchema = zodToJsonSchema(toolDef.parameters as z.ZodType, {
                  $refStrategy: 'none',
                });

                // Normalize for Azure compatibility
                const normalized = normalizeToolSchema(rawJsonSchema);
                if (normalized.type !== 'object') {
                  normalized.type = 'object';
                }
                if (!normalized.properties) {
                  normalized.properties = {};
                }

                aiSdkTools[toolDef.name] = createTool({
                  description: toolDef.description,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  inputSchema: jsonSchema(normalized as any, { validate: passthroughValidate }),
                });
              } else {
                // For other providers: Convert Zod schema to JSON Schema first
                const rawJsonSchema = zodToJsonSchema(toolDef.parameters as z.ZodType, {
                  $refStrategy: 'none',
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                aiSdkTools[toolDef.name] = createTool({
                  description: toolDef.description,
                  inputSchema: jsonSchema(rawJsonSchema as any, { validate: passthroughValidate }),
                });
              }
            } catch (schemaError) {
              logger.warn(`[AgenticChat/Stream] Failed to create tool ${toolDef.name}, using minimal schema`, {
                error: schemaError instanceof Error ? schemaError.message : String(schemaError),
              });
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              aiSdkTools[toolDef.name] = createTool({
                description: toolDef.description,
                inputSchema: jsonSchema({ type: 'object', properties: {} } as any, { validate: passthroughValidate }),
              });
            }
          }

          if (isAzure) {
            logger.info(`[AgenticChat/Stream] Azure schema normalization complete`);
          }

          // Run the agent
          return agent.run(modelInstance, messages, aiSdkTools, onToolExecute);
        },
        onError: (attempt) => {
          const described = describeFailoverError(attempt.error);
          logger.warn('[AgenticChat] Provider attempt failed, trying fallback', {
            provider: attempt.provider,
            model: attempt.model,
            error: described.message,
            reason: described.reason,
            attempt: attempt.attempt,
            total: attempt.total,
          });

          fallbackAttempts.push({
            provider: attempt.provider,
            model: attempt.model,
            error: described.message,
            reason: described.reason,
            status: described.status,
            code: described.code,
          });
        },
      });

      finalState = fallbackResult.result;
      actualProvider = fallbackResult.provider as ProviderType;
      actualModel = fallbackResult.model;
      fallbackAttempts = fallbackResult.attempts;
      agentComplete = true;
    } catch (error) {
      agentError = error as Error;
      agentComplete = true;
    }

    // Wake up the generator
    if (resolveQueue) {
      resolveQueue();
      resolveQueue = null;
    }
  };

  // Start the agent
  runAgent();

  // Yield events as they come in
  while (!agentComplete || eventQueue.length > 0) {
    // Yield all queued events
    while (eventQueue.length > 0) {
      yield eventQueue.shift()!;
    }

    // If agent is not complete, wait for more events
    if (!agentComplete) {
      await new Promise<void>((resolve) => {
        resolveQueue = resolve;
        // Timeout to check for completion
        setTimeout(resolve, 100);
      });
    }
  }

  // Handle error
  if (agentError) {
    const userMessage = getUserFriendlyErrorMessage(agentError, actualProvider);
    yield {
      type: 'error',
      data: {
        message: userMessage,
        sessionId,
        provider: actualProvider,
        attemptedProviders: fallbackAttempts.map((a) => a.provider),
        attempts: fallbackAttempts,
      },
      timestamp: Date.now(),
    };
    return;
  }

  // Yield final summary if we have a state
  // TypeScript doesn't track async mutations, so we need to assert the type
  if (finalState) {
    const state = finalState as AgentState;
    const usedFallback = actualProvider !== primaryProvider || actualModel !== primaryModel;

    // Build summary
    const toolCalls = state.toolCallHistory.map((tc: ToolCallRecord) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.args,
      result: tc.result,
      status: tc.status === 'executed' ? 'success' : 'error',
    }));

    // Extract summary from complete_task or final result
    let summary = state.finalResult?.summary || 'Task completed.';
    const completeCall = state.toolCallHistory.find(
      (tc: ToolCallRecord) => tc.name === 'complete_task' && tc.status === 'executed'
    );
    if (completeCall?.result) {
      const result = completeCall.result as Record<string, unknown>;
      if (result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        summary = (data.summary as string) || summary;
      }
    }

    yield {
      type: 'summary',
      data: {
        summary,
        artifacts: state.finalResult?.artifacts || [],
        nextSteps: state.finalResult?.nextSteps || [],
      },
      timestamp: Date.now(),
    };

    yield {
      type: 'complete',
      data: {
        sessionId,
        model: actualModel,
        provider: actualProvider,
        requestedModel: primaryModel,
        requestedProvider: primaryProvider,
        usedFallback,
        fallbackAttempts: usedFallback ? fallbackAttempts : undefined,
        totalSteps: state.currentStep,
        totalTokens: state.usedBudget,
        stopReason: state.finalResult?.stopReason || 'unknown',
        toolCalls,
        artifacts: state.finalResult?.artifacts || [],
      },
      timestamp: Date.now(),
    };

    logger.info('[AgenticChat] Streaming execution completed', {
      sessionId,
      steps: state.currentStep,
      toolCalls: toolCalls.length,
      stopReason: state.finalResult?.stopReason,
      provider: actualProvider,
      model: actualModel,
      usedFallback,
      attempts: fallbackAttempts.length,
    });
  }
}
