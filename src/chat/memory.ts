/**
 * Conversation Memory Management
 *
 * Handles context window optimization and automatic message compaction
 * to keep conversations within model limits while preserving context.
 */

import { aiProvider } from '../providers/index.js';
import type { ConversationMessage } from './conversations.js';

// === Configuration ===

export interface MemoryConfig {
  // Max percentage of context window to use before compacting (0.7 = 70%)
  compactThreshold: number;
  // Number of recent messages to always keep intact
  preserveRecentCount: number;
  // Minimum messages before compaction kicks in
  minMessagesForCompaction: number;
  // Target token count after compaction (percentage of context)
  targetAfterCompaction: number;
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  compactThreshold: 0.7,
  preserveRecentCount: 6, // Keep last 3 exchanges (user + assistant)
  minMessagesForCompaction: 10,
  targetAfterCompaction: 0.5,
};

// === Token Estimation ===

/**
 * Rough token estimation (4 chars per token average)
 * This is a fast approximation - actual tokenization varies by model
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for a message array
 */
export function estimateMessagesTokens(messages: ConversationMessage[]): number {
  return messages.reduce((total, msg) => {
    // Content + role overhead (~10 tokens per message for structure)
    return total + estimateTokens(msg.content) + 10;
  }, 0);
}

/**
 * Get context window for the current model
 */
export function getContextWindow(model?: string): number {
  // Default to 128k if model not specified
  if (!model) return 128000;

  // Check model catalog for exact value
  const models = aiProvider.getAllModels();
  const modelInfo = models.find(
    (m) => m.id === model || m.id.includes(model) || model.includes(m.id)
  );

  return modelInfo?.contextWindow || 128000;
}

// === Compaction Logic ===

export interface CompactionResult {
  messages: ConversationMessage[];
  summary?: string;
  originalCount: number;
  compactedCount: number;
  tokensReduced: number;
  wasCompacted: boolean;
}

/**
 * Check if messages need compaction based on token count
 */
export function needsCompaction(
  messages: ConversationMessage[],
  model?: string,
  config: MemoryConfig = DEFAULT_MEMORY_CONFIG
): boolean {
  if (messages.length < config.minMessagesForCompaction) {
    return false;
  }

  const contextWindow = getContextWindow(model);
  const currentTokens = estimateMessagesTokens(messages);
  const threshold = contextWindow * config.compactThreshold;

  return currentTokens > threshold;
}

/**
 * Create a summary of messages using AI
 */
export async function summarizeMessages(
  messages: ConversationMessage[],
  model?: string
): Promise<string> {
  const content = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const summaryPrompt = `Summarize this conversation concisely, preserving key information, decisions made, and context needed for continuing the discussion. Be brief but complete.

CONVERSATION:
${content}

SUMMARY:`;

  try {
    const response = await aiProvider.chat({
      messages: [
        {
          id: 'summary-request',
          role: 'user',
          content: summaryPrompt,
          timestamp: new Date().toISOString(),
        },
      ],
      model: model || 'local', // Prefer local/free model for summaries
      maxTokens: 500,
      temperature: 0.3,
    });

    return response.content;
  } catch (error) {
    // Fallback to simple truncation if AI fails
    console.warn('[Memory] AI summarization failed, using truncation:', error);
    return `Previous conversation summary (${messages.length} messages): ${messages
      .slice(-3)
      .map((m) => m.content.slice(0, 100))
      .join(' ... ')}`;
  }
}

/**
 * Compact messages by summarizing older ones
 */
export async function compactMessages(
  messages: ConversationMessage[],
  model?: string,
  config: MemoryConfig = DEFAULT_MEMORY_CONFIG
): Promise<CompactionResult> {
  const originalCount = messages.length;
  const originalTokens = estimateMessagesTokens(messages);

  // Don't compact if not needed
  if (!needsCompaction(messages, model, config)) {
    return {
      messages,
      originalCount,
      compactedCount: messages.length,
      tokensReduced: 0,
      wasCompacted: false,
    };
  }

  // Split messages: preserve recent, summarize old
  const preserveCount = Math.min(config.preserveRecentCount, messages.length - 1);
  const messagesToSummarize = messages.slice(0, -preserveCount);
  const messagesToKeep = messages.slice(-preserveCount);

  // Generate summary of old messages
  const summary = await summarizeMessages(messagesToSummarize, model);

  // Create summary message
  const summaryMessage: ConversationMessage = {
    id: `summary-${Date.now()}`,
    conversationId: messages[0]?.conversationId || '',
    role: 'system',
    content: `[CONVERSATION SUMMARY - ${messagesToSummarize.length} messages compacted]\n\n${summary}`,
    createdAt: new Date().toISOString(),
  };

  // New message array: summary + recent messages
  const compactedMessages = [summaryMessage, ...messagesToKeep];
  const compactedTokens = estimateMessagesTokens(compactedMessages);

  return {
    messages: compactedMessages,
    summary,
    originalCount,
    compactedCount: compactedMessages.length,
    tokensReduced: originalTokens - compactedTokens,
    wasCompacted: true,
  };
}

// === Memory Stats ===

export interface MemoryStats {
  messageCount: number;
  estimatedTokens: number;
  contextWindow: number;
  usagePercentage: number;
  needsCompaction: boolean;
  summaryCount: number;
}

/**
 * Get memory stats for a conversation
 */
export function getMemoryStats(
  messages: ConversationMessage[],
  model?: string,
  config: MemoryConfig = DEFAULT_MEMORY_CONFIG
): MemoryStats {
  const contextWindow = getContextWindow(model);
  const estimatedTokens = estimateMessagesTokens(messages);
  const summaryCount = messages.filter((m) =>
    m.content.startsWith('[CONVERSATION SUMMARY')
  ).length;

  return {
    messageCount: messages.length,
    estimatedTokens,
    contextWindow,
    usagePercentage: (estimatedTokens / contextWindow) * 100,
    needsCompaction: needsCompaction(messages, model, config),
    summaryCount,
  };
}

export default {
  DEFAULT_MEMORY_CONFIG,
  estimateTokens,
  estimateMessagesTokens,
  getContextWindow,
  needsCompaction,
  summarizeMessages,
  compactMessages,
  getMemoryStats,
};
