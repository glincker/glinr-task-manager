import { Queue, Worker, Job } from 'bullmq';
import type { Task, TaskResult, CreateTaskInput, TaskStatus } from '../types/task.js';
import { getAgentRegistry } from '../adapters/registry.js';
import { randomUUID } from 'crypto';

/**
 * Task Queue Manager
 *
 * Uses BullMQ (Redis-backed) for reliable task queuing with:
 * - Priority-based processing
 * - Retries with exponential backoff
 * - Progress tracking
 * - Result storage
 */

const QUEUE_NAME = 'ai-tasks';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Connection config
const connection = {
  host: new URL(REDIS_URL).hostname,
  port: parseInt(new URL(REDIS_URL).port || '6379'),
  password: new URL(REDIS_URL).password || undefined,
};

// Task queue instance
let taskQueue: Queue<Task> | null = null;
let taskWorker: Worker<Task, TaskResult> | null = null;

// In-memory task store (replace with DB in production)
const taskStore = new Map<string, Task>();
const eventCallbacks = new Map<string, (event: TaskEvent) => void>();

interface TaskEvent {
  type: 'created' | 'queued' | 'started' | 'progress' | 'completed' | 'failed';
  taskId: string;
  task: Task;
  result?: TaskResult;
  progress?: number;
}

/**
 * Initialize the task queue
 */
export async function initTaskQueue(): Promise<void> {
  // Create queue
  taskQueue = new Queue<Task>(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 86400, // Keep completed jobs for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // Keep failed jobs for 7 days
      },
    },
  });

  // Create worker
  taskWorker = new Worker<Task, TaskResult>(
    QUEUE_NAME,
    async (job: Job<Task>) => {
      return processTask(job);
    },
    {
      connection,
      concurrency: parseInt(process.env.TASK_CONCURRENCY || '2'),
    }
  );

  // Set up event handlers
  taskWorker.on('completed', (job, result) => {
    const task = taskStore.get(job.data.id);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      taskStore.set(task.id, task);

      emitEvent({
        type: 'completed',
        taskId: task.id,
        task,
        result,
      });
    }
    console.log(`[Queue] Task ${job.data.id} completed`);
  });

  taskWorker.on('failed', (job, err) => {
    if (!job) return;
    const task = taskStore.get(job.data.id);
    if (task) {
      task.status = 'failed';
      task.result = {
        success: false,
        output: '',
        error: {
          code: 'TASK_FAILED',
          message: err.message,
          stack: err.stack,
        },
      };
      taskStore.set(task.id, task);

      emitEvent({
        type: 'failed',
        taskId: task.id,
        task,
        result: task.result,
      });
    }
    console.error(`[Queue] Task ${job.data.id} failed:`, err.message);
  });

  taskWorker.on('progress', (job, progress) => {
    const task = taskStore.get(job.data.id);
    if (task) {
      emitEvent({
        type: 'progress',
        taskId: task.id,
        task,
        progress: progress as number,
      });
    }
  });

  console.log('[Queue] Task queue initialized');
}

/**
 * Process a task
 */
async function processTask(job: Job<Task>): Promise<TaskResult> {
  const task = job.data;

  console.log(`[Queue] Processing task ${task.id}: ${task.title}`);

  // Update status
  task.status = 'in_progress';
  task.startedAt = new Date();
  taskStore.set(task.id, task);

  emitEvent({
    type: 'started',
    taskId: task.id,
    task,
  });

  // Get the agent registry
  const registry = getAgentRegistry();

  // Find appropriate adapter
  const adapter = registry.findAdapterForTask(task);

  if (!adapter) {
    throw new Error('No suitable agent adapter found for task');
  }

  console.log(`[Queue] Using adapter: ${adapter.name}`);

  // Execute the task
  const result = await adapter.executeTask(task);

  // Update task with result
  task.result = result;

  if (result.success) {
    // Post results back to source (e.g., GitHub comment)
    await postResultToSource(task, result);
  }

  return result;
}

/**
 * Post task result back to the source
 */
async function postResultToSource(task: Task, result: TaskResult): Promise<void> {
  if (task.source === 'github_issue' || task.source === 'github_pr') {
    await postGitHubComment(task, result);
  }
  // Add other integrations here (Jira, Linear, etc.)
}

/**
 * Post a comment on GitHub with task results
 */
async function postGitHubComment(task: Task, result: TaskResult): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !task.repository || !task.sourceId) {
    console.log('[GitHub] Missing token or task info, skipping comment');
    return;
  }

  const [owner, repo] = task.repository.split('/');
  const issueNumber = parseInt(task.sourceId);

  // Build comment body
  let body = `## AI Task Result\n\n`;
  body += `**Status:** ${result.success ? '✅ Completed' : '❌ Failed'}\n\n`;

  if (result.output) {
    body += `### Summary\n\n${result.output}\n\n`;
  }

  if (result.artifacts && result.artifacts.length > 0) {
    body += `### Artifacts\n\n`;
    for (const artifact of result.artifacts) {
      if (artifact.type === 'commit') {
        body += `- Commit: \`${artifact.sha}\`\n`;
      } else if (artifact.type === 'pull_request') {
        body += `- Pull Request: ${artifact.url}\n`;
      } else if (artifact.type === 'file') {
        body += `- File: \`${artifact.path}\`\n`;
      }
    }
    body += '\n';
  }

  if (result.error) {
    body += `### Error\n\n\`\`\`\n${result.error.message}\n\`\`\`\n\n`;
  }

  if (result.duration) {
    body += `*Completed in ${(result.duration / 1000).toFixed(1)}s*\n`;
  }

  body += `\n---\n*Posted by [GLINR Task Manager](https://github.com/GLINCKER/glinr-task-manager)*`;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'glinr-task-manager',
        },
        body: JSON.stringify({ body }),
      }
    );

    if (!response.ok) {
      console.error('[GitHub] Failed to post comment:', await response.text());
    } else {
      console.log(`[GitHub] Posted result to issue #${issueNumber}`);
    }
  } catch (error) {
    console.error('[GitHub] Error posting comment:', error);
  }
}

/**
 * Add a new task to the queue
 */
export async function addTask(input: CreateTaskInput): Promise<Task> {
  if (!taskQueue) {
    throw new Error('Task queue not initialized');
  }

  // Create full task object
  const task: Task = {
    ...input,
    id: randomUUID(),
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    attempts: 0,
    maxAttempts: 3,
  };

  // Store task
  taskStore.set(task.id, task);

  emitEvent({
    type: 'created',
    taskId: task.id,
    task,
  });

  // Add to queue with priority
  await taskQueue.add(task.id, task, {
    priority: task.priority,
    jobId: task.id,
  });

  task.status = 'queued';
  taskStore.set(task.id, task);

  emitEvent({
    type: 'queued',
    taskId: task.id,
    task,
  });

  console.log(`[Queue] Task ${task.id} added to queue`);

  return task;
}

/**
 * Get task by ID
 */
export function getTask(id: string): Task | undefined {
  return taskStore.get(id);
}

/**
 * Get all tasks (paginated)
 */
export function getTasks(options?: {
  status?: TaskStatus;
  limit?: number;
  offset?: number;
}): Task[] {
  let tasks = Array.from(taskStore.values());

  // Filter by status
  if (options?.status) {
    tasks = tasks.filter((t) => t.status === options.status);
  }

  // Sort by created date (newest first)
  tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Paginate
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  return tasks.slice(offset, offset + limit);
}

/**
 * Subscribe to task events
 */
export function onTaskEvent(callback: (event: TaskEvent) => void): () => void {
  const id = randomUUID();
  eventCallbacks.set(id, callback);
  return () => eventCallbacks.delete(id);
}

/**
 * Emit event to all subscribers
 */
function emitEvent(event: TaskEvent): void {
  for (const callback of eventCallbacks.values()) {
    try {
      callback(event);
    } catch (error) {
      console.error('[Queue] Error in event callback:', error);
    }
  }
}

/**
 * Close the queue (for graceful shutdown)
 */
export async function closeTaskQueue(): Promise<void> {
  if (taskWorker) {
    await taskWorker.close();
    taskWorker = null;
  }
  if (taskQueue) {
    await taskQueue.close();
    taskQueue = null;
  }
  console.log('[Queue] Task queue closed');
}
