# AI Agent Guidelines

Instructions for AI agents (Jules, OpenClaw, GitHub Copilot, Claude Code) working on this codebase.

---

## CRITICAL RULES - READ FIRST

### DO NOT HALLUCINATE

1. **Never invent APIs** - Only use functions/methods that exist in the codebase or documented libraries
2. **Never guess file paths** - Always verify files exist before modifying
3. **Never assume dependencies** - Check `package.json` before using any library
4. **Never create fictional types** - Only use types defined in `src/types/`

### VERIFY BEFORE ACTING

```bash
# Before modifying a file, verify it exists
ls -la src/path/to/file.ts

# Before using a dependency, verify it's installed
grep "dependency-name" package.json

# Before calling a function, verify it exists
grep -r "functionName" src/
```

### WHEN UNCERTAIN

- **ASK** - Leave a comment in the PR asking for clarification
- **STATE ASSUMPTIONS** - Document any assumptions you made
- **DO LESS** - It's better to do less correctly than more incorrectly

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

## ANTI-HALLUCINATION CHECKLIST

Before submitting any code:

- [ ] Every import path exists (verified with `ls`)
- [ ] Every function called exists (verified with `grep`)
- [ ] Every type used is defined in codebase
- [ ] No made-up API endpoints
- [ ] No fictional library methods
- [ ] Build passes: `pnpm build`
- [ ] Tests pass: `pnpm test`

### Red Flags (STOP and verify)

If you're about to write any of these, STOP and verify first:

```typescript
// RED FLAG: Importing from a path you haven't verified
import { something } from '../utils/helper.js';  // Does this file exist?

// RED FLAG: Using a method you haven't seen in the codebase
queue.processAll();  // Is this a real BullMQ method?

// RED FLAG: Creating a new type without checking existing ones
interface MyNewType { }  // Is there already a similar type?

// RED FLAG: Calling an external API
await fetch('https://api.example.com/...');  // Is this documented?
```

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
│   IF YOU'RE NOT 100% SURE SOMETHING EXISTS,             │
│   VERIFY IT BEFORE USING IT.                            │
│                                                         │
│   grep -r "functionName" src/                           │
│   ls -la src/path/to/file.ts                            │
│   cat package.json | grep "dependency"                  │
│                                                         │
│   WRONG CODE IS WORSE THAN NO CODE.                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
