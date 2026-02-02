# GLINR Task Manager - Agent Handoff Document

> **Last Updated:** 2026-02-01
> **For:** Antigravity and other AI agents

Quick context for AI agents to pick up work without overlap.

---

## Current State

### Completed

| Phase | Status | Key Files |
|-------|--------|-----------|
| Task Queue (BullMQ) | ✅ | `src/queue/` |
| GitHub/Jira/Linear Webhooks | ✅ | `src/integrations/` |
| OpenClaw + Claude Code Adapters | ✅ | `src/adapters/` |
| MCP Server (Claude Code) | ✅ | `src/mcp/server.ts` |
| Zero-Cost Hooks | ✅ | `src/hooks/` |
| Rules Engine | ✅ | `src/intelligence/rules.ts` |
| Token Cost Tracking | ✅ | `src/costs/` |
| Structured Summaries | ✅ | `src/summaries/` |
| **LibSQL Storage** | ✅ | `src/storage/` |

### In Progress

| Phase | Progress | Next Steps |
|-------|----------|------------|
| Phase 10: Storage | 40% | Vector search, cloud sync |
| Phase 8: GitHub OAuth | 0% | OAuth flow, PR linking |
| Phase 5: Intelligence | 30% | Ollama, Copilot proxy |

---

## Recommended Tasks for Antigravity

### Option 1: Vector Search (sqlite-vec) ⭐ HIGH
**Phase 10.3 | Effort: Medium**

Add semantic search for finding related tasks/summaries:

```typescript
// In src/storage/libsql.ts - add these methods:
storeEmbedding(id, entityType, entityId, embedding, model)
searchSimilar(entityType, embedding, limit)
```

Steps:
1. Install sqlite-vec extension
2. Update schema with vector column type
3. Add `/api/search/semantic` endpoint
4. Generate embeddings on summary creation (use Ollama or OpenAI)

**Test:** `pnpm build && pnpm test`

---

### Option 2: Ollama Integration ⭐ HIGH
**Phase 5.6.2 | Effort: Medium**

Zero-cost local inference for summaries:

```typescript
// src/intelligence/ollama.ts
export async function generateSummary(content: string): Promise<string>
export async function generateEmbedding(text: string): Promise<number[]>
```

Steps:
1. Create Ollama client with health check
2. Use `llama3.2:3b` for summaries
3. Use `nomic-embed-text` for embeddings
4. Add fallback to Gemini Flash if Ollama unavailable

**Test:** Start Ollama, then `pnpm test`

---

### Option 3: GitHub OAuth
**Phase 8 | Effort: Medium**

Enable GitHub login and PR linking:

```typescript
// src/auth/github.ts
export async function handleOAuthCallback(code: string): Promise<User>
export async function linkPRToTask(taskId: string, prUrl: string): Promise<void>
```

Steps:
1. Create GitHub OAuth flow (`/auth/github/login`, `/auth/github/callback`)
2. Store tokens securely
3. Auto-link PRs to tasks via branch/commit message parsing

**Test:** `pnpm build`

---

### Option 4: Cloud Sync (Turso)
**Phase 10.4 | Effort: Large**

Enable multi-device sync via Turso:

Steps:
1. Add Turso connection option in config
2. Update LibSQLAdapter to support sync URL
3. Implement conflict resolution
4. Add sync status endpoint

**Test:** Create Turso account, then `pnpm test`

---

### Option 5: Summary Templates
**Phase 7.4 | Effort: Small**

Auto-generate PR descriptions from summaries:

```typescript
// src/summaries/templates.ts
export function generatePRDescription(summary: Summary): string
export function generateChangelog(summaries: Summary[]): string
```

Steps:
1. Create template functions
2. Add `/api/summaries/:id/pr-description` endpoint
3. Add changelog generation

**Test:** `pnpm build && pnpm test`

---

## Quick Commands

```bash
pnpm dev          # Start server (auto-reload)
pnpm build        # TypeScript compile
pnpm test         # Run tests
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Apply migrations
pnpm db:studio    # Open Drizzle Studio (DB viewer)
```

## Key Directories

| Path | Purpose |
|------|---------|
| `src/storage/` | LibSQL adapter, Drizzle schema |
| `src/summaries/` | Summary extraction & storage |
| `src/intelligence/` | Rules engine (add Ollama here) |
| `src/auth/` | Auth flows (create for OAuth) |
| `config/` | YAML configurations |

## Do NOT Modify

- `package.json` - Dependencies stable
- `src/queue/task-queue.ts` - Core queue tested
- `src/storage/schema.ts` - DB schema in use

---

## Architecture Reference

```
User Request → Webhook → Task Queue → Agent Adapter → Result
                                           ↓
                             Storage ← Summary Extraction
                                           ↓
                                    Intelligence Layer
                                    (Rules → Ollama → Gemini)
```

**Storage Stack:**
- Local: LibSQL (SQLite fork)
- Schema: Drizzle ORM
- Migrations: drizzle-kit
- Future: sqlite-vec for vectors, Turso for cloud sync
