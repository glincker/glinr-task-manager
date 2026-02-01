/**
 * Stale Task Checker
 *
 * Finds tasks that have been in_progress for too long and marks them
 * as failed or retries them.
 */

import { getTasks, onTaskEvent } from '../queue/task-queue.js';
import { handleTaskFailure } from '../queue/failure-handler.js';
import type { Task } from '../types/task.js';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes - task considered stale

let checkerInterval: NodeJS.Timeout | null = null;

/**
 * Check for stale tasks
 */
async function checkStaleTasks(): Promise<void> {
  const inProgressTasks = getTasks({ status: 'in_progress' });
  const now = Date.now();

  for (const task of inProgressTasks) {
    if (!task.startedAt) continue;

    const elapsed = now - task.startedAt.getTime();

    if (elapsed > STALE_THRESHOLD) {
      console.warn(`[StaleChecker] Task ${task.id} has been running for ${Math.round(elapsed / 60000)} minutes`);

      // Mark as failed and let failure handler deal with it
      await handleTaskFailure(
        task,
        new Error(`Task stale: running for ${Math.round(elapsed / 60000)} minutes without completion`)
      );
    }
  }
}

/**
 * Start the stale task checker
 */
export function startStaleChecker(): void {
  if (checkerInterval) {
    console.log('[StaleChecker] Already running');
    return;
  }

  console.log('[StaleChecker] Starting stale task checker (interval: 5 minutes)');

  // Run every 5 minutes
  checkerInterval = setInterval(() => {
    checkStaleTasks().catch(console.error);
  }, CHECK_INTERVAL);
}

/**
 * Stop the stale task checker
 */
export function stopStaleChecker(): void {
  if (checkerInterval) {
    clearInterval(checkerInterval);
    checkerInterval = null;
    console.log('[StaleChecker] Stopped');
  }
}
