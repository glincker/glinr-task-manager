import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handleGitHubWebhook } from './integrations/github.js';
import { handleJiraWebhook } from './integrations/jira.js';
import { handleLinearWebhook } from './integrations/linear.js';
import {
  handlePostToolUse,
  handleSessionEnd,
  handlePromptSubmit,
  handleOpenClawWebhook,
  handleGenericAgentWebhook,
  getSessionEvents,
  getSessionSummary,
  getRecentSessions,
  getRecentReports,
  getTaskReports,
} from './hooks/index.js';
import { initTaskQueue, addTask, getTask, getTasks, closeTaskQueue } from './queue/task-queue.js';
import { getDeadLetterQueue, retryDeadLetterTask, removeFromDeadLetterQueue } from './queue/failure-handler.js';
import { getAgentRegistry } from './adapters/registry.js';
import { startAllCronJobs, stopAllCronJobs, getHealthStatus } from './cron/index.js';
import { CreateTaskSchema } from './types/task.js';
import { initTokenTracker, getUsageSummary } from './costs/token-tracker.js';
import { getBudgetStatus } from './costs/budget.js';

const app = new Hono();

// Middleware
const log = logger();
app.use('*', (c, next) => {
  if (c.req.path === '/health') {
    return next();
  }
  return log(c, next);
});
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Health check
app.get('/health', (c) => {
  const agentHealth = getHealthStatus();
  return c.json({
    status: 'ok',
    service: 'glinr-task-manager',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    agents: agentHealth,
  });
});

// API info
app.get('/', (c) => {
  return c.json({
    name: 'GLINR Task Manager',
    version: '0.2.0',
    description: 'AI Agent Task Orchestration - Autonomous Mode',
    docs: '/docs',
    endpoints: {
      health: 'GET /health',
      tasks: 'GET /api/tasks',
      createTask: 'POST /api/tasks',
      getTask: 'GET /api/tasks/:id',
      agents: 'GET /api/agents',
      deadLetterQueue: 'GET /api/dlq',
      retryDlqTask: 'POST /api/dlq/:id/retry',
      webhooks: {
        github: 'POST /webhooks/github',
        jira: 'POST /webhooks/jira',
        linear: 'POST /webhooks/linear',
      },
      hooks: {
        toolUse: 'POST /api/hook/tool-use',
        sessionEnd: 'POST /api/hook/session-end',
        promptSubmit: 'POST /api/hook/prompt-submit',
        sessions: 'GET /api/hook/sessions',
        sessionEvents: 'GET /api/hook/sessions/:sessionId/events',
        sessionSummary: 'GET /api/hook/sessions/:sessionId/summary',
      },
      agentWebhooks: {
        openclaw: 'POST /api/webhook/openclaw',
        generic: 'POST /api/webhook/agent',
        reports: 'GET /api/webhook/reports',
        taskReports: 'GET /api/webhook/tasks/:taskId/reports',
      },
      costs: {
        summary: 'GET /api/costs/summary',
        budget: 'GET /api/costs/budget',
      },
    },
  });
});

// === Task API ===

// List tasks
app.get('/api/tasks', (c) => {
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const tasks = getTasks({
    status: status as any,
    limit,
    offset,
  });

  return c.json({
    tasks,
    count: tasks.length,
    limit,
    offset,
  });
});

// Create task
app.post('/api/tasks', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = CreateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const task = await addTask(parsed.data);

    return c.json(
      {
        message: 'Task created',
        task,
      },
      201
    );
  } catch (error) {
    console.error('[API] Error creating task:', error);
    return c.json(
      {
        error: 'Failed to create task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Get single task
app.get('/api/tasks/:id', (c) => {
  const id = c.req.param('id');
  const task = getTask(id);

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json({ task });
});

// === Dead Letter Queue API ===

// List dead letter queue tasks
app.get('/api/dlq', (c) => {
  const tasks = getDeadLetterQueue();
  return c.json({
    tasks,
    count: tasks.length,
  });
});

// Retry a task from DLQ
app.post('/api/dlq/:id/retry', async (c) => {
  const id = c.req.param('id');
  const success = await retryDeadLetterTask(id);

  if (!success) {
    return c.json({ error: 'Task not found in dead letter queue' }, 404);
  }

  return c.json({ message: 'Task moved back to queue for retry' });
});

// Remove task from DLQ (manual resolution)
app.delete('/api/dlq/:id', (c) => {
  const id = c.req.param('id');
  const success = removeFromDeadLetterQueue(id);

  if (!success) {
    return c.json({ error: 'Task not found in dead letter queue' }, 404);
  }

  return c.json({ message: 'Task removed from dead letter queue' });
});

// === Agent API ===

// List available agents
app.get('/api/agents', async (c) => {
  const registry = getAgentRegistry();
  const adapters = registry.getActiveAdapters();

  const agents = await Promise.all(
    adapters.map(async (adapter) => {
      const health = await adapter.healthCheck();
      return {
        type: adapter.type,
        name: adapter.name,
        description: adapter.description,
        capabilities: adapter.capabilities,
        health,
      };
    })
  );

  return c.json({ agents });
});

// List adapter types
app.get('/api/agents/types', (c) => {
  const registry = getAgentRegistry();
  return c.json({
    types: registry.getAdapterTypes(),
  });
});

// === Webhook Endpoints ===

// GitHub webhook
app.post('/webhooks/github', async (c) => {
  try {
    const taskInput = await handleGitHubWebhook(c);

    if (!taskInput) {
      return c.json({ message: 'Webhook received, no task created' });
    }

    const task = await addTask(taskInput);

    return c.json({
      message: 'Task created from GitHub webhook',
      task,
    });
  } catch (error) {
    console.error('[Webhook] GitHub error:', error);
    return c.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error && error.message.includes('signature') ? 401 : 500
    );
  }
});

// Jira webhook
app.post('/webhooks/jira', async (c) => {
  try {
    const taskInput = await handleJiraWebhook(c);

    if (!taskInput) {
      return c.json({ message: 'Webhook received, no task created' });
    }

    const task = await addTask(taskInput);

    return c.json({
      message: 'Task created from Jira webhook',
      task,
    });
  } catch (error) {
    console.error('[Webhook] Jira error:', error);
    return c.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error && error.message.includes('token') ? 401 : 500
    );
  }
});

// Linear webhook
app.post('/webhooks/linear', async (c) => {
  try {
    const taskInput = await handleLinearWebhook(c);

    if (!taskInput) {
      return c.json({ message: 'Webhook received, no task created' });
    }

    const task = await addTask(taskInput);

    return c.json({
      message: 'Task created from Linear webhook',
      task,
    });
  } catch (error) {
    console.error('[Webhook] Linear error:', error);
    return c.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error && error.message.includes('signature') ? 401 : 500
    );
  }
});

// === Hook Endpoints (Zero-Cost Agent Integration) ===

// PostToolUse hook - receives tool usage events from Claude Code
app.post('/api/hook/tool-use', async (c) => {
  try {
    const result = await handlePostToolUse(c);

    if (!result.success) {
      return c.json(
        {
          error: 'Hook processing failed',
          message: result.error,
        },
        400
      );
    }

    return c.json({
      message: 'Hook processed',
      eventId: result.eventId,
      inference: result.inference,
    });
  } catch (error) {
    console.error('[Hook] PostToolUse error:', error);
    return c.json(
      {
        error: 'Hook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Session end hook - receives session completion events
app.post('/api/hook/session-end', async (c) => {
  try {
    const result = await handleSessionEnd(c);

    if (!result.success) {
      return c.json(
        {
          error: 'Hook processing failed',
          message: result.error,
        },
        400
      );
    }

    return c.json({
      message: 'Session recorded',
      eventId: result.eventId,
      inference: result.inference,
    });
  } catch (error) {
    console.error('[Hook] Session end error:', error);
    return c.json(
      {
        error: 'Hook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// User prompt submit hook - receives user prompts for context
app.post('/api/hook/prompt-submit', async (c) => {
  try {
    const result = await handlePromptSubmit(c);

    if (!result.success) {
      return c.json(
        {
          error: 'Hook processing failed',
          message: result.error,
        },
        400
      );
    }

    return c.json({
      message: 'Prompt recorded',
      eventId: result.eventId,
    });
  } catch (error) {
    console.error('[Hook] Prompt submit error:', error);
    return c.json(
      {
        error: 'Hook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Get session events
app.get('/api/hook/sessions/:sessionId/events', (c) => {
  const sessionId = c.req.param('sessionId');
  const events = getSessionEvents(sessionId);

  return c.json({
    sessionId,
    events,
    count: events.length,
  });
});

// Get session summary
app.get('/api/hook/sessions/:sessionId/summary', (c) => {
  const sessionId = c.req.param('sessionId');
  const summary = getSessionSummary(sessionId);

  return c.json({
    sessionId,
    ...summary,
  });
});

// List recent sessions
app.get('/api/hook/sessions', (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const sessions = getRecentSessions(limit);

  return c.json({
    sessions,
    count: sessions.length,
  });
});

// === Agent Webhook Endpoints ===

// OpenClaw completion webhook
app.post('/api/webhook/openclaw', async (c) => {
  try {
    const report = await handleOpenClawWebhook(c);

    if (!report) {
      return c.json({ message: 'Webhook received, no action taken' });
    }

    return c.json({
      message: 'Agent completion recorded',
      reportId: report.id,
      status: report.status,
    });
  } catch (error) {
    console.error('[Webhook] OpenClaw error:', error);
    return c.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error && error.message.includes('signature') ? 401 : 500
    );
  }
});

// Generic agent completion webhook
app.post('/api/webhook/agent', async (c) => {
  try {
    const report = await handleGenericAgentWebhook(c);

    if (!report) {
      return c.json({ message: 'Webhook received, no action taken' });
    }

    return c.json({
      message: 'Agent completion recorded',
      reportId: report.id,
      agent: report.agent,
      status: report.status,
    });
  } catch (error) {
    console.error('[Webhook] Agent error:', error);
    return c.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error && error.message.includes('signature') ? 401 : 500
    );
  }
});

// List recent agent reports
app.get('/api/webhook/reports', (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const agent = c.req.query('agent');

  const reports = agent
    ? getRecentReports(limit).filter(r => r.agent === agent)
    : getRecentReports(limit);

  return c.json({
    reports,
    count: reports.length,
  });
});

// Get reports for a specific task
app.get('/api/webhook/tasks/:taskId/reports', (c) => {
  const taskId = c.req.param('taskId');
  const reports = getTaskReports(taskId);

  return c.json({
    taskId,
    reports,
    count: reports.length,
  });
});

// === Cost API ===

// Get usage summary
app.get('/api/costs/summary', (c) => {
  const summary = getUsageSummary();
  return c.json(summary);
});

// Get budget status
app.get('/api/costs/budget', (c) => {
  const status = getBudgetStatus();
  return c.json(status);
});

// === Server Startup ===

const PORT = parseInt(process.env.PORT || '3000');
const ENABLE_CRON = process.env.ENABLE_CRON !== 'false'; // Default enabled

async function main() {
  console.log('🚀 GLINR Task Manager starting...');
  console.log('   Mode: Autonomous');

  // Initialize task queue
  try {
    await initTaskQueue();
    console.log('✅ Task queue initialized');
  } catch (error) {
    console.error('❌ Failed to initialize task queue:', error);
    console.log('⚠️  Running without Redis (tasks will not be processed)');
  }

  // Initialize cost tracking
  initTokenTracker();
  console.log('✅ Token tracker initialized');

  // Initialize default agents from env
  const registry = getAgentRegistry();

  // Auto-configure OpenClaw if env vars present
  if (process.env.OPENCLAW_GATEWAY_TOKEN) {
    try {
      registry.createAdapter({
        id: 'openclaw-default',
        type: 'openclaw',
        enabled: true,
        maxConcurrent: 2,
        priority: 10,
        config: {
          baseUrl: process.env.OPENCLAW_BASE_URL,
          token: process.env.OPENCLAW_GATEWAY_TOKEN,
          workingDir: process.env.OPENCLAW_WORKING_DIR,
        },
      });
      console.log('✅ OpenClaw adapter configured');
    } catch (error) {
      console.error('❌ Failed to configure OpenClaw:', error);
    }
  }

  // Auto-configure Claude Code if available
  try {
    const { execSync } = await import('child_process');
    execSync('which claude', { stdio: 'ignore' });
    registry.createAdapter({
      id: 'claude-code-default',
      type: 'claude-code',
      enabled: true,
      maxConcurrent: 1,
      priority: 5,
      config: {
        workingDir: process.env.CLAUDE_WORKING_DIR || process.cwd(),
      },
    });
    console.log('✅ Claude Code adapter configured');
  } catch {
    console.log('ℹ️  Claude Code CLI not found, skipping adapter');
  }

  // Start cron jobs for autonomous operation
  if (ENABLE_CRON) {
    startAllCronJobs();
    console.log('✅ Cron jobs started (autonomous mode)');
  } else {
    console.log('ℹ️  Cron jobs disabled (ENABLE_CRON=false)');
  }

  // Start server
  serve({
    fetch: app.fetch,
    port: PORT,
  });

  console.log(`\n🎉 GLINR Task Manager running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  📋 Tasks:    http://localhost:${PORT}/api/tasks`);
  console.log(`  🤖 Agents:   http://localhost:${PORT}/api/agents`);
  console.log(`  💀 DLQ:      http://localhost:${PORT}/api/dlq`);
  console.log(`  🔗 GitHub:   http://localhost:${PORT}/webhooks/github`);
  console.log(`  🔗 Jira:     http://localhost:${PORT}/webhooks/jira`);
  console.log(`  🪝 Hooks:    http://localhost:${PORT}/api/hook/tool-use`);
  console.log(`  📊 Sessions: http://localhost:${PORT}/api/hook/sessions`);
  console.log(`  ❤️  Health:   http://localhost:${PORT}/health`);

  if (ENABLE_CRON) {
    console.log(`\nAutonomous Features:`);
    console.log(`  🔄 Issue Poller: Every 5 minutes`);
    console.log(`  💓 Heartbeat: Every 1 minute`);
    console.log(`  🕐 Stale Checker: Every 5 minutes`);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down...');
  stopAllCronJobs();
  await closeTaskQueue();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down...');
  stopAllCronJobs();
  await closeTaskQueue();
  process.exit(0);
});

main().catch(console.error);
