import type { Task, CreateTaskInput } from '../types/task.js';
import type { Summary, CreateSummaryInput, SummaryQuery, SummaryStats } from '../types/summary.js';

/**
 * Generic Storage Adapter Interface
 */
export interface StorageAdapter {
  // Lifecycle
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Tasks
  createTask(input: CreateTaskInput): Promise<Task>;
  getTask(id: string): Promise<Task | null>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<boolean>;
  getTasks(query?: { limit?: number; offset?: number; status?: string }): Promise<{ tasks: Task[]; total: number }>;

  // Summaries
  createSummary(input: CreateSummaryInput): Promise<Summary>;
  getSummary(id: string): Promise<Summary | null>;
  getTaskSummaries(taskId: string): Promise<Summary[]>;
  querySummaries(query: Partial<SummaryQuery>): Promise<{ summaries: Summary[]; total: number }>;
  deleteSummary(id: string): Promise<boolean>;
  getSummaryStats(): Promise<SummaryStats>;

  // Vector Search (Optional implementation)
  storeEmbedding?(id: string, entityType: 'task' | 'summary', entityId: string, embedding: number[], model: string): Promise<void>;
  searchSimilar?(entityType: 'task' | 'summary', embedding: number[], limit?: number): Promise<Array<{ entityId: string; distance: number }>>;

  // Health
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;

  // Agent Stats
  getAgentStats(): Promise<Record<string, { completed: number; failed: number; avgDuration: number; lastActivity?: Date }>>;

  // Costs
  getCostAnalytics(): Promise<{
    daily: Array<{ date: string; cost: number; tokens: number }>;
    byModel: Record<string, { cost: number; tokens: number }>;
    byAgent: Record<string, { cost: number; tokens: number }>;
    totalCost: number;
    totalTokens: number;
  }>;
}
