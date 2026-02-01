/**
 * Cron Jobs Index
 *
 * Starts and stops all background cron jobs.
 */

import { startIssuePoller, stopIssuePoller } from './issue-poller.js';
import { startHeartbeat, stopHeartbeat } from './heartbeat.js';
import { startStaleChecker, stopStaleChecker } from './stale-checker.js';

/**
 * Start all cron jobs
 */
export function startAllCronJobs(): void {
  console.log('[Cron] Starting all background jobs...');

  startHeartbeat();
  startIssuePoller();
  startStaleChecker();

  console.log('[Cron] All background jobs started');
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(): void {
  console.log('[Cron] Stopping all background jobs...');

  stopHeartbeat();
  stopIssuePoller();
  stopStaleChecker();

  console.log('[Cron] All background jobs stopped');
}

export { startIssuePoller, stopIssuePoller } from './issue-poller.js';
export { startHeartbeat, stopHeartbeat, getHealthStatus } from './heartbeat.js';
export { startStaleChecker, stopStaleChecker } from './stale-checker.js';
