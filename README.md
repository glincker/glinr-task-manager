<p align="center">
  <h1 align="center">GLINR Task Manager</h1>
  <p align="center">
    AI-native task orchestration platform — manage tasks, tickets, and workflows through natural language conversations.
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0"></a>
  <a href="https://github.com/GLINCKER/glinr-task-manager/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/GLINCKER/glinr-task-manager/ci.yml?branch=main&label=CI" alt="CI"></a>
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white" alt="Node.js 22+">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <a href="https://github.com/GLINCKER/glinr-task-manager/pkgs/container/glinr-task-manager"><img src="https://img.shields.io/badge/Docker-ghcr.io-2496ED?logo=docker&logoColor=white" alt="Docker"></a>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

---

## Features

- **Agentic AI execution** — multi-step tool-calling loops with automatic retry and error recovery
- **30+ built-in tools** — file ops, git, web search, browser automation, project management
- **Real-time chat interface** — streaming responses with tool call visualization
- **Project and ticket management** — AI-assisted CRUD workflows with status tracking
- **Multi-provider AI support** — Anthropic Claude, OpenAI, Google Gemini, Groq, Ollama
- **BullMQ job queue** — priority scheduling, retry policies, dead letter queue, concurrency control
- **Webhook integrations** — GitHub, Jira, Linear issue-to-task automation
- **Messaging channels** — Discord, Telegram, WhatsApp bot connectors
- **Cron automation** — scheduled task execution with lifecycle management
- **React 19 dashboard** — modern glass-morphism UI with dark/light themes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GLINR Task Manager                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  React 19 + Vite UI ──► Hono HTTP API                      │
│                              │                              │
│              ┌───────────────┼───────────────┐              │
│              ▼               ▼               ▼              │
│       AI Providers     BullMQ Queue    LibSQL Storage       │
│     (Claude, GPT,      (Redis)        (SQLite)             │
│      Gemini, Ollama)        │                              │
│              │               ▼                              │
│              ▼          Integrations                        │
│        Tool System      (GitHub, Jira, Linear,             │
│        (30+ tools)       Discord, Telegram)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js** 22+ (with corepack enabled)
- **pnpm** (via corepack: `corepack enable`)
- **Redis** (for job queue)

### Setup

```bash
# Clone
git clone https://github.com/GLINCKER/glinr-task-manager.git
cd glinr-task-manager

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env — set REDIS_URL and at least one AI provider key

# Start Redis (if not already running)
docker run -d --name redis -p 6379:6379 redis:alpine

# Start development server
pnpm dev
```

The server starts at `http://localhost:3000`. The UI is served from the same port.

### Docker

```bash
# Using Docker Compose
docker compose up -d

# Or pull the image directly
docker pull ghcr.io/glincker/glinr-task-manager:latest
docker run -p 3000:3000 --env-file .env ghcr.io/glincker/glinr-task-manager:latest
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `REDIS_URL` | required | Redis connection string |
| `ANTHROPIC_API_KEY` | — | Anthropic Claude API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | — | Google Gemini API key |
| `GROQ_API_KEY` | — | Groq API key |
| `GITHUB_TOKEN` | — | GitHub PAT for integrations |
| `TASK_CONCURRENCY` | `2` | Concurrent task processing |
| `POOL_MAX_CONCURRENT` | `50` | Max concurrent tool executions |
| `ENABLE_CRON` | `true` | Enable scheduled jobs |

See [`.env.example`](.env.example) for all available options.

## Development

```bash
pnpm dev       # Start dev server with hot reload
pnpm build     # Compile TypeScript (must pass)
pnpm test      # Run test suite (Vitest)
pnpm lint      # Lint check
```

## Project Structure

```
src/
├── adapters/       # AI agent adapters (Claude, OpenClaw, Ollama)
├── agents/         # Agentic executor and stop conditions
├── auth/           # Authentication service
├── chat/           # Chat engine, tool handler, system prompts
├── cron/           # Scheduled job definitions
├── integrations/   # GitHub, Jira, Linear webhook handlers
├── notifications/  # Slack, Discord, Telegram, WhatsApp
├── projects/       # Project management
├── providers/      # AI SDK provider configuration
├── queue/          # BullMQ job queue and failure handling
├── routes/         # Hono HTTP route handlers
├── storage/        # LibSQL persistence layer
├── tickets/        # Ticket CRUD and workflows
├── tools/          # 30+ built-in tool definitions
├── types/          # TypeScript type definitions
└── server.ts       # Hono HTTP entry point

ui/src/
├── features/       # Feature modules (chat, tasks, tickets, settings)
├── components/     # Shared UI components (shadcn/ui based)
├── core/           # Providers, hooks, utilities
└── layouts/        # App shell and navigation
```

## Tech Stack

**Backend**: [Hono](https://hono.dev) | [BullMQ](https://bullmq.io) | [LibSQL](https://libsql.org) | [Zod](https://zod.dev)

**Frontend**: [React 19](https://react.dev) | [Vite](https://vite.dev) | [Tailwind CSS v4](https://tailwindcss.com) | [shadcn/ui](https://ui.shadcn.com) | [TanStack Query](https://tanstack.com/query)

**AI**: [Vercel AI SDK](https://sdk.vercel.ai) | Anthropic Claude | OpenAI | Google Gemini | Groq | Ollama

**Queue**: [Redis](https://redis.io) + [BullMQ](https://bullmq.io) (priority queue, retry, DLQ)

**Integrations**: GitHub | Jira | Linear | Discord | Telegram | WhatsApp

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes and ensure `pnpm build && pnpm test` passes
4. Submit a pull request

For bugs and feature requests, please [open an issue](https://github.com/GLINCKER/glinr-task-manager/issues).

## License

This project is licensed under the **GNU Affero General Public License v3.0** — see the [LICENSE](LICENSE) file for details.

Copyright (C) 2024-2026 GLINCKER LLC. All rights reserved.

---

<p align="center">Built with care by <a href="https://www.glincker.com">GLINCKER LLC</a></p>
