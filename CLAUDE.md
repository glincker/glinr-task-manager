# GLINR Task Manager - Development Guidelines

> **For AI Agents:** Also read `AGENTS.md` for detailed workflow instructions.
> **Other AI Tools:** See `.cursorrules`, `.windsurfrules` for tool-specific rules.

---

## CRITICAL: Anti-Hallucination Rules

1. **NEVER invent APIs** - Only use functions that exist in codebase
2. **NEVER guess paths** - Verify files exist: `ls -la src/path/file.ts`
3. **NEVER assume deps** - Check package.json first
4. **NEVER make up types** - Use types from `src/types/`

**When uncertain: VERIFY, ASK, or DO LESS.**

---

## Project Overview

Task queue orchestrator for AI agents (OpenClaw, Claude Code, Jules). Routes tasks from GitHub/Jira/Linear to appropriate AI agents.

## Tech Stack

- **Runtime**: Node.js 22+ with ES modules
- **Language**: TypeScript 5.x (strict mode)
- **Framework**: Hono (lightweight, fast)
- **Queue**: BullMQ + Redis
- **Package Manager**: pnpm

## Quick Commands

```bash
pnpm install          # Install dependencies
pnpm build            # TypeScript compile
pnpm dev              # Development with watch
pnpm test             # Run tests
pnpm lint             # ESLint check
pnpm format           # Prettier format
```

## Architecture

```
src/
├── adapters/         # AI agent adapters (OpenClaw, Claude, etc.)
├── cron/             # Scheduled jobs (polling, heartbeat)
├── integrations/     # External services (GitHub, Jira, Linear)
├── queue/            # BullMQ task queue logic
├── types/            # TypeScript types/interfaces
└── server.ts         # Hono HTTP server
```

## Code Style

### TypeScript

- Use `type` for object shapes, `interface` for extendable contracts
- Prefer `const` assertions for literal types
- Always use explicit return types on exported functions
- Use `Record<string, T>` instead of `{ [key: string]: T }`

```typescript
// Good
export function processTask(task: Task): Promise<TaskResult> { }

// Bad
export function processTask(task) { }
```

### Imports

- Use `.js` extension for local imports (ES modules)
- Group imports: external → internal → types
- Use `import type` for type-only imports

```typescript
import { Queue, Worker } from 'bullmq';
import { getAgentRegistry } from '../adapters/registry.js';
import type { Task, TaskResult } from '../types/task.js';
```

### Error Handling

- Always catch and handle errors explicitly
- Use typed error responses
- Log errors with context

```typescript
try {
  const result = await adapter.executeTask(task);
} catch (error) {
  console.error(`[Task ${task.id}] Execution failed:`, error);
  return {
    success: false,
    error: {
      code: 'EXECUTION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
  };
}
```

## Performance Guidelines

1. **Avoid regex recompilation** - Define patterns at module scope
2. **Use async notifications** - Don't block task processing
3. **Cache computed values** - Hoist invariant calculations out of loops
4. **Skip unnecessary logging** - Exclude health checks from logs

## Testing

- Place tests next to source files: `foo.ts` → `foo.test.ts`
- Use descriptive test names
- Include benchmarks for performance-critical code

```typescript
describe('TaskQueue', () => {
  it('should process high-priority tasks first', async () => {
    // ...
  });
});
```

## Git Conventions

### Branches

- `main` - Production-ready code
- `feat/*` - New features
- `fix/*` - Bug fixes
- `perf/*` - Performance improvements

### Commits

Use conventional commits:

```
feat: Add Linear webhook integration
fix: Handle null task descriptions
perf: Cache registry adapter types
refactor: Extract notification queue
docs: Update API documentation
test: Add Jira webhook tests
```

### Pull Requests

- Keep PRs focused and atomic
- Include benchmarks for perf changes
- Reference issue numbers: `Closes #123`

## Agent-Specific Notes

### OpenClaw Adapter

- Uses REST API to gateway
- Builds autonomous prompts with workflow steps
- Extracts artifacts (commits, PRs, files) from responses

### Claude Code Adapter

- Spawns CLI subprocess
- Collects stdout/stderr as Buffers (not strings)
- Handles multi-byte characters across chunks

## Environment Variables

Required:
- `REDIS_URL` - Redis connection string
- `PORT` - HTTP server port (default: 3000)

Optional:
- `OPENCLAW_BASE_URL` - OpenClaw gateway URL
- `OPENCLAW_GATEWAY_TOKEN` - Gateway auth token
- `GITHUB_TOKEN` - GitHub API access
- `JIRA_WEBHOOK_SECRET` - Jira signature verification

## Don't

- Don't use `any` type
- Don't commit `.env` files
- Don't block the event loop
- Don't ignore TypeScript errors
- Don't skip tests for new features
