# OpenClaw vs GLINR Feature Comparison

> Research document for building solid memory, tools, and session management features.
> Last updated: February 2026

---

## Executive Summary

| Category | OpenClaw | GLINR | Winner |
|----------|----------|-------|--------|
| **Total Core Tools** | 15 | **38** | **GLINR** |
| **Memory System** | ✅ Full semantic search | ✅ Hybrid search (vector + FTS5) | **Tie** |
| **Session Management** | ✅ Multi-session, cross-session | ✅ sessions_list + session_status | **Tie** |
| **Web Tools** | web_fetch, web_search | web_fetch, web_search (multi-provider) | **Tie** |
| **Git Operations** | ❌ None | ✅ 7 tools | **GLINR** |
| **File Operations** | ❌ None built-in | ✅ 4 tools | **GLINR** |
| **Project Management** | ❌ None | ✅ Tickets, Projects, Sprints | **GLINR** |
| **Task Queue** | ❌ None | ✅ BullMQ + Redis | **GLINR** |
| **Cron/Scheduling** | ✅ croner | ✅ BullMQ + 6 cron tools | **GLINR** |
| **Messaging Channels** | ✅ 8+ (Discord, Slack, Matrix, etc.) | ⚠️ Slack OAuth only | OpenClaw |
| **Browser Automation** | ✅ Playwright | ❌ None | OpenClaw |
| **CLI Chat** | ✅ Full REPL + RPC | ✅ REPL + single-shot + agentic | **Tie** |

### Priority Gap Analysis

| Priority | Feature | Status | Effort |
|----------|---------|--------|--------|
| ✅ Done | Memory Search (`memory_search`, `memory_get`) | **Implemented** | - |
| ✅ Done | Session List (`sessions_list`) | **Implemented** | - |
| ✅ Done | Memory Stats (`memory_stats`) | **Implemented** | - |
| ✅ Done | CLI Chat Command (`glinr chat`) | **Implemented** (REPL + single-shot + agentic) | - |
| ✅ Done | Cron/Scheduling (6 tools + API) | **Implemented** (BullMQ backend + REST API) | - |
| ✅ Done | Agents List (`agents_list`) | **Implemented** (discover available agents) | - |
| 🟡 High | Memory UI (browser, search) | Missing | Medium |
| 🟢 Low | Browser Automation | Optional | High |
| 🟢 Low | TTS/Image Tools | Optional | Medium |

---

## Quick Reference Paths

### OpenClaw Reference Files
| Feature | Path |
|---------|------|
| Memory Tool | `openclaw-reference/src/agents/tools/memory-tool.ts` |
| Memory Schema | `openclaw-reference/src/memory/memory-schema.ts` |
| Memory Search Config | `openclaw-reference/src/agents/memory-search.ts` |
| Browser Tool | `openclaw-reference/src/agents/tools/browser-tool.ts` |
| Cron Tool | `openclaw-reference/src/agents/tools/cron-tool.ts` |
| Sessions List Tool | `openclaw-reference/src/agents/tools/sessions-list-tool.ts` |
| Session Tool Result Guard | `openclaw-reference/src/agents/session-tool-result-guard.ts` |
| Gateway Tool | `openclaw-reference/src/agents/tools/gateway.ts` |
| Web Fetch | `openclaw-reference/src/agents/tools/web-fetch.ts` |
| Web Search | `openclaw-reference/src/agents/tools/web-search.ts` |
| Image Tool | `openclaw-reference/src/agents/tools/image-tool.ts` |

### GLINR Implementation Files
| Feature | Path |
|---------|------|
| Conversations | `src/chat/conversations.ts` |
| Memory (Compaction) | `src/chat/memory.ts` |
| Memory Service | `src/memory/memory-service.ts` |
| Memory Tools | `src/chat/execution/tools/memory-tools.ts` |
| Tool Handler | `src/chat/tool-handler.ts` |
| Tool Registry | `src/chat/execution/registry.ts` |
| Session Manager | `src/chat/execution/session-manager.ts` |
| Sessions List Tool | `src/chat/execution/tools/sessions-list.ts` |
| Cron Scheduler | `src/cron/scheduler.ts` |
| Cron Tools | `src/chat/execution/tools/cron-tool.ts` |
| Cron API Routes | `src/routes/cron.ts` |
| Agents List Tool | `src/chat/execution/tools/agents-list.ts` |
| Embedding Service | `src/ai/embedding-service.ts` |
| Storage Schema | `src/storage/schema.ts` |

---

## Tools Comparison

### OpenClaw Core Tools (15 found in src/agents/tools/)

| Tool Name | Category | Description | GLINR Status |
|-----------|----------|-------------|--------------|
| `memory_search` | Memory | Semantic search on MEMORY.md + memory/*.md | ✅ **HAVE** (hybrid search) |
| `memory_get` | Memory | Read specific lines from memory files | ✅ **HAVE** |
| `browser` | Browser | Full browser control (Playwright) | ❌ Optional |
| `cron` | Scheduling | Create/manage scheduled jobs | ✅ **HAVE** (6 tools + API) |
| `sessions_list` | Sessions | List active chat sessions | ✅ **HAVE** |
| `sessions_send` | Sessions | Send message to another session | ❌ Nice to have |
| `sessions_spawn` | Sessions | Spawn new agent session | ❌ Nice to have |
| `sessions_history` | Sessions | Get session history | ⚠️ Partial |
| `session_status` | Sessions | Get current session status | ✅ **HAVE** |
| `gateway` | Gateway | Gateway API calls | ❌ N/A |
| `web_fetch` | Web | Fetch web content | ✅ **HAVE** |
| `web_search` | Web | Search the web | ✅ **HAVE** (multi-provider) |
| `image` | Media | Image generation/manipulation | ❌ Nice to have |
| `canvas` | Canvas | Visual canvas manipulation | ❌ N/A |
| `tts` | Audio | Text-to-speech | ❌ Nice to have |
| `agents_list` | Agents | List available agents | ✅ **HAVE** |
| `message` | Messaging | Send messages to channels | ❌ N/A |
| `nodes` | Nodes | Manage connected nodes | ❌ N/A |

### OpenClaw Extensions (Messaging Channels)

| Extension | Channels | GLINR Status |
|-----------|----------|--------------|
| Discord | discord_* | ❌ N/A (different focus) |
| Slack | slack_* | ⚠️ Partial (OAuth only) |
| Matrix | matrix_* | ❌ N/A |
| Telegram | telegram_* | ❌ N/A |
| iMessage | imessage_* | ❌ N/A |
| BlueBubbles | bluebubbles_* | ❌ N/A |
| Google Chat | googlechat_* | ❌ N/A |
| LINE | line_* | ❌ N/A |

### GLINR-Exclusive Tools (No OpenClaw equivalent)

| Tool Name | Category | Description |
|-----------|----------|-------------|
| `create_ticket` | GLINR | Create tickets in the system |
| `get_ticket` | GLINR | Get ticket details |
| `list_tickets` | GLINR | List/filter tickets |
| `update_ticket` | GLINR | Update ticket status/fields |
| `create_project` | GLINR | Create projects |
| `list_projects` | GLINR | List projects |
| `complete_task` | Agent | Mark agent task as complete |
| `git_*` (7 tools) | Git | Full Git operations suite |
| `system_info` | System | System information |
| `process_list` | System | Process management |
| `cron_*` (6 tools) | Cron | **NEW** Full scheduled job management |

### GLINR Current Tools (38 built-in)

| Tool Name | Category | Path | Description |
|-----------|----------|------|-------------|
| `exec` | Execution | `tools/exec.ts` | Execute shell commands with PTY support |
| `read_file` | File | `tools/file-ops.ts` | Read file contents |
| `write_file` | File | `tools/file-ops.ts` | Write/create files |
| `search_files` | File | `tools/file-ops.ts` | Glob-based file search |
| `grep` | File | `tools/file-ops.ts` | Content search with regex |
| `git_status` | Git | `tools/git.ts` | Show working tree status |
| `git_diff` | Git | `tools/git.ts` | Show changes between commits |
| `git_log` | Git | `tools/git.ts` | Show commit history |
| `git_commit` | Git | `tools/git.ts` | Create commits |
| `git_branch` | Git | `tools/git.ts` | Branch operations |
| `git_stash` | Git | `tools/git.ts` | Stash changes |
| `git_remote` | Git | `tools/git.ts` | Remote operations |
| `system_info` | System | `tools/system.ts` | OS/platform info |
| `env_vars` | System | `tools/system.ts` | Environment variables |
| `process_list` | System | `tools/system.ts` | Running processes |
| `path_info` | System | `tools/system.ts` | Path utilities |
| `which` | System | `tools/system.ts` | Find executable path |
| `web_fetch` | Web | `tools/web-fetch.ts` | Fetch URL content |
| `web_search` | Web | `tools/web-search.ts` | Multi-provider search (Brave/Serper/SearXNG/Tavily) |
| `session_status` | Session | `tools/session-status.ts` | Current session info |
| `sessions_list` | Session | `tools/sessions-list.ts` | List active chat sessions |
| `agents_list` | Agent | `tools/agents-list.ts` | ✅ **NEW** List available AI agents |
| `memory_search` | Memory | `tools/memory-tools.ts` | Hybrid semantic search (vector + FTS5) |
| `memory_get` | Memory | `tools/memory-tools.ts` | Read specific lines from memory |
| `memory_stats` | Memory | `tools/memory-tools.ts` | Memory system statistics |
| `cron_create` | Cron | `tools/cron-tool.ts` | ✅ **NEW** Create scheduled jobs |
| `cron_list` | Cron | `tools/cron-tool.ts` | ✅ **NEW** List scheduled jobs |
| `cron_trigger` | Cron | `tools/cron-tool.ts` | ✅ **NEW** Manually trigger a job |
| `cron_pause` | Cron | `tools/cron-tool.ts` | ✅ **NEW** Pause/resume jobs |
| `cron_delete` | Cron | `tools/cron-tool.ts` | ✅ **NEW** Delete scheduled jobs |
| `cron_history` | Cron | `tools/cron-tool.ts` | ✅ **NEW** View job run history |
| `create_ticket` | GLINR | `tools/glinr-ops.ts` | Create tickets |
| `get_ticket` | GLINR | `tools/glinr-ops.ts` | Get ticket details |
| `list_tickets` | GLINR | `tools/glinr-ops.ts` | List/filter tickets |
| `update_ticket` | GLINR | `tools/glinr-ops.ts` | Update ticket status/fields |
| `create_project` | GLINR | `tools/glinr-ops.ts` | Create projects |
| `list_projects` | GLINR | `tools/glinr-ops.ts` | List projects |
| `complete_task` | Agent | `tools/complete-task.ts` | Mark agent task complete |

---

## Memory System Comparison

### OpenClaw Memory Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory Sources                           │
├─────────────────────────────────────────────────────────────┤
│  • MEMORY.md (main memory file)                             │
│  • memory/*.md (additional memory files)                    │
│  • Session transcripts (experimental)                       │
│  • extraPaths (configurable additional paths)               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Chunking Layer                           │
├─────────────────────────────────────────────────────────────┤
│  • Token-based chunking (default: 400 tokens)               │
│  • Overlap: 80 tokens                                       │
│  • Hash-based deduplication                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Embedding Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Providers:                                                 │
│  • OpenAI: text-embedding-3-small (default)                 │
│  • Gemini: gemini-embedding-001                             │
│  • Local: node-llama-cpp (optional)                         │
│  Fallback chain: auto → openai → gemini → local → none      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                            │
├─────────────────────────────────────────────────────────────┤
│  SQLite with:                                               │
│  • files table (path, hash, mtime, size)                    │
│  • chunks table (id, path, lines, text, embedding)          │
│  • meta table (key-value config)                            │
│  • embedding_cache table (provider, model, hash, embedding) │
│  • FTS5 virtual table (full-text search)                    │
│  Vector extension: sqlite-vec                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hybrid Search                            │
├─────────────────────────────────────────────────────────────┤
│  • Vector weight: 0.7                                       │
│  • Text (FTS5) weight: 0.3                                  │
│  • Candidate multiplier: 4x                                 │
│  • Min score: 0.35                                          │
│  • Max results: 6                                           │
└─────────────────────────────────────────────────────────────┘
```

### OpenClaw Memory Schema
```sql
-- Files tracking
CREATE TABLE files (
  path TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'memory',
  hash TEXT NOT NULL,
  mtime INTEGER NOT NULL,
  size INTEGER NOT NULL
);

-- Chunks with embeddings
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'memory',
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  hash TEXT NOT NULL,
  model TEXT NOT NULL,
  text TEXT NOT NULL,
  embedding TEXT NOT NULL,  -- JSON array of floats
  updated_at INTEGER NOT NULL
);

-- Embedding cache
CREATE TABLE embedding_cache (
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  hash TEXT NOT NULL,
  embedding TEXT NOT NULL,
  dims INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (provider, model, provider_key, hash)
);

-- FTS5 for text search
CREATE VIRTUAL TABLE memory_fts USING fts5(
  text,
  id UNINDEXED,
  path UNINDEXED,
  source UNINDEXED,
  model UNINDEXED,
  start_line UNINDEXED,
  end_line UNINDEXED
);
```

### GLINR Current Memory System
- **Only context compaction** - summarizes old messages when context gets large
- **No persistent memory** - doesn't remember across conversations
- **No embedding search** - no semantic search capabilities
- **No MEMORY.md concept** - no user-writable memory file

---

## Session Management Comparison

### OpenClaw Sessions

| Feature | OpenClaw | GLINR |
|---------|----------|-------|
| Multiple concurrent sessions | ✅ Yes | ❌ No |
| Session listing/browsing | ✅ `sessions_list` tool | ❌ No |
| Cross-session messaging | ✅ `sessions_send` tool | ❌ No |
| Session spawning | ✅ `sessions_spawn` tool | ❌ No |
| Session history | ✅ `sessions_history` tool | ⚠️ Per-conversation |
| Session labels/names | ✅ Yes | ❌ No |
| Channel context (discord/slack/etc) | ✅ Yes | ❌ N/A |
| Delivery context tracking | ✅ Yes | ❌ No |
| Token tracking per session | ✅ Yes | ⚠️ Per-message |

### GLINR Session Concept (to build)
```typescript
interface Session {
  id: string;
  name?: string;
  conversationId: string;
  userId?: string;
  createdAt: string;
  lastActiveAt: string;
  // Memory context
  memoryEnabled: boolean;
  memoryLastSyncAt?: string;
  // Stats
  totalTokens: number;
  totalMessages: number;
  totalCost: number;
}
```

---

## Library Comparison

### Key Libraries

| Purpose | OpenClaw | GLINR |
|---------|----------|-------|
| **Embedding Storage** | `sqlite-vec@0.1.7-alpha.2` | `sqlite-vec@0.1.7-alpha.2` ✅ |
| **Local Embeddings** | `node-llama-cpp` (peer) | `ollama` adapter |
| **Schema Validation** | `@sinclair/typebox` | `zod` |
| **Database** | Native SQLite (node:sqlite) | `@libsql/client` (LibSQL/Turso) |
| **HTTP Framework** | `hono@4.11.7` | `hono@4.6.16` ✅ |
| **Browser Automation** | `playwright-core@1.58.1` | ❌ None |
| **Text-to-Speech** | `node-edge-tts` | ❌ None |
| **PDF Processing** | `pdfjs-dist@5.4.624` | ❌ None |
| **Image Processing** | `sharp@0.34.5` | ❌ None |
| **PTY/Terminal** | `@lydell/node-pty` | `node-pty` ✅ |
| **Scheduling** | `croner@10.0.1` | `bullmq` ✅ (more powerful) |
| **File Watching** | `chokidar@5.0.0` | `chokidar` ✅ |

### OpenClaw Key Dependencies
```json
{
  "sqlite-vec": "0.1.7-alpha.2",
  "node-llama-cpp": "3.15.1",        // Local embeddings (peer dep)
  "@sinclair/typebox": "0.34.48",    // Schema validation
  "playwright-core": "1.58.1",       // Browser automation
  "croner": "^10.0.1",               // Cron scheduling
  "chokidar": "^5.0.0",              // File watching
  "sharp": "^0.34.5",                // Image processing
  "pdfjs-dist": "^5.4.624",          // PDF parsing
  "@mozilla/readability": "^0.6.0",  // Web content extraction
  "proper-lockfile": "^4.1.2"        // File locking
}
```

---

## Features to Build (Priority Order)

### Phase 1: Memory System (Critical)
- [ ] Create `memory` schema tables (files, chunks, embedding_cache)
- [ ] Implement memory file sync (watch MEMORY.md + memory/*.md)
- [ ] Add chunking with token-based splitting
- [ ] Integrate OpenAI embeddings (already have service)
- [ ] Implement hybrid search (vector + FTS5)
- [ ] Create `memory_search` tool
- [ ] Create `memory_get` tool
- [ ] Add memory sync triggers (on session start, on search)

### Phase 2: Session Management
- [ ] Create `sessions` table with proper schema
- [ ] Implement `sessions_list` tool
- [ ] Add session naming/labeling
- [ ] Track token usage per session
- [ ] Add session archival/cleanup

### Phase 3: Memory UI
- [ ] Memory browser (view all memories)
- [ ] Memory search UI
- [ ] Memory delete/edit capabilities
- [ ] Memory stats dashboard
- [ ] Import/export memories

### Phase 4: Nice to Have
- [ ] Browser automation (Playwright MCP)
- [x] ~~Cron scheduling for agents~~ ✅ **DONE** - 6 cron tools + REST API + BullMQ backend
- [x] ~~Cron Dashboard UI~~ ✅ **DONE** - Full dashboard with job cards, history modal, create modal
- [ ] Image generation/manipulation
- [ ] TTS capabilities
- [ ] PDF processing

---

## Cron/Scheduling System Enhancement Roadmap

Based on research of OpenClaw's cron system and industry best practices.

### Current GLINR Cron Implementation ✅
| Feature | Status | Notes |
|---------|--------|-------|
| Job persistence (SQLite) | ✅ | Jobs survive restarts |
| BullMQ backend | ✅ | Distributed, Redis-backed |
| Cron expressions | ✅ | 5-field syntax |
| Fixed intervals | ✅ | Millisecond precision |
| Job history tracking | ✅ | Full run logs |
| REST API | ✅ | 8 endpoints |
| AI Tools | ✅ | 6 cron tools for agent access |
| Dashboard UI | ✅ | Cards, stats, history modal, create modal |
| FloatingChatbot context | ✅ | Cron-aware quick actions |

### OpenClaw Cron Features to Consider

| Feature | OpenClaw | GLINR | Priority |
|---------|----------|-------|----------|
| **Wake Modes** | `next-heartbeat` / `now` | Fixed intervals only | 🟡 Medium |
| **Isolated Sessions** | `cron:<jobId>` fresh session | Shared context | 🟡 Medium |
| **Channel Delivery** | Slack/Discord/Telegram/etc | Tool output only | 🟢 Low |
| **Agent Binding** | Jobs bound to specific agents | N/A (single agent) | ⚠️ N/A |
| **One-shot schedules** | ISO 8601 "at" time | Not yet | 🟡 Medium |
| **Auto-delete on success** | Optional for one-shots | Manual cleanup | 🟢 Low |
| **Max concurrent runs** | Configurable limit | BullMQ handles | ✅ Have |

### Enhancement Ideas (from Industry Research)

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| **Event-Driven Triggers** | Wake jobs on external events (webhook, file change) | Medium |
| **Job Dependencies** | Job A runs after Job B completes | Medium |
| **Job Chains/Pipelines** | Sequential multi-step workflows | High |
| **State Machine Jobs** | Jobs with explicit states/transitions | High |
| **Semantic Routing** | Route job output to best agent/tool | Medium |
| **Human-in-the-Loop** | Jobs that pause for approval | Medium |
| **Retry Policies** | Exponential backoff, max retries | Low |
| **Job Templates** | Pre-built job configurations | Low |
| **Smart Scheduling** | AI suggests optimal run times | Low |
| **Observability** | Prometheus metrics, alerts | Medium |

### Recommended Next Enhancements

1. **One-shot "at" scheduling** - Run once at specific datetime
2. **Event triggers** - Fire jobs on webhook/file/ticket events
3. **Job templates** - Common patterns (sync, report, cleanup)
4. **Retry policies** - Configurable backoff strategies
5. **Slack delivery** - Send job output to channels

---

## 🚀 IMPLEMENTATION TRACKER: Cron Enhancement Build

> Building exceptional cron features for GLINR. Live tracking of implementation progress.

### Phase 1: One-Shot "At" Scheduling
| Task | Status | Files |
|------|--------|-------|
| Add `runAt` field to schema | ✅ DONE | `src/storage/schema.ts` |
| Update scheduler types | ✅ DONE | `src/cron/scheduler.ts` |
| Implement one-shot execution logic | ✅ DONE | `src/cron/scheduler.ts` |
| Auto-delete on success (optional) | ✅ DONE | `src/cron/scheduler.ts` |
| Update API routes | ✅ DONE | `src/routes/cron.ts` |
| Update cron tools | ⬜ TODO | `src/chat/execution/tools/cron-tool.ts` |
| Update UI CreateJobModal | ✅ DONE | `ui/src/features/cron/components/CreateJobModal.tsx` |

### Phase 2: Event-Driven Triggers
| Task | Status | Files |
|------|--------|-------|
| Create event trigger types | ✅ DONE | `src/cron/scheduler.ts` |
| Implement webhook trigger | ✅ DONE | `src/cron/scheduler.ts`, `src/routes/cron.ts` |
| Implement ticket event trigger | ✅ DONE | `src/cron/scheduler.ts` |
| Implement file watch trigger | ✅ DONE | `src/cron/scheduler.ts` |
| Add event routes | ✅ DONE | `src/routes/cron.ts` |
| Integrate with job scheduler | ✅ DONE | `src/cron/scheduler.ts` |

### Phase 3: Job Templates
| Task | Status | Files |
|------|--------|-------|
| Define template schema | ✅ DONE | `src/storage/schema.ts` |
| Create built-in templates | ✅ DONE | `src/cron/templates.ts` (10 templates) |
| Add template API routes | ✅ DONE | `src/routes/cron.ts` |
| Update UI with template selector | ⬜ TODO | `ui/src/features/cron/components/` |

### Phase 4: Retry Policies
| Task | Status | Files |
|------|--------|-------|
| Add retry config to schema | ✅ DONE | `src/storage/schema.ts` |
| Implement exponential backoff | ✅ DONE | `src/cron/scheduler.ts` |
| Add retry policy types | ✅ DONE | `src/cron/scheduler.ts` |
| Update job execution with retry | ✅ DONE | `src/cron/scheduler.ts` |
| Add retry UI controls | ⬜ TODO | `ui/src/features/cron/components/` |

### Phase 5: Channel Delivery
| Task | Status | Files |
|------|--------|-------|
| Create delivery types | ✅ DONE | `src/cron/scheduler.ts` |
| Implement Slack delivery | ✅ DONE (stub) | `src/cron/scheduler.ts` |
| Implement webhook delivery | ✅ DONE | `src/cron/scheduler.ts` |
| Add delivery to job payload | ✅ DONE | `src/cron/scheduler.ts` |
| Update UI for delivery config | ⬜ TODO | `ui/src/features/cron/components/` |

### Summary
| Phase | Progress | Details |
|-------|----------|---------|
| Phase 1: One-Shot | 6/7 | ISO datetime one-shot jobs ✅ |
| Phase 2: Events | 6/6 | Webhook, ticket, file triggers ✅ |
| Phase 3: Templates | 3/4 | 10 built-in templates ✅ |
| Phase 4: Retry | 4/5 | Exponential backoff ✅ |
| Phase 5: Delivery | 4/5 | Slack/webhook output ✅ |
| **Total** | **23/27** | **85% complete** |

### Remaining Tasks
- [ ] Update `cron_create` tool to support new params (runAt, eventTrigger, delivery)
- [ ] Add template selector to UI
- [ ] Add retry policy UI controls
- [ ] Add delivery config UI

### New API Endpoints
```
POST   /api/cron/jobs                  # Create job (cron/interval/one-shot/event)
POST   /api/cron/jobs/from-template    # Create job from template
GET    /api/cron/templates             # List templates
GET    /api/cron/templates/:id         # Get template
POST   /api/cron/templates             # Create custom template
DELETE /api/cron/templates/:id         # Delete custom template
POST   /api/cron/events                # Trigger jobs by event type
POST   /api/cron/webhook/:secret       # Webhook endpoint for triggers
```

### Built-in Templates
| Name | Category | Type | Schedule |
|------|----------|------|----------|
| GitHub Issue Sync | sync | tool | Every 6 hours |
| Linear Sync | sync | tool | Every 4 hours |
| Daily Status Report | report | tool | 9 AM weekdays |
| Weekly Sprint Summary | report | tool | Friday 5 PM |
| Archive Old Tickets | cleanup | tool | Sunday 3 AM |
| Cleanup Stale Sessions | cleanup | tool | Daily 4 AM |
| Standup Reminder | notification | message | 9 AM weekdays |
| Due Date Alert | notification | tool | Daily 8 AM |
| Health Check | monitoring | http | Every minute |
| API Metrics Collection | monitoring | script | Every 5 minutes |

---

## Memory Config Defaults (from OpenClaw)

```typescript
const MEMORY_DEFAULTS = {
  // Sources to index
  sources: ["memory"],  // Can include "sessions" for experimental

  // Embedding provider
  provider: "auto",  // "openai" | "local" | "gemini" | "auto"
  fallback: "none",  // "openai" | "gemini" | "local" | "none"
  model: "text-embedding-3-small",  // OpenAI default

  // Chunking
  chunking: {
    tokens: 400,
    overlap: 80,
  },

  // Query settings
  query: {
    maxResults: 6,
    minScore: 0.35,
    hybrid: {
      enabled: true,
      vectorWeight: 0.7,
      textWeight: 0.3,
      candidateMultiplier: 4,
    },
  },

  // Sync triggers
  sync: {
    onSessionStart: true,
    onSearch: true,
    watch: true,
    watchDebounceMs: 1500,
    intervalMinutes: 0,
  },

  // Cache
  cache: {
    enabled: true,
    maxEntries: undefined,
  },
};
```

---

## OpenClaw Memory Tool Prompts

### memory_search
> "Mandatory recall step: semantically search MEMORY.md + memory/*.md (and optional session transcripts) before answering questions about prior work, decisions, dates, people, preferences, or todos; returns top snippets with path + lines."

### memory_get
> "Safe snippet read from MEMORY.md, memory/*.md, or configured memorySearch.extraPaths with optional from/lines; use after memory_search to pull only the needed lines and keep context small."

---

## GLINR Advantages Over OpenClaw

| Feature | GLINR | OpenClaw |
|---------|-------|----------|
| Task Queue | ✅ BullMQ + Redis | ❌ No task queue |
| Cron/Scheduling | ✅ 6 tools + REST API + BullMQ | ⚠️ Basic croner |
| Ticket System | ✅ Full GLINR tickets | ❌ No tickets |
| Project Management | ✅ Projects + Sprints | ❌ No PM |
| Multi-Provider AI | ✅ 15+ providers | ✅ Similar |
| Web UI | ✅ React + shadcn | ⚠️ Basic TUI |
| Token Cost Tracking | ✅ Per-message | ⚠️ Per-session |
| External Sync | ✅ GitHub/Linear/Jira | ⚠️ Limited |
| Git Operations | ✅ 7 git tools | ❌ None |
| File Operations | ✅ 4 file tools | ❌ None built-in |
| Total Tools | ✅ **38** | 15 |

---

## CLI Comparison

### OpenClaw CLI Commands

| Command | Description | GLINR Status |
|---------|-------------|--------------|
| `openclaw` | Show version and help | ✅ `glinr` |
| `openclaw chat "message"` | Single-shot agent invocation | ❌ **NEED** |
| `openclaw chat` | Interactive REPL mode | ❌ **NEED** |
| `openclaw chat --mode rpc --json` | RPC mode for automation | ❌ **NEED** |
| `openclaw chat --session <id>` | Resume specific session | ❌ **NEED** |
| `openclaw agents list` | List available agents | ⚠️ Partial |
| `openclaw agents info <name>` | Get agent details | ❌ Nice to have |
| `openclaw sessions list` | List active sessions | ❌ **NEED** |
| `openclaw sessions kill <id>` | Terminate session | ❌ Nice to have |
| `openclaw memory search "query"` | Search memory from CLI | ❌ Nice to have |
| `openclaw config get` | View configuration | ✅ `glinr config get` |
| `openclaw config set <key> <value>` | Set configuration | ⚠️ Partial |
| `openclaw serve` | Start server | ✅ `glinr serve` |

### GLINR Current CLI Commands

```
src/cli/
├── index.ts                 # Main entry point
├── commands/
│   ├── task.ts              # Task queue operations
│   ├── ticket.ts            # Ticket CRUD operations
│   ├── summary.ts           # Summary generation
│   ├── agent.ts             # Agent management
│   ├── config.ts            # Configuration
│   ├── cost.ts              # Cost tracking
│   ├── serve.ts             # Start server
│   └── tools.ts             # Tool execution testing
└── utils/
    ├── api.ts               # API client
    ├── config.ts            # Config loading
    └── output.ts            # Output formatting
```

### OpenClaw Chat Command Features

```typescript
// From openclaw-reference/src/cli/chat.ts

interface ChatOptions {
  // Modes
  mode: 'agent' | 'rpc';  // agent=interactive, rpc=automation
  json: boolean;          // JSON output for scripts

  // Session
  session?: string;       // Resume session ID
  resume?: boolean;       // Resume last session
  new?: boolean;          // Force new session

  // Agent
  agentId?: string;       // Specific agent to use

  // Memory
  memoryEnabled?: boolean;

  // Execution
  timeout?: number;       // Response timeout
  stream?: boolean;       // Stream responses
}

// Entry points
// Single-shot: openclaw chat "Fix the bug"
// REPL: openclaw chat
// RPC: openclaw chat --mode rpc --json
```

### Key Missing CLI Features for GLINR

1. **`glinr chat "message"`** - Execute single agent prompt
   - Send message to AI
   - Stream response to terminal
   - Execute tool calls
   - Show final result

2. **`glinr chat` (REPL)** - Interactive mode
   - Persistent session
   - Command history
   - Slash commands (/exit, /clear, /history)
   - Multi-turn conversations

3. **`glinr chat --mode rpc`** - Automation mode
   - JSON input/output
   - Machine-readable responses
   - Exit codes for success/failure
   - Integration with scripts

---

## CLI Implementation Plan

### Phase 1: Single-Shot Chat
```typescript
// src/cli/commands/chat.ts
interface ChatOptions {
  message?: string;
  model?: string;
  stream?: boolean;
  json?: boolean;
}

// glinr chat "Fix the bug in login.ts"
program
  .command('chat [message]')
  .description('Start AI chat session')
  .option('-m, --model <model>', 'AI model to use', 'claude-3-5-sonnet')
  .option('-s, --stream', 'Stream responses', true)
  .option('--json', 'Output as JSON')
  .action(async (message, options) => {
    if (message) {
      await executeSingleShot(message, options);
    } else {
      await startREPL(options);
    }
  });
```

### Phase 2: Interactive REPL
```typescript
// Uses readline or inquirer for interactive input
async function startREPL(options: ChatOptions) {
  const rl = readline.createInterface({ input, output });

  while (true) {
    const input = await rl.question('> ');
    if (input === '/exit') break;
    await processMessage(input, options);
  }
}
```

### Phase 3: RPC Mode
```typescript
// Machine-friendly mode for scripts
// glinr chat --mode rpc --json
async function rpcMode() {
  const input = JSON.parse(await readStdin());
  const result = await executeChat(input.message, input.options);
  console.log(JSON.stringify(result));
  process.exit(result.success ? 0 : 1);
}
```

---

## Next Steps

1. **Start with Memory Schema** - Add tables to `src/storage/schema.ts`
2. **Create Memory Service** - New file `src/memory/memory-service.ts`
3. **Implement Chunker** - Use tiktoken or similar for token counting
4. **Add Memory Tools** - `memory_search` and `memory_get`
5. **Build Memory UI** - Memory browser in React UI
6. **Add Session Enhancements** - Better session tracking
7. **Build Chat CLI** - `glinr chat` command with REPL and single-shot modes

---

## Questions to Resolve

1. **Memory file location**: Use `~/.glinr/memory/` or project-relative `memory/`?
2. **Memory scope**: Per-user, per-project, or global?
3. **Embedding model**: OpenAI only or support local (Ollama)?
4. **FTS5 availability**: LibSQL supports FTS5?
5. **Memory edit UX**: How to let users edit memories in UI?
