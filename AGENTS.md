# AI Agent Guidelines

Instructions for AI agents (Jules, OpenClaw, GitHub Copilot, Claude Code) working on this codebase.

## Before You Start

1. **Read CLAUDE.md** for project conventions
2. **Run the build** to ensure it passes: `pnpm build`
3. **Check existing patterns** before creating new ones

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
