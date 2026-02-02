# AI Agent Guidelines

Instructions for AI agents (Jules, OpenClaw, GitHub Copilot, Claude Code, Antigravity) working on this codebase.

---

## BEFORE YOU START

1. **Read `docs/HANDOFF.md`** - Current project status and recommended tasks
2. **Check `docs/ROADMAP.md`** - Full feature checklist with completion status
3. **Pick an unassigned task** - Don't duplicate work another agent is doing

### Current Agent Assignments (2026-02-01)

| Agent | Current Task | Status |
|-------|--------------|--------|
| Claude Code | Phase 5: MCP Integration | 75% complete |
| Antigravity | Unassigned | Pick from HANDOFF.md |

---

## CRITICAL RULES - READ FIRST

### VALIDATE, DON'T HALLUCINATE

You CAN create new code, patterns, and solutions. But VALIDATE your approach first:

1. **New APIs/Functions** → Search docs or use Context7 to verify the approach
2. **New file paths** → Check existing structure, follow conventions
3. **New dependencies** → Research if needed, propose in PR description
4. **New types** → Check `src/types/` first, create if genuinely needed

### VALIDATION WORKFLOW

```
┌─────────────────────────────────────────────────────────┐
│  1. UNDERSTAND → Read existing code patterns            │
│  2. RESEARCH   → Search docs, Context7, best practices  │
│  3. VALIDATE   → Does this align with project style?    │
│  4. IMPLEMENT  → Write the code                         │
│  5. VERIFY     → Build passes, tests pass               │
└─────────────────────────────────────────────────────────┘
```

### USE CONTEXT7 FOR VALIDATION

When using external libraries, validate with Context7:

```
"BullMQ job progress tracking use context7"
"Hono middleware error handling use context7"
"Zod schema validation patterns use context7"
```

### SEMANTIC THINKING

Before implementing, think through:
- What existing patterns solve similar problems?
- What would a senior engineer do here?
- Is there a simpler approach?

### WHEN UNCERTAIN

- **RESEARCH** - Search online for best practices
- **STATE ASSUMPTIONS** - Document your reasoning in PR
- **PROCEED WITH CONFIDENCE** - Don't block, validate and continue

---

## Before You Start

1. **Read CLAUDE.md** for project conventions
2. **Run the build** to ensure it passes: `pnpm build`
3. **Check existing patterns** before creating new ones
4. **Search the codebase** before creating new utilities

## Workflow

### 1. Setup

```bash
git fetch origin
git checkout main && git pull origin main
git checkout -b <type>/<description>
```

Branch naming:
- `feat/add-linear-integration`
- `fix/null-task-description`
- `perf/optimize-queue-processing`

### 2. Implementation

- Make focused, atomic changes
- Follow existing code patterns
- Add tests for new functionality
- Include benchmarks for performance changes

### 3. Verification

```bash
pnpm install
pnpm build      # Must pass
pnpm test       # Must pass
pnpm lint       # Must pass
```

**DO NOT commit if any of these fail.**

### 4. Commit

Use conventional commit format:

```bash
git add -A
git commit -m "<type>: <description>

<optional body>

Closes #<issue-number>

Co-Authored-By: <your-name>"
```

Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`

### 5. Push & PR

```bash
git push -u origin HEAD
gh pr create --title "<type>: <description>" --body "## Summary
<bullet points>

## Test plan
<how to verify>

Closes #<issue>"
```

## Code Patterns

### Adding a New Adapter

```typescript
// src/adapters/my-agent.ts
import type { AgentAdapter, AgentConfig, AgentHealth } from '../types/agent.js';
import type { Task, TaskResult } from '../types/task.js';

export class MyAgentAdapter implements AgentAdapter {
  readonly type = 'my-agent';
  readonly name = 'My Agent';
  readonly description = 'Description of capabilities';
  readonly capabilities: AgentCapability[] = ['code_generation', 'testing'];

  constructor(config: AgentConfig) {
    // Initialize from config
  }

  async healthCheck(): Promise<AgentHealth> {
    // Check if agent is available
  }

  async executeTask(task: Task): Promise<TaskResult> {
    // Execute the task
  }
}

export function createMyAgentAdapter(config: AgentConfig): AgentAdapter {
  return new MyAgentAdapter(config);
}
```

### Adding a New Integration

```typescript
// src/integrations/my-service.ts
import type { Context } from 'hono';
import type { CreateTaskInput } from '../types/task.js';

export async function handleMyServiceWebhook(c: Context): Promise<CreateTaskInput | null> {
  // 1. Verify signature/auth
  // 2. Parse payload
  // 3. Map to CreateTaskInput
  // 4. Return task or null
}
```

### Performance Optimization Pattern

```typescript
// BAD: Regex compiled on every call
function extractData(text: string) {
  const pattern = /some-pattern/g;  // Recompiled each call
  return text.match(pattern);
}

// GOOD: Regex at module scope
const DATA_PATTERN = /some-pattern/g;

function extractData(text: string) {
  DATA_PATTERN.lastIndex = 0;  // Reset for global regex
  return text.match(DATA_PATTERN);
}
```

## Testing Patterns

### Unit Test

```typescript
// src/my-module.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from './my-module.js';

describe('myFunction', () => {
  it('should handle normal input', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Benchmark Test

```typescript
// src/my-module.bench.test.ts
import { describe, it, expect } from 'vitest';

describe('myFunction performance', () => {
  it('should complete 10000 iterations in under 100ms', () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      myFunction('input');
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

## Common Mistakes

### 1. Missing `.js` Extension

```typescript
// BAD
import { foo } from './foo';

// GOOD
import { foo } from './foo.js';
```

### 2. Not Using Type Imports

```typescript
// BAD
import { Task, TaskResult } from '../types/task.js';

// GOOD
import type { Task, TaskResult } from '../types/task.js';
```

### 3. Blocking Operations

```typescript
// BAD: Blocks task processing
await notifySlack(result);
await sendEmail(result);

// GOOD: Queue notifications async
notificationQueue.add('notify', { taskId, result });
```

### 4. Ignoring Error Types

```typescript
// BAD
} catch (error) {
  console.log(error);
}

// GOOD
} catch (error) {
  console.error(`[Context] Operation failed:`, error);
  return {
    success: false,
    error: {
      code: 'OPERATION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
  };
}
```

## PR Review Checklist

Before marking PR ready:

- [ ] Build passes (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] No `any` types added
- [ ] Error handling is explicit
- [ ] Performance-sensitive code has benchmarks
- [ ] Commit message follows convention
- [ ] PR description explains the change

## Questions?

If blocked or unclear on requirements:
1. Check existing similar code
2. Review recent merged PRs
3. Ask for clarification in the issue/PR

**Never guess. Ask or state assumptions clearly.**

---

## STRICT BOUNDARIES

### Files You CAN Modify

- `src/**/*.ts` - Source code
- `src/**/*.test.ts` - Tests
- `README.md` - Documentation (if asked)

### Files You CANNOT Modify (without explicit permission)

- `package.json` - Dependencies (ask first)
- `tsconfig.json` - TypeScript config
- `.env*` - Environment files
- `*.lock` - Lock files
- `.github/**` - CI/CD workflows

### Dependencies You CAN Use

Only use what's already in `package.json`:

```json
{
  "hono": "HTTP framework",
  "bullmq": "Queue management",
  "ioredis": "Redis client",
  "zod": "Schema validation",
  "vitest": "Testing"
}
```

**DO NOT** add new dependencies without explicit approval.

---

## VALIDATION CHECKLIST

Before submitting any code:

- [ ] Researched approach (docs, Context7, existing code)
- [ ] Follows existing project patterns
- [ ] New dependencies justified in PR description
- [ ] Build passes: `pnpm build`
- [ ] Tests pass: `pnpm test`
- [ ] PR explains reasoning for new patterns

### Validation Examples

```typescript
// CREATING NEW UTILITY
// ✓ Checked src/utils/ - no similar utility exists
// ✓ Researched best practice via Context7
// ✓ Follows existing code style
export function formatTaskOutput(result: TaskResult): string { }

// USING EXTERNAL LIBRARY METHOD
// ✓ Verified via "BullMQ job.moveToDelayed use context7"
// ✓ Checked BullMQ docs for correct signature
await job.moveToDelayed(Date.now() + 5000);

// ADDING NEW TYPE
// ✓ Checked src/types/ - no existing type fits
// ✓ Follows naming convention (PascalCase, descriptive)
interface WebhookPayload {
  event: string;
  data: unknown;
}
```

### Research Resources

| Need | Use |
|------|-----|
| Library APIs | `"<library> <method> use context7"` |
| Best practices | Search online, check popular repos |
| TypeScript patterns | TypeScript handbook, existing code |
| Project conventions | Read CLAUDE.md, existing files |

---

## EXISTING PATTERNS TO FOLLOW

### Task Creation Pattern

```typescript
// CORRECT - follows existing pattern in src/queue/task-queue.ts
const task: Task = {
  id: randomUUID(),
  title: input.title,
  description: input.description,
  status: 'pending',
  priority: input.priority || 'medium',
  source: input.source,
  // ... other required fields from CreateTaskInput
};
```

### Adapter Pattern

```typescript
// CORRECT - follows existing pattern in src/adapters/
export class MyAdapter implements AgentAdapter {
  readonly type = 'my-adapter';
  readonly name = 'My Adapter';
  readonly capabilities: AgentCapability[] = [];  // Use existing capabilities only

  async healthCheck(): Promise<AgentHealth> { }
  async executeTask(task: Task): Promise<TaskResult> { }
}
```

### Webhook Handler Pattern

```typescript
// CORRECT - follows existing pattern in src/integrations/
export async function handleMyWebhook(c: Context): Promise<CreateTaskInput | null> {
  // 1. Verify signature (if applicable)
  // 2. Parse body
  // 3. Validate required fields
  // 4. Map to CreateTaskInput
  // 5. Return null if not actionable
}
```

---

## REAL EXAMPLES FROM THIS CODEBASE

### Correct Import Pattern

```typescript
// These imports are REAL and verified:
import { Queue, Worker, Job } from 'bullmq';
import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import type { Task, TaskResult, CreateTaskInput } from '../types/task.js';
import type { AgentAdapter, AgentConfig } from '../types/agent.js';
```

### Correct Type Usage

```typescript
// These types EXIST in src/types/task.ts:
type TaskStatus = 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
type TaskSource = 'github' | 'jira' | 'linear' | 'slack' | 'api' | 'cron';

// These capabilities EXIST in src/types/agent.ts:
type AgentCapability = 'code_generation' | 'code_review' | 'bug_fix' | 'testing' | ...;
```

---

## FINAL REMINDER

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   YOU CAN CREATE NEW THINGS.                            │
│   JUST VALIDATE YOUR APPROACH FIRST.                    │
│                                                         │
│   Research → Validate → Implement → Verify              │
│                                                         │
│   Use Context7 for library docs:                        │
│   "<library> <feature> use context7"                    │
│                                                         │
│   Search online for best practices.                     │
│   Check existing code for patterns.                     │
│   Think like a senior engineer.                         │
│                                                         │
│   CONFIDENT, VALIDATED CODE > HESITANT CODE             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
