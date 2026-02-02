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
import { initTaskQueue, addTask, getTask, getTasks, cancelTask, retryTask, closeTaskQueue } from './queue/task-queue.js';
import { getDeadLetterQueue, retryDeadLetterTask, removeFromDeadLetterQueue } from './queue/failure-handler.js';
import { getAgentRegistry } from './adapters/registry.js';
import { startAllCronJobs, stopAllCronJobs, getHealthStatus } from './cron/index.js';
import { CreateTaskSchema } from './types/task.js';
import { initTokenTracker, getUsageSummary } from './costs/token-tracker.js';
import { getBudgetStatus } from './costs/budget.js';
import { loadConfig } from './utils/config-loader.js';
import { initStorage, getStorage } from './storage/index.js';
import {
  createSummary,
  getSummary,
  getTaskSummaries,
  querySummaries,
  searchSummaries,
  getSummaryStats,
  getRecentSummaries,
  deleteSummary,
  CreateSummaryInputSchema,
  SummaryQuerySchema,
} from './summaries/index.js';
import {
  redirectToGitHub,
  handleGitHubCallback,
} from './auth/github-oauth.js';
import {
  redirectToJira,
  handleJiraCallback,
} from './auth/jira-oauth.js';
import {
  redirectToLinear,
  handleLinearCallback,
} from './auth/linear-oauth.js';
import { generatePRDescription, generateChangelog } from './summaries/templates.js';
import { getEmbeddingService } from './ai/embedding-service.js';
import { logger as systemLogger } from './utils/logger.js';

interface SettingsYaml {
  server: {
    port: number;
    cors: {
      origin: string;
    };
    enableCron: boolean;
  };
  agents?: {
    autoDiscover?: boolean;
  };
}

const settings = loadConfig<SettingsYaml>('settings.yml');

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
    origin: process.env.CORS_ORIGIN || settings.server?.cors?.origin || '*',
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
      cancelTask: 'POST /api/tasks/:id/cancel',
      retryTask: 'POST /api/tasks/:id/retry',
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
      summaries: {
        list: 'GET /api/summaries',
        create: 'POST /api/summaries',
        get: 'GET /api/summaries/:id',
        delete: 'DELETE /api/summaries/:id',
        search: 'GET /api/summaries/search',
        stats: 'GET /api/summaries/stats',
        recent: 'GET /api/summaries/recent',
        byTask: 'GET /api/tasks/:taskId/summaries',
      },
    },
  });
});

// === Auth API ===
app.get('/auth/github', (c) => redirectToGitHub(c));
app.get('/auth/github/callback', (c) => handleGitHubCallback(c));

app.get('/auth/jira', (c) => redirectToJira(c));
app.get('/auth/jira/callback', (c) => handleJiraCallback(c));

app.get('/auth/linear', (c) => redirectToLinear(c));
app.get('/auth/linear/callback', (c) => handleLinearCallback(c));

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

// Cancel a task
app.post('/api/tasks/:id/cancel', async (c) => {
  const id = c.req.param('id');
  const success = await cancelTask(id);

  if (!success) {
    const task = getTask(id);
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }
    return c.json({ error: 'Task cannot be cancelled (not running or pending)' }, 400);
  }

  return c.json({ message: 'Task cancelled', task: getTask(id) });
});

// Retry a task
app.post('/api/tasks/:id/retry', async (c) => {
  const id = c.req.param('id');
  const newTask = await retryTask(id);

  if (!newTask) {
    const task = getTask(id);
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }
    return c.json({ error: 'Task cannot be retried (not failed or completed)' }, 400);
  }

  return c.json({ message: 'Task queued for retry', task: newTask, originalTaskId: id });
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

// List available agents with detailed status
app.get('/api/agents', async (c) => {
  const registry = getAgentRegistry();
  const adapters = registry.getActiveAdapters();
  const storage = getStorage();
  
  let agentStats: Record<string, any> = {};
  try {
    agentStats = await storage.getAgentStats();
  } catch (error) {
    console.warn('[API] Could not fetch agent stats:', error);
  }

  const agents = await Promise.all(
    adapters.map(async (adapter) => {
      const health = await adapter.healthCheck();
      const stats = agentStats[adapter.type] || { completed: 0, failed: 0, avgDuration: 0 };
      
      return {
        type: adapter.type,
        name: adapter.name,
        description: adapter.description,
        capabilities: adapter.capabilities,
        configured: true, // If it's in active adapters, it's partially configured
        healthy: health,
        lastActivity: stats.lastActivity || null,
        stats: {
          completed: stats.completed,
          failed: stats.failed,
          avgDuration: stats.avgDuration,
        },
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

// === Integration Status API ===

// Get integration/webhook status
app.get('/api/integrations/status', (c) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

  // Check which integrations have credentials configured
  const integrations = {
    github: {
      name: 'GitHub',
      configured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      webhookUrl: `${baseUrl}/webhooks/github`,
      oauthUrl: `${baseUrl}/auth/github`,
      icon: 'github',
      description: 'Issues and Pull Requests',
    },
    jira: {
      name: 'Jira',
      configured: Boolean(process.env.JIRA_CLIENT_ID && process.env.JIRA_CLIENT_SECRET),
      webhookUrl: `${baseUrl}/webhooks/jira`,
      oauthUrl: `${baseUrl}/auth/jira`,
      icon: 'jira',
      description: 'Issues and Projects',
    },
    linear: {
      name: 'Linear',
      configured: Boolean(process.env.LINEAR_CLIENT_ID && process.env.LINEAR_CLIENT_SECRET),
      webhookUrl: `${baseUrl}/webhooks/linear`,
      oauthUrl: `${baseUrl}/auth/linear`,
      icon: 'linear',
      description: 'Issues and Cycles',
    },
  };

  return c.json({
    integrations,
    baseUrl,
    hookEndpoints: {
      toolUse: `${baseUrl}/api/hook/tool-use`,
      sessionEnd: `${baseUrl}/api/hook/session-end`,
      promptSubmit: `${baseUrl}/api/hook/prompt-submit`,
    },
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

// Get historical cost analytics
app.get('/api/costs/analytics', async (c) => {
  const storage = getStorage();
  const analytics = await storage.getCostAnalytics();
  return c.json(analytics);
});

// === Summary API ===

// Get summary statistics (before :id route to avoid conflict)
app.get('/api/summaries/stats', async (c) => {
  const stats = await getSummaryStats();
  return c.json(stats);
});

// Get recent summaries (before :id route to avoid conflict)
app.get('/api/summaries/recent', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const summaries = await getRecentSummaries(limit);

  return c.json({
    summaries,
    count: summaries.length,
  });
});

// Search summaries (before :id route to avoid conflict)
app.get('/api/summaries/search', async (c) => {
  const q = c.req.query('q');
  const limit = parseInt(c.req.query('limit') || '20');

  if (!q) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  const summaries = await searchSummaries(q, limit);
  return c.json({
    query: q,
    summaries,
    count: summaries.length,
  });
});

// List/query summaries
app.get('/api/summaries', async (c) => {
  const queryParams: Record<string, unknown> = {};

  // Extract query parameters
  const taskId = c.req.query('taskId');
  const sessionId = c.req.query('sessionId');
  const agent = c.req.query('agent');
  const taskType = c.req.query('taskType');
  const component = c.req.query('component');
  const repository = c.req.query('repository');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const search = c.req.query('search');
  const sortBy = c.req.query('sortBy');
  const sortOrder = c.req.query('sortOrder');
  const limit = c.req.query('limit');
  const offset = c.req.query('offset');

  if (taskId) queryParams.taskId = taskId;
  if (sessionId) queryParams.sessionId = sessionId;
  if (agent) queryParams.agent = agent;
  if (taskType) queryParams.taskType = taskType;
  if (component) queryParams.component = component;
  if (repository) queryParams.repository = repository;
  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  if (search) queryParams.search = search;
  if (sortBy) queryParams.sortBy = sortBy;
  if (sortOrder) queryParams.sortOrder = sortOrder;
  if (limit) queryParams.limit = parseInt(limit);
  if (offset) queryParams.offset = parseInt(offset);

  // Validate query
  const parsed = SummaryQuerySchema.partial().safeParse(queryParams);
  if (!parsed.success) {
    return c.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const result = await querySummaries(parsed.data);
  return c.json({
    summaries: result.summaries,
    total: result.total,
    limit: queryParams.limit || 50,
    offset: queryParams.offset || 0,
  });
});

// Semantic Search
app.get('/api/summaries/semantic', async (c) => {
  const query = c.req.query('q');
  const type = c.req.query('type') as 'task' | 'summary' || 'summary';
  const limit = parseInt(c.req.query('limit') || '5');
  
  if (!query) return c.json({ error: 'Missing query' }, 400);

  try {
    const storage = getStorage();
    if (!storage.searchSimilar) {
      return c.json({ error: 'Semantic search not supported by current storage tier' }, 501);
    }

    let vector: number[];
    const vectorStr = c.req.query('vector');

    if (vectorStr) {
      vector = JSON.parse(vectorStr) as number[];
    } else {
      // Auto-generate vector from query text
      const service = getEmbeddingService();
      vector = await service.generateEmbedding(query);
    }

    const results = await storage.searchSimilar(type, vector, limit);
    
    // Enrich results with actual summaries
    const enriched = await Promise.all(results.map(async (r: any) => ({
      ...r,
      summary: type === 'summary' ? await getSummary(r.entityId) : null
    })));

    return c.json({ 
      query,
      results: enriched 
    });
  } catch (error) {
    systemLogger.error('[API] Semantic search error:', error as Error);
    return c.json({ error: 'Search failed', message: (error as Error).message }, 500);
  }
});

// Create summary
app.post('/api/summaries', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = CreateSummaryInputSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const summary = await createSummary(parsed.data);

    return c.json(
      {
        message: 'Summary created',
        summary,
      },
      201
    );
  } catch (error) {
    console.error('[API] Error creating summary:', error);
    return c.json(
      {
        error: 'Failed to create summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Generate PR Description
app.get('/api/summaries/:id/pr-description', async (c) => {
  const id = c.req.param('id');
  const summary = await getSummary(id);

  if (!summary) {
    return c.json({ error: 'Summary not found' }, 404);
  }

  const description = generatePRDescription(summary);
  return c.json({ 
    id: summary.id,
    title: summary.title,
    description 
  });
});

// Generate Changelog
app.get('/api/summaries/changelog', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const version = c.req.query('version');
  
  const summaries = await getRecentSummaries(limit);
  const changelog = generateChangelog(summaries, version);

  return c.json({ 
    version: version || 'Unreleased',
    count: summaries.length,
    changelog 
  });
});

// Get single summary
app.get('/api/summaries/:id', async (c) => {
  const id = c.req.param('id');
  const summary = await getSummary(id);

  if (!summary) {
    return c.json({ error: 'Summary not found' }, 404);
  }

  return c.json({ summary });
});

// Delete summary
app.delete('/api/summaries/:id', async (c) => {
  const id = c.req.param('id');
  const deleted = await deleteSummary(id);

  if (!deleted) {
    return c.json({ error: 'Summary not found' }, 404);
  }

  return c.json({ message: 'Summary deleted' });
});

// Get summaries for a task (nested route)
app.get('/api/tasks/:taskId/summaries', async (c) => {
  const taskId = c.req.param('taskId');
  const summaries = await getTaskSummaries(taskId);

  return c.json({
    taskId,
    summaries,
    count: summaries.length,
  });
});

// === Server Startup ===

const PORT = parseInt(process.env.PORT || settings.server?.port?.toString() || '3000');
const ENABLE_CRON = process.env.ENABLE_CRON !== undefined 
  ? process.env.ENABLE_CRON !== 'false' 
  : (settings.server?.enableCron !== undefined ? settings.server.enableCron : true);

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

  // Initialize storage (SQLite/libSQL)
  try {
    await initStorage();
    console.log('✅ Storage initialized');
  } catch (error) {
    console.error('❌ Failed to initialize storage:', error);
    console.log('⚠️  Running with in-memory storage only');
  }

  // Initialize default agents from config
  const registry = getAgentRegistry();

  interface AgentsYaml {
    agents: any[];
  }

  const agentsConfig = loadConfig<AgentsYaml>('agents.yml');

  if (agentsConfig.agents && Array.isArray(agentsConfig.agents)) {
    for (const agentDef of agentsConfig.agents) {
      try {
        // Filter out agent if required config is missing (from interpolated env vars)
        if (agentDef.type === 'openclaw' && !agentDef.config?.token) {
          console.log(`ℹ️  Skipping agent ${agentDef.id}: Missing OPENCLAW_GATEWAY_TOKEN`);
          continue;
        }

        if (agentDef.type === 'claude-code' && !agentDef.config?.workingDir) {
          console.log(`ℹ️  Skipping agent ${agentDef.id}: Missing CLAUDE_WORKING_DIR`);
          continue;
        }

        registry.createAdapter(agentDef);
        console.log(`✅ Agent ${agentDef.id} (${agentDef.type}) configured`);
      } catch (error) {
        console.error(`❌ Failed to configure agent ${agentDef.id}:`, error);
      }
    }
  }

  // Auto-discover agents if enabled (respects settings.yml and env var)
  const autoDiscover = process.env.AUTO_DISCOVER_AGENTS !== undefined
    ? process.env.AUTO_DISCOVER_AGENTS === 'true'
    : (settings.agents?.autoDiscover ?? false);

  if (autoDiscover && !registry.getActiveAdapters().some(a => a.type === 'claude-code')) {
    try {
      const { execSync } = await import('child_process');
      execSync('which claude', { stdio: 'ignore' });
      registry.createAdapter({
        id: 'claude-code-auto',
        type: 'claude-code',
        enabled: true,
        maxConcurrent: 1,
        priority: 5,
        config: {
          workingDir: process.env.CLAUDE_WORKING_DIR || process.cwd(),
        },
      });
      console.log('✅ Claude Code adapter auto-discovered (CLI found)');
    } catch {
      // CLI not found, ignore
    }
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
    const heartbeatMs = parseInt(process.env.POLL_INTERVAL_HEARTBEAT || '30000', 10);
    const issuesMs = parseInt(process.env.POLL_INTERVAL_ISSUES || '120000', 10);
    const staleMs = parseInt(process.env.POLL_INTERVAL_STALE || '60000', 10);
    console.log(`\nAutonomous Features (configurable via env):`);
    console.log(`  💓 Heartbeat: ${Math.round(heartbeatMs / 1000)}s (POLL_INTERVAL_HEARTBEAT)`);
    console.log(`  🔄 Issue Poller: ${Math.round(issuesMs / 1000)}s (POLL_INTERVAL_ISSUES)`);
    console.log(`  🕐 Stale Checker: ${Math.round(staleMs / 1000)}s (POLL_INTERVAL_STALE)`);
    console.log(`  📝 Log Level: ${process.env.LOG_LEVEL || 'INFO'} (LOG_LEVEL)`);
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
