# GLINR Task Manager

## Quick Reference

**Stack**: Node 22+ | TypeScript 5.x strict | Hono | BullMQ + Redis | pnpm

```bash
pnpm dev      # Development
pnpm build    # Compile (must pass)
pnpm test     # Tests (must pass)
pnpm lint     # Lint check
```

## Architecture

```
src/
├── adapters/      # AI agent adapters (OpenClaw, Claude)
├── chat/          # Chat execution engine
├── cron/          # Scheduled jobs
├── integrations/  # GitHub, Jira, Linear webhooks
├── queue/         # BullMQ task queue
├── providers/     # AI SDK providers
├── types/         # TypeScript types/interfaces
└── server.ts      # Hono HTTP server

ui/src/
├── features/      # Feature-based: tasks/, tickets/, chat/, settings/
├── components/    # Shared: ui/ (shadcn), shared/
└── core/          # Providers, hooks, utils
```

## Installed Dependencies (don't add new without approval)

```
hono, bullmq, ioredis, zod, vitest, ai (Vercel AI SDK)
```

**UI**: React 19, Vite, Tailwind v4, shadcn/ui, TanStack Query, Lucide icons

## Validation Workflow

```
RESEARCH → VALIDATE → IMPLEMENT → VERIFY
```

- **New APIs** → Use Context7: `"BullMQ delayed jobs use context7"`
- **New files** → Follow existing directory structure
- **New deps** → Justify and propose first
- **New types** → Check `src/types/` first

## Code Style

```typescript
// Imports: external → internal → types (always .js extension)
import { Queue } from 'bullmq';
import { processTask } from './queue/task-queue.js';
import type { Task, TaskResult } from './types/task.js';

// Explicit return types on exports
export function process(task: Task): Promise<TaskResult> { }

// Use Record<string, T> not { [key: string]: T }
// Use type for shapes, interface for extendable contracts
```

## Tool Usage (Token Efficient)

| Task | Use | Avoid |
|------|-----|-------|
| Find files | `Glob` | `find`, `ls -R` |
| Search content | `Grep` | `grep`, `rg` via bash |
| Read 1 file | `Read` | `cat` |
| Read 3+ files | `mcp__filesystem__read_multiple_files` | Multiple `Read` |
| Explore codebase | `Task` with Explore agent | Manual Glob+Grep chains |
| Live docs | Context7 | Guessing APIs |
| Find specific code | `Grep` with pattern first | Reading entire files |

**Exclude**: `node_modules/`, `build/`, `dist/`, `.git/`, `coverage/`

### Avoid Large File Reads

```
# BAD - reads entire files (~15k tokens wasted)
mcp__filesystem__read_multiple_files with 3+ large files

# GOOD - find what you need first
1. Grep for specific pattern → get file:line
2. Read only the relevant section with offset/limit
   Read file_path with offset=50, limit=30
```

**Before reading files, ask:**
- Can I find what I need with `Grep` first?
- Do I need the whole file or just a section?
- Can I use `Read` with `offset` and `limit` parameters?

## Error Handling Pattern

```typescript
try {
  const result = await operation();
} catch (error) {
  console.error(`[Context] Failed:`, error);
  return { success: false, error: { code: 'ERROR_CODE', message: error instanceof Error ? error.message : 'Unknown' } };
}
```

## File Boundaries

**CAN modify**: `src/**/*.ts`, `ui/src/**/*.{ts,tsx}`, tests, README
**CANNOT modify** (without approval): `package.json`, `tsconfig.json`, `.env*`, `*.lock`, `.github/`

## Git Commits

```
<type>: <description>

Co-Authored-By: Glinr <bot@glincker.com>
```

Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`

## Key Types (in src/types/)

```typescript
TaskStatus: 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
TaskPriority: 'critical' | 'high' | 'medium' | 'low'
TaskSource: 'github' | 'jira' | 'linear' | 'slack' | 'api' | 'cron'
AgentCapability: 'code_generation' | 'code_review' | 'bug_fix' | 'testing' | ...
```

## Smart Model & Mode Selection

### Model Selection (switch with `/model <name>`)

| Task Type | Model | Why |
|-----------|-------|-----|
| Simple questions, file renames, typos | `haiku` | 12x cheaper, fast |
| Standard coding, tests, refactoring | `sonnet` | Best balance |
| Architecture, complex multi-file, debugging hard bugs | `opus` | Superior reasoning |

### Mode Selection

| Situation | Mode | How |
|-----------|------|-----|
| Uncertain approach, complex changes | Plan Mode | `Shift+Tab` twice |
| Simple/clear task | Direct execution | Default |
| Research without changes | Plan Mode | Read-only tools |
| After plan approval | Exit plan | `Shift+Tab` once |

### Decision Flow

```
Is the task trivial (typo, rename, simple fix)?
  → YES: Use Haiku, direct execution
  → NO: Continue...

Is the approach clear and low-risk?
  → YES: Use Sonnet, direct execution
  → NO: Continue...

Does it need architecture/multi-file reasoning?
  → YES: Use Opus + Plan Mode first
  → After plan approved: Switch to Sonnet for execution
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | required | Redis connection |
| `PORT` | 3000 | HTTP server port |
| `POOL_MAX_CONCURRENT` | 50 | Max concurrent executions |
| `POOL_TIMEOUT_MS` | 300000 | Tool timeout (5 min) |

## Rules

- No `any` types
- No `.env` commits
- No blocking event loop (queue notifications async)
- No skipping tests for new features
- No hardcoded thresholds (use env vars)
- No inline styles in UI (Tailwind only)
- No new icon sets (Lucide only)

## Extended References (read on demand)

- `AGENTS.md` - Multi-agent workflow, adapter patterns, PR checklist
- `docs/UI_GUIDELINES.md` - Complete UI standards, component patterns
- `docs/ROADMAP.md` - Feature checklist with status
