/**
 * API Client for GLINR Task Manager
 *
 * Provides type-safe API calls to the backend
 */

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

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  prompt: string;
  status: 'pending' | 'queued' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  source: string;
  sourceId?: string;
  sourceUrl?: string;
  repository?: string;
  branch?: string;
  labels: string[];
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
}

// Summary Types
export interface Summary {
  id: string;
  taskId?: string;
  sessionId?: string;
  agent: string;
  model?: string;
  title: string;
  whatChanged: string;
  whyChanged?: string;
  howChanged?: string;
  filesChanged: string[];
  decisions: string[];
  blockers: string[];
  artifacts: string[];
  createdAt: string;
}

export interface SummariesResponse {
  summaries: Summary[];
  total: number;
}

export interface SummaryStats {
  totalCount: number;
  byAgent: Record<string, number>;
  byTaskType: Record<string, number>;
  byComponent: Record<string, number>;
  totalTokens: number;
  totalCost: number;
  filesChangedCount: number;
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
    retry: (id: string) => request<{ message: string }>(`/dlq/${id}/retry`, { method: 'POST' }),
    remove: (id: string) => request<{ message: string }>(`/dlq/${id}`, { method: 'DELETE' }),
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
};
