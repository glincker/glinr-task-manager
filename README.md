# GLINR Task Manager

> **AI Agent Task Orchestration** - Queue, route, and track tasks across OpenClaw, Claude Code, and other AI agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

GLINR Task Manager is an open-source task queue and orchestration system for AI coding agents. It bridges issue trackers (GitHub, Jira, Linear) with AI agents (OpenClaw, Claude Code) to automate development workflows.

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLINR Task Manager                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ GitHub Issues│    │    Jira      │    │   Linear     │       │
│  │   Webhook    │    │   Webhook    │    │   Webhook    │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             ▼                                    │
│                    ┌────────────────┐                            │
│                    │  Task Queue    │  Redis/BullMQ              │
│                    └───────┬────────┘                            │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                  │
│         ▼                  ▼                  ▼                  │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐             │
│  │  OpenClaw  │    │Claude Code │    │  Custom    │             │
│  └────────────┘    └────────────┘    └────────────┘             │
│                            │                                     │
│                    ┌───────▼───────┐                             │
│                    │ Post Results  │ → GitHub Comments           │
│                    └───────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Multi-Agent Support** - Works with OpenClaw, Claude Code, and custom adapters
- **Priority Queue** - Tasks processed by priority with retry support
- **GitHub Integration** - Create tasks from issues, post results as comments
- **Extensible** - Add new agents and integrations easily
- **Audit Trail** - Track what AI did, when, and results

## Quick Start

### Prerequisites

- Node.js 20+
- Redis (for task queue)
- An AI agent (OpenClaw or Claude Code)

### Installation

```bash
# Clone the repo
git clone https://github.com/GLINCKER/glinr-task-manager.git
cd glinr-task-manager

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Start Redis (if not running)
docker run -d --name redis -p 6379:6379 redis:alpine

# Start the server
pnpm dev
```

### Environment Variables

```bash
# Server
PORT=3000
CORS_ORIGIN=*

# Redis
REDIS_URL=redis://localhost:6379

# OpenClaw (if using)
OPENCLAW_BASE_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your-token
OPENCLAW_WORKING_DIR=~/openclaw-workdir

# GitHub
GITHUB_TOKEN=ghp_xxx
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_AI_TASK_LABEL=ai-task
GITHUB_AI_REVIEW_LABEL=ai-review

# Task Processing
TASK_CONCURRENCY=2
```

## Usage

### Creating Tasks via API

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "prompt": "The login button doesn'\''t work on mobile. Please investigate and fix.",
    "source": "api",
    "repository": "GLINCKER/my-app",
    "priority": 2,
    "labels": ["bug", "mobile"]
  }'
```

### Creating Tasks from GitHub

1. Set up a GitHub webhook pointing to `/webhooks/github`
2. Add the `ai-task` label to an issue
3. The task manager will:
   - Create a task from the issue
   - Queue it for processing
   - Assign an AI agent
   - Post results back as a comment

### Trigger via Comment

Comment `/ai fix this bug` on any issue to trigger a task:

```
/ai Please implement the feature described in this issue
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/tasks` | GET | List tasks |
| `/api/tasks` | POST | Create task |
| `/api/tasks/:id` | GET | Get task details |
| `/api/agents` | GET | List available agents |
| `/webhooks/github` | POST | GitHub webhook receiver |
| `/webhooks/jira` | POST | Jira webhook (coming soon) |
| `/webhooks/linear` | POST | Linear webhook (coming soon) |

## Adding Custom Agents

Create a new adapter by implementing the `AgentAdapter` interface:

```typescript
import type { AgentAdapter, AgentConfig } from './types/agent';

export class MyCustomAdapter implements AgentAdapter {
  readonly type = 'my-agent';
  readonly name = 'My Custom Agent';
  readonly capabilities = ['code_generation', 'bug_fix'];

  async healthCheck() {
    return { healthy: true, lastChecked: new Date() };
  }

  async executeTask(task) {
    // Your implementation
    return { success: true, output: 'Done!' };
  }
}
```

Register it in the registry:

```typescript
import { getAgentRegistry } from './adapters/registry';

const registry = getAgentRegistry();
registry.registerAdapter('my-agent', (config) => new MyCustomAdapter(config));
```

## Docker Compose

```bash
docker-compose up -d
```

See [docker-compose.yml](./docker-compose.yml) for the full configuration.

## Roadmap

- [x] Core task queue with BullMQ
- [x] OpenClaw adapter
- [x] Claude Code adapter
- [x] GitHub webhook integration
- [ ] Jira integration
- [ ] Linear integration
- [ ] Web dashboard
- [ ] Cost tracking (token usage)
- [ ] Multi-tenant support
- [ ] Slack notifications

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Built by [GLINCKER](https://www.glincker.com/) for the GLINR Platform.

---

**Related Projects:**
- [OpenClaw](https://github.com/openclaw/openclaw) - Open-source AI agent
- [Claude Code](https://claude.ai/claude-code) - Anthropic's CLI coding assistant
- [BullMQ](https://github.com/taskforcesh/bullmq) - Redis-based queue
