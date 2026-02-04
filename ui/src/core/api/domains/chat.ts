/**
 * Chat API
 *
 * Endpoints for AI chat, conversations, skills, and tool management
 */

import { request } from './base';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatUsage,
  ModelInfo,
  ModelAlias,
} from '../../types';

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: string;
  tokenUsage?: { prompt: number; completion: number; total: number };
  cost?: number;
  toolCalls?: ToolCall[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  presetId: string;
  taskId?: string;
  ticketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface PendingApproval {
  id: string;
  toolName: string;
  params: Record<string, unknown>;
  securityLevel: 'moderate' | 'dangerous';
  command?: string;
  expiresAt?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  capabilities: string[];
  preferredModel?: 'fast' | 'balanced' | 'powerful';
  examples: string[];
}

export interface MemoryStats {
  messageCount: number;
  estimatedTokens: number;
  contextWindow: number;
  usagePercentage: number;
  needsCompaction: boolean;
  summaryCount: number;
}

export const chatApi = {
  completions: (data: ChatCompletionRequest) =>
    request<ChatCompletionResponse>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  models: (provider?: string) => {
    const query = provider ? `?provider=${provider}` : '';
    return request<{ models: ModelInfo[]; aliases: ModelAlias[] }>(`/chat/models${query}`);
  },

  providers: () =>
    request<{
      default: string;
      providers: Array<{
        type: string;
        enabled: boolean;
        healthy: boolean;
        message?: string;
        latencyMs?: number;
      }>;
    }>('/chat/providers'),

  setDefault: (provider: string) =>
    request<{ success: boolean; default: string }>('/chat/providers/default', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }),

  configure: (
    type: string,
    config: {
      apiKey?: string;
      baseUrl?: string;
      defaultModel?: string;
      apiVersion?: string;
      resourceName?: string;
      deploymentName?: string;
      enabled?: boolean;
    }
  ) =>
    request<{ success: boolean; message: string }>(`/chat/providers/${type}/configure`, {
      method: 'POST',
      body: JSON.stringify({ type, ...config }),
    }),

  quick: (
    prompt: string,
    options?: { model?: string; systemPrompt?: string; temperature?: number }
  ) =>
    request<{ content: string; model: string; provider: string; usage: ChatUsage }>('/chat/quick', {
      method: 'POST',
      body: JSON.stringify({ prompt, ...options }),
    }),

  health: (type: string) =>
    request<{ provider: string; healthy: boolean; message: string; latencyMs?: number }>(
      `/chat/providers/${type}/health`,
      { method: 'POST' }
    ),

  // Intelligence features
  presets: () =>
    request<{
      presets: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        examples: string[];
      }>;
      default: string;
    }>('/chat/presets'),

  quickActions: () =>
    request<{ actions: Array<{ id: string; label: string; icon: string; prompt: string }> }>(
      '/chat/quick-actions'
    ),

  // Skills system
  skills: {
    list: () =>
      request<{
        skills: Skill[];
        modelTiers: Array<{ tier: 'fast' | 'balanced' | 'powerful'; description: string; costMultiplier: number }>;
      }>('/chat/skills'),

    detect: (
      message: string,
      context?: { hasTask?: boolean; hasTicket?: boolean; hasCode?: boolean }
    ) =>
      request<{
        matches: Array<{
          skillId: string;
          skillName: string;
          confidence: number;
          matchedPattern?: string;
          extractedVars?: Record<string, string>;
          preferredModel?: string;
        }>;
        recommendedSkill: { id: string; name: string; confidence: number } | null;
      }>('/chat/skills/detect', {
        method: 'POST',
        body: JSON.stringify({ message, ...context }),
      }),

    route: (
      message: string,
      options?: {
        availableModels?: string[];
        hasTask?: boolean;
        hasTicket?: boolean;
        hasCode?: boolean;
      }
    ) =>
      request<{
        skill: { id: string; name: string; confidence: number };
        model: { selected: string; tier: string; reason: string; costMultiplier: number };
        routing: { method: string; pattern?: string };
      }>('/chat/skills/route', {
        method: 'POST',
        body: JSON.stringify({ message, ...options }),
      }),
  },

  // Smart chat with context
  smart: (data: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    presetId?: string;
    taskId?: string;
    ticketId?: string;
    temperature?: number;
  }) =>
    request<ChatCompletionResponse & { context: { presetId: string; taskId?: string; ticketId?: string } }>(
      '/chat/smart',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Conversation management
  conversations: {
    list: (params?: { limit?: number; offset?: number; taskId?: string; ticketId?: string }) => {
      const query = new URLSearchParams();
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.offset) query.set('offset', params.offset.toString());
      if (params?.taskId) query.set('taskId', params.taskId);
      if (params?.ticketId) query.set('ticketId', params.ticketId);
      const queryStr = query.toString();
      return request<{
        conversations: Array<{
          id: string;
          title: string;
          presetId: string;
          createdAt: string;
          updatedAt: string;
        }>;
        total: number;
      }>(`/chat/conversations${queryStr ? `?${queryStr}` : ''}`);
    },

    recent: (limit = 10) =>
      request<{
        conversations: Array<{
          id: string;
          title: string;
          presetId: string;
          preview: string;
          messageCount: number;
          createdAt: string;
          updatedAt: string;
        }>;
      }>(`/chat/conversations/recent?limit=${limit}`),

    create: (data: {
      title?: string;
      presetId?: string;
      taskId?: string;
      ticketId?: string;
      projectId?: string;
    }) =>
      request<{ conversation: Conversation }>('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    get: (id: string) =>
      request<{ conversation: Conversation; messages: ConversationMessage[] }>(
        `/chat/conversations/${id}`
      ),

    delete: (id: string) =>
      request<{ message: string }>(`/chat/conversations/${id}`, { method: 'DELETE' }),

    sendMessage: (
      conversationId: string,
      data: { content: string; model?: string; temperature?: number }
    ) =>
      request<{
        userMessage: ConversationMessage;
        assistantMessage: ConversationMessage;
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number; cost?: number };
        compaction?: { originalCount: number; compactedCount: number; tokensReduced: number };
      }>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Memory management
    getMemoryStats: (conversationId: string, model?: string) =>
      request<{
        conversationId: string;
        stats: MemoryStats;
        recommendation: string;
      }>(`/chat/conversations/${conversationId}/memory${model ? `?model=${model}` : ''}`),

    compact: (conversationId: string, model?: string) =>
      request<{
        compacted: boolean;
        message?: string;
        originalCount?: number;
        compactedCount?: number;
        tokensReduced?: number;
        summary?: string;
        stats: MemoryStats;
      }>(`/chat/conversations/${conversationId}/compact${model ? `?model=${model}` : ''}`, {
        method: 'POST',
      }),

    // Send message with native tool calling
    sendMessageWithTools: (
      conversationId: string,
      data: { content: string; model?: string; temperature?: number; enableTools?: boolean }
    ) =>
      request<{
        userMessage: ConversationMessage;
        assistantMessage: ConversationMessage;
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number; cost?: number };
        compaction?: { originalCount: number; compactedCount: number; tokensReduced: number };
        toolCalls?: ToolCall[];
        pendingApprovals?: PendingApproval[];
        toolSupport?: {
          requested: boolean;
          supported: boolean;
          used: boolean;
          recommendation?: string;
        };
      }>(`/chat/conversations/${conversationId}/messages/with-tools`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Tool approval
  tools: {
    approve: (data: {
      conversationId: string;
      approvalId: string;
      decision: 'allow-once' | 'allow-always' | 'deny';
    }) =>
      request<{ success: boolean; message: string; result?: unknown }>('/chat/tools/approve', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: () =>
      request<{
        tools: Array<{
          name: string;
          description: string;
          category?: string;
          securityLevel: 'safe' | 'moderate' | 'dangerous';
        }>;
        count: number;
      }>('/chat/tools'),
  },
};
