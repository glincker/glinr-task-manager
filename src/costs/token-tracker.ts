import { onTaskEvent } from '../queue/task-queue.js';
import { calculateCost } from './pricing.js';
import { logger } from '../utils/logger.js';

export interface UsageSummary {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  taskCount: number;
  byModel: Record<string, {
    tokens: number;
    cost: number;
    tasks: number;
  }>;
  byAgent: Record<string, {
    tokens: number;
    cost: number;
    tasks: number;
  }>;
}

// In-memory usage store
let globalUsage: UsageSummary = {
  totalTokens: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalCost: 0,
  taskCount: 0,
  byModel: {},
  byAgent: {},
};

/**
 * Initialize the token tracker
 */
export function initTokenTracker(): void {
  logger.info('Initializing token tracker...');
  
  // Subscribe to task events
  onTaskEvent((event) => {
    if (event.type === 'completed' && event.result) {
      trackTaskUsage(event.task, event.result);
    }
  });
}

/**
 * Track usage for a single task
 */
function trackTaskUsage(task: any, result: any): void {
  if (!result.tokensUsed) return;

  const { input, output, total } = result.tokensUsed;
  // Get model from task metadata or default
  const model = task.metadata?.model || 'claude-3-5-sonnet';
  const agentId = task.assignedAgentId || 'unknown';
  
  // Calculate cost
  const cost = result.cost?.amount !== undefined 
    ? result.cost.amount 
    : calculateCost(model, input, output);

  // Update global stats
  globalUsage.totalTokens += total;
  globalUsage.inputTokens += input;
  globalUsage.outputTokens += output;
  globalUsage.totalCost += cost;
  globalUsage.taskCount += 1;

  // Update per-model stats
  if (!globalUsage.byModel[model]) {
    globalUsage.byModel[model] = { tokens: 0, cost: 0, tasks: 0 };
  }
  globalUsage.byModel[model].tokens += total;
  globalUsage.byModel[model].cost += cost;
  globalUsage.byModel[model].tasks += 1;

  // Update per-agent stats
  if (!globalUsage.byAgent[agentId]) {
    globalUsage.byAgent[agentId] = { tokens: 0, cost: 0, tasks: 0 };
  }
  globalUsage.byAgent[agentId].tokens += total;
  globalUsage.byAgent[agentId].cost += cost;
  globalUsage.byAgent[agentId].tasks += 1;

  logger.debug('Usage tracked for task', {
    taskId: task.id,
    model,
    tokens: total,
    cost,
  });
}

/**
 * Get current usage summary
 */
export function getUsageSummary(): UsageSummary {
  return { ...globalUsage };
}

/**
 * Reset usage (for testing or billing cycles)
 */
export function resetUsage(): void {
  globalUsage = {
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
    taskCount: 0,
    byModel: {},
    byAgent: {},
  };
}
