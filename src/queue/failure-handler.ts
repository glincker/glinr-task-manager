/**
 * Task Failure Handler
 *
 * Handles task failures with retry logic, exponential backoff,
 * and escalation to dead letter queue.
 */

import type { Task, TaskResult } from '../types/task.js';
import { sendSlackNotification } from '../notifications/slack.js';

// In-memory dead letter queue (replace with DB in production)
const deadLetterQueue: Task[] = [];

/**
 * Handle a failed task
 */
export async function handleTaskFailure(task: Task, error: Error): Promise<void> {
  console.error(`[FailureHandler] Task ${task.id} failed: ${error.message}`);

  task.attempts = (task.attempts || 0) + 1;

  // Check if we should retry
  if (task.attempts < task.maxAttempts) {
    const delay = calculateBackoff(task.attempts);
    console.log(`[FailureHandler] Scheduling retry ${task.attempts}/${task.maxAttempts} in ${delay / 1000}s`);

    // In a real implementation, you'd requeue with BullMQ delay
    // await taskQueue.add(task.id, task, { delay });

    await sendSlackNotification({
      type: 'task_retry',
      title: `🔄 Task Retry: ${task.title}`,
      message: `Attempt ${task.attempts}/${task.maxAttempts} failed. Retrying in ${Math.round(delay / 60000)} minutes.\nError: ${error.message}`,
      task,
      severity: 'info',
    }).catch(console.error);

    return;
  }

  // Max retries reached - move to dead letter queue
  console.error(`[FailureHandler] Task ${task.id} exceeded max retries, moving to dead letter queue`);

  task.status = 'failed';
  task.result = {
    success: false,
    output: '',
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
      message: `Task failed after ${task.maxAttempts} attempts. Last error: ${error.message}`,
      stack: error.stack,
    },
  };

  // Add to dead letter queue
  deadLetterQueue.push(task);

  // Post failure comment on GitHub
  await postFailureComment(task, error);

  // Send critical alert
  await sendSlackNotification({
    type: 'task_failed',
    title: `❌ Task Failed: ${task.title}`,
    message: `Task failed after ${task.maxAttempts} attempts and moved to dead letter queue.\n\nLast error: ${error.message}\n\nSource: ${task.sourceUrl || 'N/A'}`,
    task,
    severity: 'error',
  }).catch(console.error);
}

/**
 * Calculate exponential backoff delay
 * 5min, 15min, 45min pattern
 */
function calculateBackoff(attempt: number): number {
  const baseDelay = 5 * 60 * 1000; // 5 minutes
  return Math.pow(3, attempt - 1) * baseDelay;
}

/**
 * Post failure comment on GitHub issue
 */
async function postFailureComment(task: Task, error: Error): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !task.repository || !task.sourceId) {
    return;
  }

  if (task.source !== 'github_issue' && task.source !== 'github_pr') {
    return;
  }

  const [owner, repo] = task.repository.split('/');
  const issueNumber = parseInt(task.sourceId);

  const body = `## ❌ AI Task Failed

**Status:** Failed after ${task.maxAttempts} attempts

### Error
\`\`\`
${error.message}
\`\`\`

### Details
- **Task ID:** \`${task.id}\`
- **Attempts:** ${task.attempts}/${task.maxAttempts}
- **Duration:** ${task.startedAt ? Math.round((Date.now() - task.startedAt.getTime()) / 1000) : 'N/A'}s

### Next Steps
This task has been moved to the dead letter queue for manual review. Please:
1. Check if the issue description is clear
2. Verify the codebase is in a buildable state
3. Re-trigger the task or assign to a human developer

---
*Posted by [GLINR Task Manager](https://github.com/GLINCKER/glinr-task-manager)*`;

  try {
    await fetch(
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
  } catch (err) {
    console.error('[FailureHandler] Failed to post GitHub comment:', err);
  }
}

/**
 * Get dead letter queue tasks
 */
export function getDeadLetterQueue(): Task[] {
  return [...deadLetterQueue];
}

/**
 * Remove task from dead letter queue (after manual resolution)
 */
export function removeFromDeadLetterQueue(taskId: string): boolean {
  const index = deadLetterQueue.findIndex(t => t.id === taskId);
  if (index >= 0) {
    deadLetterQueue.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Retry a task from dead letter queue
 */
export async function retryDeadLetterTask(taskId: string): Promise<boolean> {
  const index = deadLetterQueue.findIndex(t => t.id === taskId);
  if (index < 0) return false;

  const task = deadLetterQueue[index];
  task.attempts = 0; // Reset attempts
  task.status = 'pending';

  // Remove from DLQ
  deadLetterQueue.splice(index, 1);

  // In real implementation, add back to main queue
  // await addTask(task);

  console.log(`[FailureHandler] Task ${taskId} moved from DLQ back to main queue`);
  return true;
}
