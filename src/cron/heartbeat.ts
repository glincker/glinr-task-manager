/**
 * Heartbeat Monitor
 *
 * Monitors the health of all registered agents and pauses/resumes
 * task processing based on agent availability.
 */

import { getAgentRegistry } from '../adapters/registry.js';
import { sendSlackNotification } from '../notifications/slack.js';

const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute
const UNHEALTHY_THRESHOLD = 3; // Consecutive failures before alerting

let heartbeatInterval: NodeJS.Timeout | null = null;
const unhealthyCounts = new Map<string, number>();
const alertedAgents = new Set<string>();

/**
 * Check health of all agents
 */
async function checkAgentHealth(): Promise<void> {
  const registry = getAgentRegistry();
  const adapters = registry.getActiveAdapters();

  for (const adapter of adapters) {
    try {
      const health = await adapter.healthCheck();

      if (health.healthy) {
        // Reset unhealthy count
        const prevCount = unhealthyCounts.get(adapter.type) || 0;
        unhealthyCounts.set(adapter.type, 0);

        // If was alerted, send recovery notification
        if (alertedAgents.has(adapter.type)) {
          alertedAgents.delete(adapter.type);
          console.log(`[Heartbeat] ✅ ${adapter.name} recovered (latency: ${health.latencyMs}ms)`);

          await sendSlackNotification({
            type: 'agent_recovered',
            title: `✅ Agent Recovered: ${adapter.name}`,
            message: `${adapter.name} is healthy again. Latency: ${health.latencyMs}ms`,
            agent: adapter.type,
          }).catch(console.error);
        } else if (prevCount > 0) {
          console.log(`[Heartbeat] ${adapter.name} healthy again after ${prevCount} failures`);
        }
      } else {
        // Increment unhealthy count
        const count = (unhealthyCounts.get(adapter.type) || 0) + 1;
        unhealthyCounts.set(adapter.type, count);

        console.warn(`[Heartbeat] ⚠️ ${adapter.name} unhealthy (${count}/${UNHEALTHY_THRESHOLD}): ${health.message}`);

        // Alert after threshold
        if (count >= UNHEALTHY_THRESHOLD && !alertedAgents.has(adapter.type)) {
          alertedAgents.add(adapter.type);

          await sendSlackNotification({
            type: 'agent_unhealthy',
            title: `⚠️ Agent Unhealthy: ${adapter.name}`,
            message: `${adapter.name} has been unhealthy for ${count} consecutive checks.\nLast error: ${health.message}`,
            agent: adapter.type,
            severity: 'warning',
          }).catch(console.error);
        }
      }
    } catch (error) {
      const count = (unhealthyCounts.get(adapter.type) || 0) + 1;
      unhealthyCounts.set(adapter.type, count);
      console.error(`[Heartbeat] Error checking ${adapter.name}:`, error);
    }
  }
}

/**
 * Start the heartbeat monitor
 */
export function startHeartbeat(): void {
  if (heartbeatInterval) {
    console.log('[Heartbeat] Already running');
    return;
  }

  console.log('[Heartbeat] Starting agent health monitor (interval: 1 minute)');

  // Run immediately
  checkAgentHealth().catch(console.error);

  // Then run every minute
  heartbeatInterval = setInterval(() => {
    checkAgentHealth().catch(console.error);
  }, HEARTBEAT_INTERVAL);
}

/**
 * Stop the heartbeat monitor
 */
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[Heartbeat] Stopped');
  }
}

/**
 * Get current health status of all agents
 */
export function getHealthStatus(): Record<string, { healthy: boolean; failureCount: number }> {
  const status: Record<string, { healthy: boolean; failureCount: number }> = {};

  for (const [agent, count] of unhealthyCounts) {
    status[agent] = {
      healthy: count === 0,
      failureCount: count,
    };
  }

  return status;
}
