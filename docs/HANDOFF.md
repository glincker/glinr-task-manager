# GLINR Task Manager - Agent Handoff Document

> **Last Updated:** 2026-02-01
> **For:** Antigravity and other AI agents

This document provides context for AI agents continuing work on this project to avoid overlap and ensure consistent progress.

---

## Current State Summary

### What's Built (Working)

| Component | Status | Location |
|-----------|--------|----------|
| Task Queue | ✅ Complete | `src/queue/task-queue.ts` |
| BullMQ + Redis | ✅ Complete | `src/queue/` |
| GitHub Webhooks | ✅ Complete | `src/integrations/github.ts` |
| Jira Webhooks | ✅ Complete | `src/integrations/jira.ts` |
| Linear Webhooks | ✅ Complete | `src/integrations/linear.ts` |
| OpenClaw Adapter | ✅ Complete | `src/adapters/openclaw.ts` |
| Claude Code Adapter | ✅ Complete | `src/adapters/claude-code.ts` |
| MCP Server | ✅ Complete | `src/mcp/server.ts` |
| Hook Endpoints | ✅ Complete | `src/hooks/` |
| Rules Engine | ✅ Complete | `src/intelligence/rules.ts` |

### What's In Progress

| Component | Progress | Owner | Next Steps |
|-----------|----------|-------|------------|
| Phase 5: MCP Integration | 75% | Claude | External webhooks, log parsing |
| Phase 6: Token Costs | ✅ 90% | Antigravity | Token tracking, cost calculation, basic budget alerts DONE |
| Phase 7: Summaries | 0% | Unassigned | Summary schema, extraction |
| Phase 8: GitHub OAuth | 0% | Unassigned | OAuth flow, PR linking |

---

## Recommended Next Tasks for Antigravity

Pick ONE of these based on your capabilities. Each is independent and won't conflict with other work.

### Option 1: Token Cost Tracking (Phase 6)
**Status:** ✅ Mostly Complete

Implemented token tracking and budget management:
1. `src/costs/pricing.ts` - Pricing config and calculation
2. `src/costs/token-tracker.ts` - Usage aggregation (listens to task completion events)
3. `src/costs/budget.ts` - Simple budget limits and alerts
4. API Endpoints:
   - `GET /api/costs/summary` - Usage stats by model and agent
   - `GET /api/costs/budget` - Current budget status and limits

**Next:** Add user-specific budgets and CSV export.

**Validation:**
```bash
pnpm build && pnpm test
```

### Option 2: Structured Summaries (Phase 7)
**Effort:** Medium | **Files:** New directory `src/summaries/`

Create structured AI work summaries:
1. Create `src/types/summary.ts` - Summary schema with Zod
2. Create `src/summaries/extractor.ts` - Extract summaries from agent output
3. Create `src/summaries/storage.ts` - Store and query summaries
4. Add `/api/summaries/*` endpoints to server.ts

**Validation:**
```bash
pnpm build && pnpm test
```

### Option 3: External Agent Webhooks (Phase 5.3)
**Effort:** Small | **Files:** `src/hooks/` and `src/server.ts`

Add webhook endpoints for external agents:
1. Create `/api/webhook/openclaw` endpoint
2. Create `/api/webhook/generic` for custom agents
3. Add HMAC signature verification
4. Extract artifacts from payload

**Validation:**
```bash
pnpm build && pnpm test
```

### Option 4: Local LLM Integration (Phase 5.6.2)
**Effort:** Medium | **Files:** New `src/intelligence/ollama.ts`

Add Ollama support for zero-cost local inference:
1. Create `src/intelligence/ollama.ts` - Ollama client
2. Detect if Ollama is running on localhost:11434
3. Use small model for summary generation
4. Create `src/intelligence/router.ts` - Route to Rules → Ollama → Gemini

**Validation:**
```bash
pnpm build && pnpm test
```

---

## Code Patterns to Follow

### Adding a New Endpoint

```typescript
// In src/server.ts
app.post('/api/your-endpoint', async (c) => {
  try {
    // Your logic here
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('[YourModule] Error:', error);
    return c.json(
      {
        error: 'Operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});
```

### Adding a New Module

```typescript
// src/yourmodule/index.ts
export { yourFunction } from './yourfile.js';

// src/yourmodule/yourfile.ts
export function yourFunction(): ReturnType {
  // Implementation
}

// src/yourmodule/yourfile.test.ts
import { describe, it, expect } from 'vitest';
import { yourFunction } from './yourfile.js';

describe('yourFunction', () => {
  it('should work', () => {
    expect(yourFunction()).toBeDefined();
  });
});
```

### Using Zod for Schemas

```typescript
import { z } from 'zod';

export const YourSchema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.number().default(0),
});

export type YourType = z.infer<typeof YourSchema>;
```

---

## Files NOT to Modify

These files are stable and should not be changed without explicit request:

- `package.json` - Dependencies locked
- `tsconfig.json` - TypeScript config set
- `.github/` - CI/CD workflows
- `src/queue/task-queue.ts` - Core queue logic (tested)
- `src/adapters/registry.ts` - Adapter management (tested)

---

## Environment Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build
pnpm build

# Required environment variables (optional for dev)
REDIS_URL=redis://localhost:6379
PORT=3000
```

---

## Testing Requirements

Before submitting any PR:

```bash
# Must pass:
pnpm build       # TypeScript compiles
pnpm test        # Tests pass (some pre-existing failures ok)

# Good to have:
pnpm lint        # ESLint (config needed)
```

---

## Communication Protocol

1. **Before starting:** Check this HANDOFF.md for current status
2. **While working:** Update ROADMAP.md with `[x]` for completed items
3. **After completing:** Update this HANDOFF.md with your changes
4. **Conflicts:** If you see overlap, document it and ask user

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | TypeScript compile |
| `pnpm test` | Run Vitest tests |
| `pnpm mcp:dev` | Run MCP server in dev mode |

| Port | Service |
|------|---------|
| 3000 | GLINR Task Manager API |
| 6379 | Redis (optional) |

| Directory | Purpose |
|-----------|---------|
| `src/adapters/` | AI agent adapters |
| `src/hooks/` | Claude Code hook handlers |
| `src/intelligence/` | Rules engine & inference |
| `src/integrations/` | Webhook handlers |
| `src/mcp/` | MCP server for Claude Code |
| `src/queue/` | BullMQ task queue |
| `src/types/` | TypeScript types |

---

## Contact

- **Repository:** GLINCKER/glinr-task-manager
- **Issues:** Create PR with `[Agent]` prefix in title
