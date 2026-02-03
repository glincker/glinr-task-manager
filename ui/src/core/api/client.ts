/**
 * API Client for GLINR Task Manager
 *
 * Provides type-safe API calls to the backend
 *
 * Note: Types are also available from '@/core/types' for direct imports.
 * This file re-exports them for backwards compatibility.
 */

// Import types for local use
import type {
  Task,
  TaskStatus,
  TasksResponse,
  TaskAnalytics,
  TaskFilterParams,
  TaskEvent,
  Summary,
  SummariesResponse,
  SummaryStats,
  Ticket,
  TicketStatus,
  TicketType,
  TicketPriority,
  TicketComment,
  TicketHistoryEntry,
  TicketExternalLink,
  TicketCategorization,
  TicketSuggestion,
  SimilarTicket,
  TicketsResponse,
  TicketFilterParams,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatUsage,
  ModelInfo,
  ModelAlias,
  GatewayAgent,
  GatewayWorkflow,
  GatewayConfig,
  GatewayExecuteRequest,
  GatewayExecuteResponse,
  GatewayStatus,
  AIStatus,
  AIResponderStatus,
  AICommentResponse,
  AICommentAnalysis,
  Settings,
  PluginHealth,
  ExternalPlatform,
  TicketWithRelations,
  CreateTicketInput,
  TicketQueryParams,
  // Projects & Sprints
  Project,
  ProjectStatus,
  ProjectExternalLink,
  ProjectWithRelations,
  ProjectsResponse,
  ProjectQueryParams,
  CreateProjectInput,
  UpdateProjectInput,
  Sprint,
  SprintStatus,
  SprintWithStats,
  SprintsResponse,
  SprintQueryParams,
  CreateSprintInput,
  UpdateSprintInput,
  SprintTicket,
  DashboardStats,
  VelocityDataPoint,
} from '../types';

// Re-export all types for backwards compatibility
// New code should import from '@/core/types' directly
export type {
  Task,
  TaskStatus,
  TasksResponse,
  TaskAnalytics,
  TaskFilterParams,
  TaskEvent,
  Summary,
  SummariesResponse,
  SummaryStats,
  Ticket,
  TicketStatus,
  TicketType,
  TicketPriority,
  TicketComment,
  TicketHistoryEntry,
  TicketExternalLink,
  TicketCategorization,
  TicketSuggestion,
  SimilarTicket,
  TicketsResponse,
  TicketFilterParams,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatUsage,
  ModelInfo,
  ModelAlias,
  GatewayAgent,
  GatewayWorkflow,
  GatewayConfig,
  GatewayExecuteRequest,
  GatewayExecuteResponse,
  GatewayStatus,
  AIStatus,
  AIResponderStatus,
  AICommentResponse,
  AICommentAnalysis,
  Settings,
  PluginHealth,
  ExternalPlatform,
  TicketWithRelations,
  CreateTicketInput,
  TicketQueryParams,
  // Projects & Sprints
  Project,
  ProjectStatus,
  ProjectExternalLink,
  ProjectWithRelations,
  ProjectsResponse,
  ProjectQueryParams,
  CreateProjectInput,
  UpdateProjectInput,
  Sprint,
  SprintStatus,
  SprintWithStats,
  SprintsResponse,
  SprintQueryParams,
  CreateSprintInput,
  UpdateSprintInput,
  SprintTicket,
  DashboardStats,
  VelocityDataPoint,
};

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  return handleResponse<T>(response);
}

// API Client
export const api = {
  // Tasks
  tasks: {
    list: (params?: { limit?: number; offset?: number; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.status) searchParams.set('status', params.status);
      const query = searchParams.toString();
      return request<TasksResponse>(`/tasks${query ? `?${query}` : ''}`);
    },
    get: async (id: string) => {
      const response = await request<{ task: Task }>(`/tasks/${id}`);
      return response.task;
    },
    create: (data: Partial<Task>) =>
      request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Task>) =>
      request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
    cancel: (id: string) =>
      request<{ message: string; task: Task }>(`/tasks/${id}/cancel`, { method: 'POST' }),
    retry: (id: string) =>
      request<{ message: string; task: Task; originalTaskId: string }>(`/tasks/${id}/retry`, { method: 'POST' }),
    analytics: () => request<TaskAnalytics>('/tasks/analytics'),
    filter: (params: TaskFilterParams) => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set('status', Array.isArray(params.status) ? params.status.join(',') : params.status);
      if (params.priority) searchParams.set('priority', Array.isArray(params.priority) ? params.priority.join(',') : String(params.priority));
      if (params.source) searchParams.set('source', Array.isArray(params.source) ? params.source.join(',') : params.source);
      if (params.agent) searchParams.set('agent', params.agent);
      if (params.labels) searchParams.set('labels', params.labels.join(','));
      if (params.createdAfter) searchParams.set('createdAfter', params.createdAfter);
      if (params.createdBefore) searchParams.set('createdBefore', params.createdBefore);
      if (params.q) searchParams.set('q', params.q);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.offset) searchParams.set('offset', String(params.offset));
      const query = searchParams.toString();
      return request<TasksResponse & { total: number }>(`/tasks/filter${query ? `?${query}` : ''}`);
    },
    events: (id: string) => request<{ taskId: string; events: TaskEvent[]; count: number }>(`/tasks/${id}/events`),
    archived: (params?: { limit?: number; offset?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      const query = searchParams.toString();
      return request<TasksResponse & { total: number }>(`/tasks/archived${query ? `?${query}` : ''}`);
    },
    archive: (olderThanDays = 30) =>
      request<{ message: string; archived: number }>('/tasks/archive', {
        method: 'POST',
        body: JSON.stringify({ olderThanDays }),
      }),
  },

  // Summaries
  summaries: {
    list: (params?: { limit?: number; offset?: number; agent?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.agent) searchParams.set('agent', params.agent);
      const query = searchParams.toString();
      return request<SummariesResponse>(`/summaries${query ? `?${query}` : ''}`);
    },
    get: async (id: string) => {
      const response = await request<{ summary: Summary }>(`/summaries/${id}`);
      return response.summary;
    },
    recent: async (limit = 10) => {
      const response = await request<{ summaries: Summary[]; count: number }>(`/summaries/recent?limit=${limit}`);
      return response.summaries;
    },
    stats: () => request<SummaryStats>('/summaries/stats'),
  },

  // Health
  health: () => request<{ status: string; storage?: { healthy: boolean } }>('/health'),

  // Integrations
  integrations: {
    status: () => request<{
      integrations: Record<string, {
        name: string;
        configured: boolean;
        webhookUrl: string;
        oauthUrl: string;
        icon: string;
        description: string;
      }>;
      baseUrl: string;
      hookEndpoints: {
        toolUse: string;
        sessionEnd: string;
        promptSubmit: string;
      };
    }>('/integrations/status'),
  },

  // DLQ (Dead Letter Queue)
  dlq: {
    list: () => request<{ tasks: Array<{ id: string; title: string; error: string; failedAt: string; attempts: number }>; count: number }>('/dlq'),
    stats: () => request<{ total: number }>('/dlq/stats'),
    retry: (id: string) => request<{ message: string }>(`/dlq/${id}/retry`, { method: 'POST' }),
    remove: (id: string) => request<{ message: string }>(`/dlq/${id}`, { method: 'DELETE' }),
  },

  // Stats
  stats: {
    get: () => request<{ pending: number; inProgress: number; completed: number; failed: number; total: number }>('/stats'),
    dashboard: () => request<DashboardStats>('/stats/dashboard'),
    sprintBurndown: (sprintId: string) => request<{
      sprint: {
        id: string;
        name: string;
        status: string;
        startDate?: string;
        endDate?: string;
        capacity?: number;
      };
      totalPoints: number;
      ticketCount: number;
      completedPoints: number;
      burndown: Array<{
        date: string;
        remaining?: number;
        ideal: number;
      }>;
    }>(`/stats/sprints/${sprintId}/burndown`),
    projectVelocity: (projectId: string) => request<{
      projectId: string;
      sprints: Array<{
        sprintId: string;
        sprintName: string;
        completedAt: string;
        plannedPoints: number;
        completedPoints: number;
        ticketCount: number;
        completedTickets: number;
      }>;
      averageVelocity: number;
      sprintCount: number;
    }>(`/stats/projects/${projectId}/velocity`),
    projectStats: (projectId: string) => request<{
      tickets: {
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        byPriority: Record<string, number>;
      };
      sprints: {
        total: number;
        active: number;
        completed: number;
      };
    }>(`/stats/projects/${projectId}`),
  },

  // Costs
  costs: {
    summary: () => request<{
      totalTokens: number;
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
      taskCount: number;
    }>('/costs/summary'),
    analytics: () => request<{
      daily: Array<{ date: string; cost: number; tokens: number }>;
      byModel: Record<string, { cost: number; tokens: number }>;
      byAgent: Record<string, { cost: number; tokens: number }>;
      totalCost: number;
      totalTokens: number;
    }>('/costs/analytics'),
    budget: () => request<{
      limit: number;
      spent: number;
      remaining: number;
      percentage: number;
    }>('/costs/budget'),
  },

  // Settings
  settings: {
    get: () => request<{ settings: Settings }>('/settings'),
    update: (updates: Partial<Settings>) =>
      request<{ message: string; settings: Settings }>('/settings', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    reset: () =>
      request<{ message: string; settings: Settings }>('/settings/reset', {
        method: 'POST',
      }),
  },

  // Plugins
  plugins: {
    health: () => request<{ plugins: PluginHealth[] }>('/plugins/health'),
    toggle: (pluginId: string, enabled: boolean) =>
      request<{ message: string; settings: Settings }>(`/plugins/${pluginId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      }),
  },

  // Gateway
  gateway: {
    status: () => request<GatewayStatus>('/gateway/status'),
    agents: () => request<{ agents: GatewayAgent[]; count: number }>('/gateway/agents'),
    workflows: () => request<{ workflows: GatewayWorkflow[] }>('/gateway/workflows'),
    workflow: (type: string) => request<{ workflow: GatewayWorkflow }>(`/gateway/workflows/${type}`),
    config: () => request<{ config: GatewayConfig }>('/gateway/config'),
    execute: (req: GatewayExecuteRequest) =>
      request<GatewayExecuteResponse>('/gateway/execute', {
        method: 'POST',
        body: JSON.stringify(req),
      }),
    updateConfig: (updates: Partial<GatewayConfig>) =>
      request<{ message: string; config: GatewayConfig }>('/gateway/config', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
  },

  // Tickets (AI-Native Ticket System)
  tickets: {
    list: (params?: TicketQueryParams) => {
      const searchParams = new URLSearchParams();
      if (params?.projectId) searchParams.set('projectId', params.projectId);
      if (params?.sprintId) searchParams.set('sprintId', params.sprintId);
      if (params?.inBacklog) searchParams.set('inBacklog', 'true');
      if (params?.status) searchParams.set('status', Array.isArray(params.status) ? params.status.join(',') : params.status);
      if (params?.type) searchParams.set('type', Array.isArray(params.type) ? params.type.join(',') : params.type);
      if (params?.priority) searchParams.set('priority', Array.isArray(params.priority) ? params.priority.join(',') : params.priority);
      if (params?.assignee) searchParams.set('assignee', params.assignee);
      if (params?.assigneeAgent) searchParams.set('assigneeAgent', params.assigneeAgent);
      if (params?.parentId) searchParams.set('parentId', params.parentId);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.createdBy) searchParams.set('createdBy', params.createdBy);
      if (params?.label) searchParams.set('label', params.label);
      if (params?.labels) searchParams.set('labels', params.labels.join(','));
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      const query = searchParams.toString();
      return request<TicketsResponse>(`/tickets${query ? `?${query}` : ''}`);
    },
    get: async (id: string, includeRelations = false) => {
      const query = includeRelations ? '?include=all' : '';
      const response = await request<{ ticket: Ticket | TicketWithRelations }>(`/tickets/${id}${query}`);
      return response.ticket;
    },
    create: (data: CreateTicketInput) =>
      request<{ message: string; ticket: Ticket }>('/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<CreateTicketInput>) =>
      request<{ message: string; ticket: Ticket }>(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/tickets/${id}`, { method: 'DELETE' }),
    transition: (id: string, status: TicketStatus) =>
      request<{ message: string; ticket: Ticket }>(`/tickets/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    assignAgent: (id: string, agent: string) =>
      request<{ message: string; ticket: Ticket }>(`/tickets/${id}/assign-agent`, {
        method: 'POST',
        body: JSON.stringify({ agent }),
      }),
    // Comments
    getComments: (id: string) =>
      request<{ ticketId: string; comments: TicketComment[]; count: number }>(`/tickets/${id}/comments`),
    addComment: (id: string, content: string, author?: { type: 'human' | 'ai'; name: string; platform: string }) =>
      request<{ message: string; comment: TicketComment }>(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, author }),
      }),
    // External Links
    getLinks: (id: string) =>
      request<{ ticketId: string; links: TicketExternalLink[]; count: number }>(`/tickets/${id}/links`),
    addLink: (id: string, link: { platform: ExternalPlatform; externalId: string; externalUrl?: string }) =>
      request<{ message: string; link: TicketExternalLink }>(`/tickets/${id}/links`, {
        method: 'POST',
        body: JSON.stringify(link),
      }),
    // History
    getHistory: (id: string) =>
      request<{ ticketId: string; history: TicketHistoryEntry[]; count: number }>(`/tickets/${id}/history`),
    // AI Features
    ai: {
      status: () => request<AIStatus>('/tickets/ai/status'),
      responderStatus: () => request<AIResponderStatus>('/tickets/ai/responder-status'),
      categorize: (title: string, description?: string) =>
        request<{ categorization: TicketCategorization; durationMs: number }>('/tickets/ai/categorize', {
          method: 'POST',
          body: JSON.stringify({ title, description }),
        }),
      suggest: (title: string, description?: string, type?: string) =>
        request<{ suggestions: TicketSuggestion; durationMs: number }>('/tickets/ai/suggest', {
          method: 'POST',
          body: JSON.stringify({ title, description, type }),
        }),
      summary: (id: string) =>
        request<{ summary: string; source: 'ai' | 'fallback'; durationMs?: number }>(`/tickets/${id}/ai/summary`),
      similar: (id: string, limit = 5) =>
        request<{ ticketId: string; similar: SimilarTicket[]; count: number }>(`/tickets/${id}/similar?limit=${limit}`),
      respond: (id: string, options?: { commentId?: string; autoPost?: boolean; minConfidence?: number }) =>
        request<AICommentResponse>(`/tickets/${id}/comments/ai-respond`, {
          method: 'POST',
          body: JSON.stringify(options || {}),
        }),
      analyzeComment: (id: string, content: string) =>
        request<AICommentAnalysis>(`/tickets/${id}/ai/analyze-comment`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        }),
    },
  },

  // Chat API
  chat: {
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
    configure: (type: string, config: { apiKey?: string; baseUrl?: string; defaultModel?: string; apiVersion?: string; resourceName?: string; deploymentName?: string; enabled?: boolean }) =>
      request<{ success: boolean; message: string }>(`/chat/providers/${type}/configure`, {
        method: 'POST',
        body: JSON.stringify({ type, ...config }),
      }),
    quick: (prompt: string, options?: { model?: string; systemPrompt?: string; temperature?: number }) =>
      request<{ content: string; model: string; provider: string; usage: ChatUsage }>('/chat/quick', {
        method: 'POST',
        body: JSON.stringify({ prompt, ...options }),
      }),
    health: (type: string) =>
      request<{ provider: string; healthy: boolean; message: string; latencyMs?: number }>(`/chat/providers/${type}/health`, {
        method: 'POST',
      }),
    // Intelligence features
    presets: () =>
      request<{ presets: Array<{ id: string; name: string; description: string; icon: string; examples: string[] }>; default: string }>('/chat/presets'),
    quickActions: () =>
      request<{ actions: Array<{ id: string; label: string; icon: string; prompt: string }> }>('/chat/quick-actions'),
    // Skills system
    skills: {
      list: () =>
        request<{
          skills: Array<{
            id: string;
            name: string;
            description: string;
            icon: string;
            capabilities: string[];
            preferredModel?: 'fast' | 'balanced' | 'powerful';
            examples: string[];
          }>;
          modelTiers: Array<{
            tier: 'fast' | 'balanced' | 'powerful';
            description: string;
            costMultiplier: number;
          }>;
        }>('/chat/skills'),
      detect: (message: string, context?: { hasTask?: boolean; hasTicket?: boolean; hasCode?: boolean }) =>
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
        options?: { availableModels?: string[]; hasTask?: boolean; hasTicket?: boolean; hasCode?: boolean }
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
      request<ChatCompletionResponse & { context: { presetId: string; taskId?: string; ticketId?: string } }>('/chat/smart', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    // Conversation management
    conversations: {
      list: (params?: { limit?: number; offset?: number; taskId?: string; ticketId?: string }) => {
        const query = new URLSearchParams();
        if (params?.limit) query.set('limit', params.limit.toString());
        if (params?.offset) query.set('offset', params.offset.toString());
        if (params?.taskId) query.set('taskId', params.taskId);
        if (params?.ticketId) query.set('ticketId', params.ticketId);
        const queryStr = query.toString();
        return request<{ conversations: Array<{ id: string; title: string; presetId: string; createdAt: string; updatedAt: string }>; total: number }>(
          `/chat/conversations${queryStr ? `?${queryStr}` : ''}`
        );
      },
      recent: (limit = 10) =>
        request<{ conversations: Array<{ id: string; title: string; presetId: string; preview: string; messageCount: number; createdAt: string; updatedAt: string }> }>(
          `/chat/conversations/recent?limit=${limit}`
        ),
      create: (data: { title?: string; presetId?: string; taskId?: string; ticketId?: string; projectId?: string }) =>
        request<{ conversation: { id: string; title: string; presetId: string; createdAt: string; updatedAt: string } }>('/chat/conversations', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      get: (id: string) =>
        request<{
          conversation: { id: string; title: string; presetId: string; taskId?: string; ticketId?: string; createdAt: string; updatedAt: string };
          messages: Array<{
            id: string;
            conversationId: string;
            role: 'user' | 'assistant' | 'system';
            content: string;
            model?: string;
            provider?: string;
            tokenUsage?: { prompt: number; completion: number; total: number };
            cost?: number;
            createdAt: string;
          }>;
        }>(`/chat/conversations/${id}`),
      delete: (id: string) =>
        request<{ message: string }>(`/chat/conversations/${id}`, { method: 'DELETE' }),
      sendMessage: (conversationId: string, data: { content: string; model?: string; temperature?: number }) =>
        request<{
          userMessage: { id: string; conversationId: string; role: 'user'; content: string; createdAt: string };
          assistantMessage: {
            id: string;
            conversationId: string;
            role: 'assistant';
            content: string;
            model: string;
            provider: string;
            tokenUsage?: { prompt: number; completion: number; total: number };
            cost?: number;
            createdAt: string;
          };
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
          stats: {
            messageCount: number;
            estimatedTokens: number;
            contextWindow: number;
            usagePercentage: number;
            needsCompaction: boolean;
            summaryCount: number;
          };
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
          stats: {
            messageCount: number;
            estimatedTokens: number;
            contextWindow: number;
            usagePercentage: number;
            needsCompaction: boolean;
            summaryCount: number;
          };
        }>(`/chat/conversations/${conversationId}/compact${model ? `?model=${model}` : ''}`, {
          method: 'POST',
        }),
      // Send message with native tool calling
      sendMessageWithTools: (conversationId: string, data: { content: string; model?: string; temperature?: number; enableTools?: boolean }) =>
        request<{
          userMessage: { id: string; conversationId: string; role: 'user'; content: string; createdAt: string };
          assistantMessage: {
            id: string;
            conversationId: string;
            role: 'assistant';
            content: string;
            model: string;
            provider: string;
            tokenUsage?: { prompt: number; completion: number; total: number };
            cost?: number;
            createdAt: string;
          };
          usage?: { promptTokens: number; completionTokens: number; totalTokens: number; cost?: number };
          compaction?: { originalCount: number; compactedCount: number; tokensReduced: number };
          toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown>; result?: unknown }>;
          pendingApprovals?: Array<{
            id: string;
            toolName: string;
            params: Record<string, unknown>;
            securityLevel: 'moderate' | 'dangerous';
            command?: string;
            expiresAt?: number;
          }>;
          // Tool support info for UI warnings
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
      approve: (data: { conversationId: string; approvalId: string; decision: 'allow-once' | 'allow-always' | 'deny' }) =>
        request<{
          success: boolean;
          message: string;
          result?: unknown;
        }>('/chat/tools/approve', {
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
  },

  // Projects API
  projects: {
    list: (params?: {
      status?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
      includeArchived?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.includeArchived) searchParams.set('includeArchived', 'true');
      const query = searchParams.toString();
      return request<{
        projects: Array<{
          id: string;
          sequence: number;
          key: string;
          name: string;
          description?: string;
          icon: string;
          color: string;
          status: 'active' | 'archived';
          createdAt: string;
          updatedAt: string;
        }>;
        total: number;
        limit: number;
        offset: number;
      }>(`/projects${query ? `?${query}` : ''}`);
    },
    get: async (id: string, include?: 'all') => {
      const query = include ? `?include=${include}` : '';
      const response = await request<{ project: any }>(`/projects/${id}${query}`);
      return response.project;
    },
    getByKey: async (key: string) => {
      const response = await request<{ project: any }>(`/projects/by-key/${key}`);
      return response.project;
    },
    create: (data: {
      key: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      lead?: string;
    }) =>
      request<{ message: string; project: any }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      lead?: string;
    }) =>
      request<{ message: string; project: any }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    archive: (id: string) =>
      request<{ message: string; project: any }>(`/projects/${id}/archive`, {
        method: 'POST',
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/projects/${id}`, {
        method: 'DELETE',
      }),
    getDefault: async () => {
      const response = await request<{ project: any }>('/projects/default');
      return response.project;
    },
    migrate: () =>
      request<{ message: string; migrated: number }>('/projects/migrate', {
        method: 'POST',
      }),

    // External Links
    getExternalLinks: (projectId: string) =>
      request<{ externalLinks: any[] }>(`/projects/${projectId}/external-links`),
    addExternalLink: (projectId: string, data: { platform: string; externalId: string; externalUrl?: string }) =>
      request<{ message: string; externalLink: any }>(`/projects/${projectId}/external-links`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Sprints
    sprints: {
      list: (projectId: string, params?: {
        status?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        limit?: number;
        offset?: number;
      }) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set('status', params.status);
        if (params?.search) searchParams.set('search', params.search);
        if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.offset) searchParams.set('offset', String(params.offset));
        const query = searchParams.toString();
        return request<{
          sprints: Array<{
            id: string;
            sequence: number;
            projectId: string;
            name: string;
            goal?: string;
            status: 'planning' | 'active' | 'completed' | 'cancelled';
            startDate?: string;
            endDate?: string;
            capacity?: number;
            createdAt: string;
            updatedAt: string;
          }>;
          total: number;
          limit: number;
          offset: number;
        }>(`/projects/${projectId}/sprints${query ? `?${query}` : ''}`);
      },
      get: async (projectId: string, sprintId: string, include?: 'stats') => {
        const query = include ? `?include=${include}` : '';
        const response = await request<{ sprint: any }>(`/projects/${projectId}/sprints/${sprintId}${query}`);
        return response.sprint;
      },
      getActive: async (projectId: string) => {
        const response = await request<{ sprint: any }>(`/projects/${projectId}/sprints/active`);
        return response.sprint;
      },
      create: (projectId: string, data: {
        name: string;
        goal?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        capacity?: number;
      }) =>
        request<{ message: string; sprint: any }>(`/projects/${projectId}/sprints`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (projectId: string, sprintId: string, data: {
        name?: string;
        goal?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        capacity?: number;
      }) =>
        request<{ message: string; sprint: any }>(`/projects/${projectId}/sprints/${sprintId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      start: (projectId: string, sprintId: string) =>
        request<{ message: string; sprint: any }>(`/projects/${projectId}/sprints/${sprintId}/start`, {
          method: 'POST',
        }),
      complete: (projectId: string, sprintId: string) =>
        request<{ message: string; sprint: any }>(`/projects/${projectId}/sprints/${sprintId}/complete`, {
          method: 'POST',
        }),
      cancel: (projectId: string, sprintId: string) =>
        request<{ message: string; sprint: any }>(`/projects/${projectId}/sprints/${sprintId}/cancel`, {
          method: 'POST',
        }),
      delete: (projectId: string, sprintId: string) =>
        request<{ message: string }>(`/projects/${projectId}/sprints/${sprintId}`, {
          method: 'DELETE',
        }),

      // Sprint Tickets
      getTickets: (projectId: string, sprintId: string) =>
        request<{ ticketIds: string[] }>(`/projects/${projectId}/sprints/${sprintId}/tickets`),
      addTickets: (projectId: string, sprintId: string, ticketIds: string[]) =>
        request<{ message: string; assignments: any[] }>(`/projects/${projectId}/sprints/${sprintId}/tickets`, {
          method: 'POST',
          body: JSON.stringify({ ticketIds }),
        }),
      removeTicket: (projectId: string, sprintId: string, ticketId: string) =>
        request<{ message: string }>(`/projects/${projectId}/sprints/${sprintId}/tickets/${ticketId}`, {
          method: 'DELETE',
        }),
      reorderTickets: (projectId: string, sprintId: string, ticketOrder: string[]) =>
        request<{ message: string }>(`/projects/${projectId}/sprints/${sprintId}/tickets/reorder`, {
          method: 'PUT',
          body: JSON.stringify({ ticketOrder }),
        }),
    },
  },

  // Labels API
  labels: {
    list: (projectId: string, params?: { search?: string; includeGlobal?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.includeGlobal) searchParams.set('includeGlobal', 'true');
      const query = searchParams.toString();
      return request<{
        labels: Array<{
          id: string;
          projectId?: string;
          name: string;
          description?: string;
          color: string;
          parentId?: string;
          sortOrder: number;
          externalSource?: string;
          externalId?: string;
          createdAt: string;
          updatedAt: string;
        }>;
        total: number;
      }>(`/projects/${projectId}/labels${query ? `?${query}` : ''}`);
    },
    create: (projectId: string, data: {
      name: string;
      description?: string;
      color?: string;
      parentId?: string;
    }) =>
      request<{ message: string; label: any }>(`/projects/${projectId}/labels`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (labelId: string, data: {
      name?: string;
      description?: string;
      color?: string;
      parentId?: string;
      sortOrder?: number;
    }) =>
      request<{ message: string; label: any }>(`/labels/${labelId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (labelId: string) =>
      request<{ message: string }>(`/labels/${labelId}`, { method: 'DELETE' }),
    // Ticket labels
    getTicketLabels: (ticketId: string) =>
      request<{ ticketId: string; labels: any[]; count: number }>(`/tickets/${ticketId}/labels`),
    setTicketLabels: (ticketId: string, labelIds: string[]) =>
      request<{ message: string; labels: any[] }>(`/tickets/${ticketId}/labels`, {
        method: 'PUT',
        body: JSON.stringify({ labelIds }),
      }),
    addTicketLabel: (ticketId: string, labelId: string) =>
      request<{ message: string }>(`/tickets/${ticketId}/labels/${labelId}`, {
        method: 'POST',
      }),
    removeTicketLabel: (ticketId: string, labelId: string) =>
      request<{ message: string }>(`/tickets/${ticketId}/labels/${labelId}`, {
        method: 'DELETE',
      }),
  },

  // Sync Status API
  sync: {
    status: () =>
      request<{
        enabled: boolean;
        initialized: boolean;
        adapters: Record<string, { connected: boolean; lastSync?: string; errorCount: number }>;
        pendingConflicts: number;
        autoSyncEnabled: boolean;
        health: Record<string, { healthy: boolean; latencyMs: number }>;
      }>('/sync/status'),
    trigger: (platform?: string) =>
      request<{ message: string; results: any[] }>('/sync/trigger', {
        method: 'POST',
        body: JSON.stringify({ platform }),
      }),
    push: (ticketId: string, platform?: string) =>
      request<{ message: string; externalId?: string }>(`/sync/push/${ticketId}`, {
        method: 'POST',
        body: JSON.stringify({ platform }),
      }),
    conflicts: () =>
      request<{ conflicts: any[]; count: number }>('/sync/conflicts'),
    resolveConflict: (ticketId: string, resolution: 'local' | 'remote') =>
      request<{ message: string; resolution: string }>(`/sync/conflicts/${ticketId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      }),
  },

  // GitHub Import API
  import: {
    github: {
      validateToken: (token: string) =>
        request<{ valid: boolean; username: string }>('/import/github/validate-token', {
          method: 'POST',
          body: JSON.stringify({ token }),
        }),
      status: () =>
        request<{ hasToken: boolean; username?: string }>('/import/github/status'),
      disconnect: () =>
        request<{ message: string }>('/import/github/disconnect', { method: 'DELETE' }),
      listProjects: () =>
        request<{
          projects: Array<{
            id: string;
            number: number;
            title: string;
            shortDescription?: string;
            url: string;
            public: boolean;
            creator?: { login: string };
            items: { totalCount: number };
            fields: { totalCount: number };
          }>;
        }>('/import/github/projects'),
      getPreview: (projectId: string) =>
        request<{
          project: { id: string; title: string; url: string };
          iterations: Array<{ id: string; title: string; startDate: string; duration: number }>;
          items: Array<{
            id: string;
            title: string;
            body?: string;
            url: string;
            status?: string;
            priority?: string;
            type?: string;
            labels: string[];
            assignees: string[];
            iteration?: string;
            createdAt: string;
            updatedAt: string;
          }>;
          fieldMappings: {
            status: Record<string, string>;
            priority: Record<string, string>;
            type: Record<string, string>;
          };
        }>(`/import/github/projects/${encodeURIComponent(projectId)}/preview`),
      execute: (
        projectId: string,
        data: {
          projectKey: string;
          projectName: string;
          projectIcon?: string;
          projectColor?: string;
          importIterations?: boolean;
          enableSync?: boolean;
          fieldMappings?: {
            status: Record<string, string>;
            priority: Record<string, string>;
            type: Record<string, string>;
          };
        }
      ) =>
        request<{
          project: { id: string; key: string; name: string };
          summary: {
            projectCreated: boolean;
            sprintsCreated: number;
            ticketsCreated: number;
          };
        }>(`/import/github/projects/${encodeURIComponent(projectId)}/execute`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
  },
};
