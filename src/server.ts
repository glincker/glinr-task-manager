import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handleGitHubWebhook } from './integrations/github.js';
import { initTaskQueue, addTask, getTask, getTasks, closeTaskQueue } from './queue/task-queue.js';
import { getAgentRegistry } from './adapters/registry.js';
import { CreateTaskSchema } from './types/task.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'glinr-task-manager',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (c) => {
  return c.json({
    name: 'GLINR Task Manager',
    version: '0.1.0',
    description: 'AI Agent Task Orchestration',
    docs: '/docs',
    endpoints: {
      health: 'GET /health',
      tasks: 'GET /api/tasks',
      createTask: 'POST /api/tasks',
      getTask: 'GET /api/tasks/:id',
      agents: 'GET /api/agents',
      webhooks: {
        github: 'POST /webhooks/github',
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

// Jira webhook (placeholder)
app.post('/webhooks/jira', async (c) => {
  // TODO: Implement Jira webhook handler
  return c.json({ message: 'Jira webhook not yet implemented' }, 501);
});

// Linear webhook (placeholder)
app.post('/webhooks/linear', async (c) => {
  // TODO: Implement Linear webhook handler
  return c.json({ message: 'Linear webhook not yet implemented' }, 501);
});

// === Server Startup ===

const PORT = parseInt(process.env.PORT || '3000');

async function main() {
  console.log('🚀 GLINR Task Manager starting...');

  // Initialize task queue
  try {
    await initTaskQueue();
    console.log('✅ Task queue initialized');
  } catch (error) {
    console.error('❌ Failed to initialize task queue:', error);
    console.log('⚠️  Running without Redis (tasks will not be processed)');
  }

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

  // Start server
  serve({
    fetch: app.fetch,
    port: PORT,
  });

  console.log(`\n🎉 GLINR Task Manager running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  📋 Tasks:    http://localhost:${PORT}/api/tasks`);
  console.log(`  🤖 Agents:   http://localhost:${PORT}/api/agents`);
  console.log(`  🔗 GitHub:   http://localhost:${PORT}/webhooks/github`);
  console.log(`  ❤️  Health:   http://localhost:${PORT}/health`);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down...');
  await closeTaskQueue();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down...');
  await closeTaskQueue();
  process.exit(0);
});

main().catch(console.error);
