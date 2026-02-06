# GLINR Launch Checklist

> **Goal:** Stabilize, test, and prepare for OSS launch
> **Status:** In Progress
> **Audit Date:** 2026-02-05
> **Total Endpoints:** ~210+ | **Modules:** 30 | **With Tests:** 20 (67%)

---

## Test Status Summary

| Category | Passing | Failing | Skipped | Coverage |
|----------|---------|---------|---------|----------|
| Unit Tests | 466 | 0 | 5 | 73.5% |
| API Tests (shell) | 10/10 | 0 | - | N/A |

**Status: ALL TESTS PASSING (466/466)**

### Coverage Progress

| Metric | Previous | Current | Launch Target | Post-Launch |
|--------|----------|---------|---------------|-------------|
| Lines | 55.41% | **73.51%** | 60% | 80% |
| Functions | 51.96% | **59.81%** | 50% | 80% |
| Branches | 41.23% | **72.67%** | 50% | 70% |
| Statements | 53.18% | **76.29%** | 60% | 80% |

**All launch coverage targets EXCEEDED.**

### Module Coverage Detail

| Module | Tests | Coverage | Status |
|--------|-------|----------|--------|
| `costs/` | budget, pricing, token-tracker | 98-100% | DONE |
| `types/` | errors | 100% | DONE |
| `hooks/` | tool-use | 100% | DONE |
| `intelligence/` | rules, ollama | 91-95% | DONE |
| `summaries/` | extractor, storage | 88% | DONE |
| `integrations/` | github, jira, linear, clients | 84-86% | DONE |
| `notifications/` | slack | 82-88% | DONE |
| `queue/` | failure-handler, notifications, task-queue | 75-93% | DONE |
| `adapters/` | openclaw, claude-code, ollama, registry | 71+ | DONE |
| `settings/` | settings | 74% | DONE |
| `projects/` | index | 73-82% | DONE |
| `storage/` | libsql, index, analytics | 68-87% | DONE |
| `auth/` | auth-service | 66% | DONE |
| `tickets/` | index | 60-65% | DONE |
| `agents/` | executor, stop-conditions | 55%+ | DONE |
| `utils/` | config-loader, logger | 56-68% | DONE |
| `ai/` | embedding-service | NEW | DONE |
| `browser/` | browser | 6 tests | DONE |
| `chat/execution/` | secrets, session-spawn/manager | 9 tests | DONE |
| `routes/` | import, tools-streaming | 38 tests | DONE |

### Modules Still Needing Tests (8 remaining)

| Priority | Module | What Needs Testing |
|----------|--------|--------------------|
| P1 | `gateway/` | Multi-agent routing, workflows |
| P1 | `cron/` | Scheduler, heartbeat, templates |
| P1 | `skills/` | Skill loading, registry, prompt building |
| P1 | `sync/` | Sync engine, adapters, conflict resolution |
| P2 | `labels/` | CRUD, ticket-label associations |
| P2 | `states/` | Workflow states, group mapping |
| P2 | `memory/` | Search, file sync, chunking |
| P2 | `mcp/` | MCP server, browser tools |

---

## Phase 1: Fix Failing Tests - COMPLETE

| File | Issue | Status |
|------|-------|--------|
| `task-failure.e2e.test.ts` | DLQ returns `{tasks, total}` | FIXED |
| `task-queue.bench.test.ts` | Mock missing `initStorage` | FIXED |
| `failure-handler.test.ts` | DLQ tests | PASSING |
| `claude-code.test.ts` | Timeout from mock issue | FIXED |
| `extractor.test.ts` | `require()` bypassing ESM mocks | FIXED |

**Skipped (need infrastructure):**
- `task-lifecycle.test.ts` - Requires Redis
- `task-queue.bench.test.ts` - Timing-sensitive

---

## Phase 2: API Testing - COMPLETE

> 10 shell-based tests covering agentic chat, tool calling, and multi-step flows.

| Test | Status | Tools Validated |
|------|--------|----------------|
| Simple Chat | PASS | Basic chat (no tools) |
| Tools Available | PASS | Tool listing endpoint |
| Create Ticket | PASS | create_ticket (single step) |
| Agentic: Ticket Flow | PASS | list_projects, create_ticket |
| Agentic: Project+Ticket | PASS | create_project, create_ticket, update_ticket, get_ticket |
| Agentic: Git Workflow | PASS | git_status, git_log (parallel) |
| Agentic: File Ops Chain | PASS | search_files, read_file, grep |
| Agentic: Error Recovery | PASS | read_file (fail + retry) |
| Agentic: Cron Lifecycle | PASS | cron_create, cron_list, cron_trigger |
| Agentic: Web Search | PASS | web_search/web_fetch, create_ticket |

**Test runner improvements:**
- `--parallel` flag (~3x faster)
- `--isolated` flag (fresh conversation per test)
- `--timeout N` (default 120s, kills hanging tests)
- Per-test timing in results table

---

## Phase 3: Full API Endpoint Audit

> 200+ endpoints discovered. Grouped by route file.
> Legend: Pass / Fail / Untested

### Auth (13 endpoints) - `src/routes/auth.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/auth/signup` | ⬜ |
| 2 | POST | `/api/auth/login` | ⬜ |
| 3 | POST | `/api/auth/logout` | ⬜ |
| 4 | GET | `/api/auth/me` | ⬜ |
| 5 | PATCH | `/api/auth/me` | ⬜ |
| 6 | GET | `/api/auth/github` | ⬜ |
| 7 | GET | `/api/auth/github/callback` | ⬜ |
| 8 | GET | `/api/auth/github/url` | ⬜ |
| 9 | POST | `/api/auth/github/token` | ⬜ |
| 10 | GET | `/auth/jira` | ⬜ |
| 11 | GET | `/auth/jira/callback` | ⬜ |
| 12 | GET | `/auth/linear` | ⬜ |
| 13 | GET | `/auth/linear/callback` | ⬜ |

### Setup (7 endpoints) - `src/routes/setup.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/setup/status` | ⬜ |
| 2 | POST | `/api/setup/github-oauth/validate` | ⬜ |
| 3 | POST | `/api/setup/github-oauth` | ⬜ |
| 4 | POST | `/api/setup/admin` | ⬜ |
| 5 | POST | `/api/setup/verify-recovery-code` | ⬜ |
| 6 | POST | `/api/setup/reset-password` | ⬜ |
| 7 | GET | `/api/setup/env-template` | ⬜ |

### Users (23 endpoints) - `src/routes/users.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/users/me/profile` | ⬜ |
| 2 | PATCH | `/api/users/me/profile` | ⬜ |
| 3 | PUT | `/api/users/me/email` | ⬜ |
| 4 | PUT | `/api/users/me/password` | ⬜ |
| 5 | GET | `/api/users/me/connected-accounts` | ⬜ |
| 6 | DELETE | `/api/users/me/connected-accounts/:provider` | ⬜ |
| 7 | PUT | `/api/users/me/primary-email` | ⬜ |
| 8 | GET | `/api/users/me/preferences` | ⬜ |
| 9 | PATCH | `/api/users/me/preferences` | ⬜ |
| 10 | GET | `/api/users/me/api-keys` | ⬜ |
| 11 | POST | `/api/users/me/api-keys` | ⬜ |
| 12 | DELETE | `/api/users/me/api-keys/:keyId` | ⬜ |
| 13 | GET | `/api/users/me/sessions` | ⬜ |
| 14 | DELETE | `/api/users/me/sessions/:sessionId` | ⬜ |
| 15 | DELETE | `/api/users/me/sessions` | ⬜ |
| 16 | POST | `/api/users/me/complete-onboarding` | ⬜ |
| 17 | POST | `/api/users/me/recovery-codes/regenerate` | ⬜ |
| 18 | GET | `/api/users/me/recovery-codes/count` | ⬜ |
| 19 | GET | `/api/users/admin/list` | ⬜ |
| 20 | GET | `/api/users/admin/:userId` | ⬜ |
| 21 | PATCH | `/api/users/admin/:userId` | ⬜ |
| 22 | POST | `/api/users/admin/:userId/reset-password` | ⬜ |
| 23 | DELETE | `/api/users/admin/:userId` | ⬜ |

### Tokens (3 endpoints) - `src/routes/tokens.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/tokens` | ⬜ |
| 2 | GET | `/api/tokens` | ⬜ |
| 3 | DELETE | `/api/tokens/:id` | ⬜ |

### Projects (24 endpoints) - `src/routes/projects.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/projects` | ⬜ |
| 2 | POST | `/api/projects` | ⬜ |
| 3 | GET | `/api/projects/:id` | ⬜ |
| 4 | PATCH | `/api/projects/:id` | ⬜ |
| 5 | POST | `/api/projects/:id/archive` | ⬜ |
| 6 | DELETE | `/api/projects/:id` | ⬜ |
| 7 | GET | `/api/projects/by-key/:key` | ⬜ |
| 8 | GET | `/api/projects/default` | ⬜ |
| 9 | POST | `/api/projects/migrate` | ⬜ |
| 10 | GET | `/api/projects/:id/external-links` | ⬜ |
| 11 | POST | `/api/projects/:id/external-links` | ⬜ |
| 12 | GET | `/api/projects/:id/sprints` | ⬜ |
| 13 | POST | `/api/projects/:id/sprints` | ⬜ |
| 14 | GET | `/api/projects/:id/sprints/:sprintId` | ⬜ |
| 15 | PATCH | `/api/projects/:id/sprints/:sprintId` | ⬜ |
| 16 | POST | `/api/projects/:id/sprints/:sprintId/start` | ⬜ |
| 17 | POST | `/api/projects/:id/sprints/:sprintId/complete` | ⬜ |
| 18 | POST | `/api/projects/:id/sprints/:sprintId/cancel` | ⬜ |
| 19 | DELETE | `/api/projects/:id/sprints/:sprintId` | ⬜ |
| 20 | GET | `/api/projects/:id/sprints/active` | ⬜ |
| 21 | GET | `/api/projects/:id/sprints/:sprintId/tickets` | ⬜ |
| 22 | POST | `/api/projects/:id/sprints/:sprintId/tickets` | ⬜ |
| 23 | DELETE | `/api/projects/:id/sprints/:sprintId/tickets/:ticketId` | ⬜ |
| 24 | PUT | `/api/projects/:id/sprints/:sprintId/tickets/reorder` | ⬜ |

### Tickets (12 endpoints) - `src/routes/tickets.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/tickets` | ⬜ |
| 2 | POST | `/api/tickets` | ⬜ |
| 3 | GET | `/api/tickets/:id` | ⬜ |
| 4 | PATCH | `/api/tickets/:id` | ⬜ |
| 5 | DELETE | `/api/tickets/:id` | ⬜ |
| 6 | POST | `/api/tickets/:id/transition` | ⬜ |
| 7 | POST | `/api/tickets/:id/assign-agent` | ⬜ |
| 8 | GET | `/api/tickets/:id/comments` | ⬜ |
| 9 | POST | `/api/tickets/:id/comments` | ⬜ |
| 10 | GET | `/api/tickets/:id/links` | ⬜ |
| 11 | POST | `/api/tickets/:id/links` | ⬜ |
| 12 | GET | `/api/tickets/:id/history` | ⬜ |

### Labels (9 endpoints) - `src/routes/labels.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/projects/:projectId/labels` | ⬜ |
| 2 | POST | `/api/projects/:projectId/labels` | ⬜ |
| 3 | GET | `/api/labels/:id` | ⬜ |
| 4 | PATCH | `/api/labels/:id` | ⬜ |
| 5 | DELETE | `/api/labels/:id` | ⬜ |
| 6 | GET | `/api/tickets/:ticketId/labels` | ⬜ |
| 7 | PUT | `/api/tickets/:ticketId/labels` | ⬜ |
| 8 | POST | `/api/tickets/:ticketId/labels/:labelId` | ⬜ |
| 9 | DELETE | `/api/tickets/:ticketId/labels/:labelId` | ⬜ |

### Tasks (12 endpoints) - `src/routes/tasks.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/tasks` | ⬜ |
| 2 | POST | `/api/tasks` | ⬜ |
| 3 | GET | `/api/tasks/analytics` | ⬜ |
| 4 | GET | `/api/tasks/filter` | ⬜ |
| 5 | GET | `/api/tasks/archived` | ⬜ |
| 6 | POST | `/api/tasks/archive` | ⬜ |
| 7 | GET | `/api/tasks/export` | ⬜ |
| 8 | POST | `/api/tasks/import` | ⬜ |
| 9 | GET | `/api/tasks/:id` | ⬜ |
| 10 | GET | `/api/tasks/:id/events` | ⬜ |
| 11 | POST | `/api/tasks/:id/cancel` | ⬜ |
| 12 | POST | `/api/tasks/:id/retry` | ⬜ |

### DLQ (6 endpoints) - `src/routes/dlq.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/dlq` | ⬜ |
| 2 | GET | `/api/dlq/stats` | ⬜ |
| 3 | POST | `/api/dlq/:id/retry` | ⬜ |
| 4 | POST | `/api/dlq/:id/resolve` | ⬜ |
| 5 | POST | `/api/dlq/:id/discard` | ⬜ |
| 6 | DELETE | `/api/dlq/:id` | ⬜ |

### Chat (6+ endpoints) - `src/routes/chat.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/chat/completions` | ⬜ |
| 2 | GET | `/api/chat/conversations` | ⬜ |
| 3 | POST | `/api/chat/conversations` | ⬜ |
| 4 | GET | `/api/chat/conversations/:id` | ⬜ |
| 5 | GET | `/api/chat/conversations/:id/messages` | ⬜ |
| 6 | POST | `/api/chat/conversations/:id/messages` | ⬜ |

### Tools (2+ endpoints) - `src/routes/tools.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/tools/execute` | ⬜ |
| 2 | POST | `/api/tools/execute/stream` | ⬜ |

### Agents (2 endpoints) - `src/routes/agents.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/agents` | ⬜ |
| 2 | GET | `/api/agents/types` | ⬜ |

### Gateway (8 endpoints) - `src/routes/gateway.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/gateway/execute` | ⬜ |
| 2 | POST | `/api/gateway/execute-secure` | ⬜ |
| 3 | GET | `/api/gateway/status` | ⬜ |
| 4 | GET | `/api/gateway/agents` | ⬜ |
| 5 | GET | `/api/gateway/workflows` | ⬜ |
| 6 | GET | `/api/gateway/workflows/:type` | ⬜ |
| 7 | GET | `/api/gateway/config` | ⬜ |
| 8 | PATCH | `/api/gateway/config` | ⬜ |

### Cron (19 endpoints) - `src/routes/cron.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/cron/jobs` | ⬜ |
| 2 | POST | `/api/cron/jobs` | ⬜ |
| 3 | POST | `/api/cron/jobs/from-template` | ⬜ |
| 4 | GET | `/api/cron/jobs/:id` | ⬜ |
| 5 | PATCH | `/api/cron/jobs/:id` | ⬜ |
| 6 | DELETE | `/api/cron/jobs/:id` | ⬜ |
| 7 | POST | `/api/cron/jobs/:id/trigger` | ⬜ |
| 8 | POST | `/api/cron/jobs/:id/pause` | ⬜ |
| 9 | POST | `/api/cron/jobs/:id/resume` | ⬜ |
| 10 | POST | `/api/cron/jobs/:id/archive` | ⬜ |
| 11 | POST | `/api/cron/jobs/:id/restore` | ⬜ |
| 12 | GET | `/api/cron/jobs/:id/history` | ⬜ |
| 13 | GET | `/api/cron/stats` | ⬜ |
| 14 | GET | `/api/cron/templates` | ⬜ |
| 15 | GET | `/api/cron/templates/:id` | ⬜ |
| 16 | POST | `/api/cron/templates` | ⬜ |
| 17 | DELETE | `/api/cron/templates/:id` | ⬜ |
| 18 | POST | `/api/cron/events` | ⬜ |
| 19 | POST | `/api/cron/webhook/:secret` | ⬜ |

### Memory (16 endpoints) - `src/routes/memory.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/memory/init` | ⬜ |
| 2 | GET | `/api/memory/stats` | ⬜ |
| 3 | POST | `/api/memory/search` | ⬜ |
| 4 | POST | `/api/memory/get` | ⬜ |
| 5 | POST | `/api/memory/sync` | ⬜ |
| 6 | GET | `/api/memory/files` | ⬜ |
| 7 | GET | `/api/memory/files/:path/chunks` | ⬜ |
| 8 | DELETE | `/api/memory/chunks/:id` | ⬜ |
| 9 | DELETE | `/api/memory/files/:path` | ⬜ |
| 10 | DELETE | `/api/memory/all` | ⬜ |
| 11 | GET | `/api/memory/sessions` | ⬜ |
| 12 | POST | `/api/memory/sessions` | ⬜ |
| 13 | POST | `/api/memory/sessions/:id/archive` | ⬜ |
| 14 | GET | `/api/memory/config` | ⬜ |
| 15 | GET | `/api/memory/watcher/status` | ⬜ |
| 16 | POST | `/api/memory/warm` | ⬜ |

### Skills (7 endpoints) - `src/routes/skills.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/skills` | ⬜ |
| 2 | GET | `/api/skills/:name` | ⬜ |
| 3 | POST | `/api/skills/reload` | ⬜ |
| 4 | POST | `/api/skills/:name/install` | ⬜ |
| 5 | GET | `/api/skills/snapshot/prompt` | ⬜ |
| 6 | GET | `/api/skills/mcp-servers` | ⬜ |
| 7 | POST | `/api/skills/:name/toggle` | ⬜ |

### Summaries (14 endpoints) - `src/routes/summaries.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/summaries` | ⬜ |
| 2 | POST | `/api/summaries` | ⬜ |
| 3 | GET | `/api/summaries/stats` | ⬜ |
| 4 | GET | `/api/summaries/recent` | ⬜ |
| 5 | GET | `/api/summaries/search` | ⬜ |
| 6 | GET | `/api/summaries/semantic` | ⬜ |
| 7 | GET | `/api/summaries/changelog` | ⬜ |
| 8 | GET | `/api/summaries/release-notes` | ⬜ |
| 9 | GET | `/api/summaries/templates` | ⬜ |
| 10 | GET | `/api/summaries/:id` | ⬜ |
| 11 | GET | `/api/summaries/:id/pr-description` | ⬜ |
| 12 | GET | `/api/summaries/:id/commit-message` | ⬜ |
| 13 | GET | `/api/summaries/:id/raw-output` | ⬜ |
| 14 | DELETE | `/api/summaries/:id` | ⬜ |

### Search (3 endpoints) - `src/routes/search.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/search/semantic` | ⬜ |
| 2 | GET | `/api/search/text` | ⬜ |
| 3 | GET | `/api/search/capabilities` | ⬜ |

### Costs (4 endpoints) - `src/routes/costs.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/costs/summary` | ⬜ |
| 2 | GET | `/api/costs/budget` | ⬜ |
| 3 | GET | `/api/costs/analytics` | ⬜ |
| 4 | GET | `/api/costs/export` | ⬜ |

### Stats (4 endpoints) - `src/routes/stats.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/stats/dashboard` | ⬜ |
| 2 | GET | `/api/stats/sprints/:id/burndown` | ⬜ |
| 3 | GET | `/api/stats/projects/:id/velocity` | ⬜ |
| 4 | GET | `/api/stats/projects/:id` | ⬜ |

### Settings (5 endpoints) - `src/routes/settings.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/settings` | ⬜ |
| 2 | PATCH | `/api/settings` | ⬜ |
| 3 | POST | `/api/settings/reset` | ⬜ |
| 4 | GET | `/api/settings/plugins/health` | ⬜ |
| 5 | POST | `/api/settings/plugins/:id/toggle` | ⬜ |

### Import (8 endpoints) - `src/routes/import.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/import/github/validate-token` | ⬜ |
| 2 | GET | `/api/import/github/status` | ⬜ |
| 3 | GET | `/api/import/github/projects` | ⬜ |
| 4 | GET | `/api/import/github/projects/:id/preview` | ⬜ |
| 5 | POST | `/api/import/github/projects/:id/dry-run` | ⬜ |
| 6 | POST | `/api/import/github/projects/:id/execute` | ⬜ |
| 7 | GET | `/api/import/github/repos` | ⬜ |
| 8 | DELETE | `/api/import/github/disconnect` | ⬜ |

### Sync (7 endpoints) - `src/routes/sync.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/sync/webhook/linear` | ⬜ |
| 2 | POST | `/api/sync/webhook/github` | ⬜ |
| 3 | GET | `/api/sync/status` | ⬜ |
| 4 | POST | `/api/sync/trigger` | ⬜ |
| 5 | POST | `/api/sync/push/:ticketId` | ⬜ |
| 6 | GET | `/api/sync/conflicts` | ⬜ |
| 7 | POST | `/api/sync/conflicts/:ticketId/resolve` | ⬜ |

### Hooks (10 endpoints) - `src/routes/hooks.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/hook/tool-use` | ⬜ |
| 2 | POST | `/api/hook/session-end` | ⬜ |
| 3 | POST | `/api/hook/prompt-submit` | ⬜ |
| 4 | GET | `/api/hook/sessions/:sessionId/events` | ⬜ |
| 5 | GET | `/api/hook/sessions/:sessionId/summary` | ⬜ |
| 6 | GET | `/api/hook/sessions` | ⬜ |
| 7 | POST | `/api/hook/webhook/openclaw` | ⬜ |
| 8 | POST | `/api/hook/webhook/agent` | ⬜ |
| 9 | GET | `/api/hook/webhook/reports` | ⬜ |
| 10 | GET | `/api/hook/webhook/tasks/:taskId/reports` | ⬜ |

### Webhooks (3 endpoints) - `src/routes/webhooks.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/webhooks/github` | ⬜ |
| 2 | POST | `/webhooks/jira` | ⬜ |
| 3 | POST | `/webhooks/linear` | ⬜ |

### Devices (12 endpoints) - `src/routes/devices.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/devices/identity` | ⬜ |
| 2 | POST | `/api/devices/attest` | ⬜ |
| 3 | POST | `/api/devices/verify` | ⬜ |
| 4 | POST | `/api/devices/pairing/request` | ⬜ |
| 5 | GET | `/api/devices/pairing/status/:code` | ⬜ |
| 6 | POST | `/api/devices/pairing/approve` | ⬜ |
| 7 | POST | `/api/devices/pairing/reject` | ⬜ |
| 8 | GET | `/api/devices/pairing/pending` | ⬜ |
| 9 | POST | `/api/devices/pairing/validate` | ⬜ |
| 10 | POST | `/api/devices/pairing/cleanup` | ⬜ |
| 11 | GET | `/api/devices/paired` | ⬜ |
| 12 | DELETE | `/api/devices/paired/:id` | ⬜ |

### Messaging: Telegram (8 endpoints) - `src/routes/telegram.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/telegram/status` | ⬜ |
| 2 | POST | `/api/telegram/webhook` | ⬜ |
| 3 | GET | `/api/telegram/config` | ⬜ |
| 4 | POST | `/api/telegram/config` | ⬜ |
| 5 | POST | `/api/telegram/test` | ⬜ |
| 6 | GET | `/api/telegram/oauth/url` | ⬜ |
| 7 | POST | `/api/telegram/webhook/register` | ⬜ |
| 8 | DELETE | `/api/telegram/webhook/unregister` | ⬜ |

### Messaging: Discord (9 endpoints) - `src/routes/discord.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/discord/interactions` | ⬜ |
| 2 | GET | `/api/discord/oauth/url` | ⬜ |
| 3 | GET | `/api/discord/status` | ⬜ |
| 4 | GET | `/api/discord/config` | ⬜ |
| 5 | POST | `/api/discord/config` | ⬜ |
| 6 | POST | `/api/discord/test` | ⬜ |
| 7 | POST | `/api/discord/commands/register` | ⬜ |
| 8 | GET | `/api/discord/allowlist` | ⬜ |
| 9 | POST | `/api/discord/allowlist` | ⬜ |

### Messaging: WhatsApp (6 endpoints) - `src/routes/whatsapp.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/api/whatsapp/webhook` | ⬜ |
| 2 | POST | `/api/whatsapp/webhook` | ⬜ |
| 3 | GET | `/api/whatsapp/status` | ⬜ |
| 4 | GET | `/api/whatsapp/config` | ⬜ |
| 5 | POST | `/api/whatsapp/config` | ⬜ |
| 6 | POST | `/api/whatsapp/test` | ⬜ |

### Messaging: Slack (in chat/providers)

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | POST | `/api/slack/commands` | ⬜ |
| 2 | POST | `/api/slack/events` | ⬜ |
| 3 | POST | `/api/slack/interactions` | ⬜ |
| 4 | GET | `/api/slack/status` | ⬜ |

### Server-Level (8 endpoints) - `src/server.ts`

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/` | ⬜ |
| 2 | GET | `/health` | ⬜ |
| 3 | GET | `/api/stats` | ⬜ |
| 4 | GET | `/api/tasks/:taskId/summaries` | ⬜ |
| 5 | GET | `/api/integrations/status` | ⬜ |
| 6 | GET | `/api/events` (SSE) | ⬜ |
| 7 | GET | `/api/plugins/health` | ⬜ |
| 8 | POST | `/api/plugins/:id/toggle` | ⬜ |

---

## Phase 3b: UI/UX Polish & Bug Fixes

| Task | Status | Notes |
|------|--------|-------|
| AgenticThinking header: dev-mode only | DONE | Minimal "Done" for end users, full detail with `glinr-dev-mode` localStorage |
| Chat fullscreen: hide global sidebar + header | DONE | `.chat-fullscreen` CSS class on `<html>`, hides sidebar/header/padding |
| Cost dashboard: track agentic chat tokens | DONE | `getCostAnalytics()` now queries `conversation_messages` + `summaries`; `trackChatUsage()` added |
| Cost dashboard: accurate input/output token splits | DONE | Executor tracks `inputTokensUsed`/`outputTokensUsed`, emitted in complete event |
| Tool call cards: loading shimmer | DONE | Shimmer bar + blue pulse icon for pending/running tools |
| Tool call cards: collapse 3+ tools | DONE | `ToolCallGroup` component auto-collapses when >= 3 tools |
| Tool call cards: human-friendly duration | DONE | Shows "2.1s" instead of "2100ms" |
| Tool call cards: empty result handling | DONE | "No output returned" for null/empty results |
| Premium glass: refined backdrop/saturate | DONE | Better readability in light (whiteish) and dark (deep) modes |
| Borderless modals: Dialog/AlertDialog/Select | DONE | Applied `modal-glass` utility for cleaner aesthetic |
| Summary Extraction: JIRA/Linear + hidden files | DONE | Improved regexes for `.env`/`.gitignore` and issue keys |

---

## Phase 3c: Infrastructure & DX Improvements (2026-02-05)

| # | Task | Status | Files Changed |
|---|------|--------|---------------|
| 1 | Fix Opus 4.6 maxOutput (128000 tokens) | DONE | `src/providers/core/models.ts` |
| 2 | Consolidate duplicate model configs | DONE | `src/providers/ai-sdk.ts`, `src/providers/core/models.ts`, `src/providers/index.ts` |
| 3 | Add adaptive effort levels (`low/medium/high/max`) | DONE | `src/routes/chat.ts`, `src/agents/types.ts`, `src/agents/index.ts` |
| 4 | Context compaction for agentic executor | DONE | Already existed in `src/chat/memory.ts` |
| 5 | GitHub Actions CI/CD | DONE | `.github/workflows/ci.yml` (pre-existing) |
| 6 | Phase 18 UI widgets (6 components) | DONE | See below |
| 7 | OpenAPI/Swagger documentation | DONE | `src/routes/openapi.ts` |
| 8 | In-app notification system (backend + UI) | DONE | `src/routes/notifications.ts`, `src/storage/libsql.ts`, `ui/src/core/api/domains/notifications.ts`, `ui/src/features/notifications/components/NotificationBell.tsx` |

### Phase 18 UI Components Built

| Component | File | Features |
|-----------|------|----------|
| AssigneePicker | `ui/src/features/tickets/components/AssigneePicker.tsx` | Popover agent picker, unassign, active state |
| WatchersWidget | `ui/src/features/tickets/components/WatchersWidget.tsx` | Collapsible, watch/unwatch toggle, count badge |
| AttachmentsWidget | `ui/src/features/tickets/components/AttachmentsWidget.tsx` | Drag-and-drop, file icons, size formatting (client-side only) |
| ReactionPicker | `ui/src/features/tickets/components/ReactionPicker.tsx` | Emoji chips, toggle state, popover grid |
| BulkActionBar | `ui/src/features/tickets/components/BulkActionBar.tsx` | Floating bar, bulk status/priority/delete, Promise.allSettled |
| RelationsWidget | `ui/src/features/tickets/components/RelationsWidget.tsx` | Pre-existing |

### New API Endpoints Added

| Method | Endpoint | Route File |
|--------|----------|------------|
| GET | `/api/notifications` | `src/routes/notifications.ts` |
| POST | `/api/notifications` | `src/routes/notifications.ts` |
| PATCH | `/api/notifications/:id/read` | `src/routes/notifications.ts` |
| POST | `/api/notifications/mark-all-read` | `src/routes/notifications.ts` |
| DELETE | `/api/notifications/:id` | `src/routes/notifications.ts` |
| GET | `/api/notifications/unread-count` | `src/routes/notifications.ts` |
| GET | `/api/docs` | `src/routes/openapi.ts` (Swagger UI) |
| GET | `/api/docs/openapi.json` | `src/routes/openapi.ts` (JSON spec) |

---

## Antigravity Testing Queue

> Items queued for Antigravity to verify. Copy the prompt section below into a new session.

### Priority 1: Functional Testing

| # | What to Test | How | Expected |
|---|-------------|-----|----------|
| 1 | **Notifications API** | `POST /api/notifications` with `{"title":"Test","type":"info"}`, then `GET /api/notifications` | Created notification appears in list, `unreadCount: 1` |
| 2 | **Mark read** | `PATCH /api/notifications/:id/read`, then `GET /api/notifications/unread-count` | Count decreases by 1 |
| 3 | **Mark all read** | Create 3 notifications, `POST /api/notifications/mark-all-read` | `unreadCount: 0` |
| 4 | **Delete notification** | `DELETE /api/notifications/:id`, then `GET /api/notifications` | Notification removed from list |
| 5 | **Swagger UI** | Visit `/api/docs` in browser | Interactive Swagger UI loads with all endpoints |
| 6 | **OpenAPI JSON** | `GET /api/docs/openapi.json` | Valid OpenAPI 3.1.0 JSON schema |
| 7 | **Agentic effort levels** | `POST /api/chat/conversations/:id/messages/agentic` with `"effort":"high"` | Longer thinking budget, more detailed responses |
| 8 | **NotificationBell UI** | Open app, check bell icon in header | Fetches from `/api/notifications`, shows unread dot, mark-read works |

### Priority 2: UI Component Smoke Tests

| # | Component | Where to Test | Check |
|---|-----------|--------------|-------|
| 1 | AssigneePicker | Ticket detail sidebar | Opens popover, lists agents, assigns/unassigns |
| 2 | WatchersWidget | Ticket detail sidebar | Expands/collapses, toggle watch, count updates |
| 3 | AttachmentsWidget | Ticket detail sidebar | Drag file shows toast, browse works, remove works |
| 4 | ReactionPicker | Ticket comments | Emoji chips render, toggle highlights, picker opens |
| 5 | BulkActionBar | Ticket list (select multiple) | Floating bar appears, bulk status/priority changes |

### Priority 3: Regression Checks

| # | Check | Command |
|---|-------|---------|
| 1 | Build passes | `pnpm build` |
| 2 | All 466 tests pass | `pnpm test` |
| 3 | API test suite | `cd docs/api-testing && ./run-all.sh --parallel` |
| 4 | Model aliases resolve | Chat with `claude-sonnet`, `gpt-4o`, `gemini-pro` aliases |
| 5 | Existing chat flow | Create conversation, send message, get tool calls |

---

## Phase 4: E2E User Flows

| Flow | Steps | Status |
|------|-------|--------|
| **Onboarding** | Setup status -> Create admin -> Login -> Create project | ⬜ |
| **AI Chat** | Create conversation -> Send message -> Stream response -> Tool call -> Complete | ⬜ |
| **Ticket Lifecycle** | Create -> Assign -> Comment -> Transition -> Close | ⬜ |
| **Sprint Workflow** | Create sprint -> Add tickets -> Start -> Complete -> Burndown | ⬜ |
| **Webhook Flow** | Configure Telegram -> Receive message -> Process -> Reply | ⬜ |
| **Cron Job** | Create from template -> Trigger -> Check history -> Pause/Resume | ⬜ |
| **Import** | GitHub OAuth -> Select project -> Preview -> Dry run -> Execute | ⬜ |
| **Memory** | Init -> Sync files -> Search -> Get content -> Delete | ⬜ |
| **Gateway** | Configure -> Execute task -> Check status -> View agents | ⬜ |
| **Device Pairing** | Request code -> Check status -> Approve -> Validate token | ⬜ |

---

## Phase 5: Security & Auth Hardening

| Check | Status | Notes |
|-------|--------|-------|
| All endpoints require auth (except `/health`, `/api/setup/status`) | ✅ | `authMiddleware()` on all `/api/*` routes |
| **Upgrade password hashing from SHA256 to scrypt** | ✅ | `src/auth/password.ts` — scrypt with backward-compat legacy SHA256 migration |
| **Hash session tokens before storage** | ✅ | SHA256 hash before DB insert; plaintext only in cookie |
| **Add auth middleware to all API routes** | ✅ | `src/auth/middleware.ts` — cookie + API token support |
| **Add zod validation to auth endpoints** | ✅ | `signupSchema`, `loginSchema`, `updateProfileSchema` in `routes/auth.ts` |
| **CORS lockdown (don't echo arbitrary origins)** | ✅ | Localhost-only in dev, explicit `CORS_ORIGIN` required in production |
| **Rate limiting on auth endpoints** | ✅ | Login 10/min, signup 5/min, admin create 3/min, recovery/reset 5/min |
| **Input validation on all routes** | 🔄 | Auth routes done, other routes need zod schemas |
| **Secure webhook secret handling** | ✅ | All 6 integrations use HMAC signature verification |
| SQL injection prevention (parameterized queries) | ✅ | LibSQL uses parameterized queries |
| XSS prevention (content sanitization) | ⬜ | |
| CSRF protection (token validation) | ✅ | GitHub OAuth state cookie validated |
| Secrets not in logs | ⬜ | Check all `console.log` |
| Webhook signatures verified (GitHub, Discord, Telegram, WhatsApp, Linear) | ✅ | All verified via audit |
| API tokens hashed at rest | ✅ | SHA256 hash in `api-tokens.ts` (acceptable for random tokens) |
| Session management secure (HttpOnly, Secure cookies) | ✅ | HttpOnly, Secure (prod), SameSite=lax |
| Admin endpoints properly guarded | ✅ | `/api/users/admin/*` has `requireAdmin` middleware |
| Recovery codes hashed | ✅ | SHA256 hash (acceptable for random high-entropy codes) |
| OAuth state parameter validated | ✅ | State cookie compared on callback |
| File upload size limits | ⬜ | |

---

## Phase 6: Deployment & Infrastructure

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| **Cloudflare Tunnel Integration** | P1 | ⬜ | When deploying via Docker, recommend/integrate Cloudflare tunnel for secure exposure without port forwarding. Include setup guidance in docs. |
| **Reverse Proxy Gateway Path Variable** | P2 | ⬜ | Make gateway proxy path configurable via `GATEWAY_PROXY_PATH` env var instead of hardcoded. Allow users to set custom prefix/path. |
| **First-Run Setup UI** | P1 | ⬜ | When app starts for first time (no config/env vars), show setup wizard UI that lets users configure environment variables (Redis URL, API keys, port, etc.) from browser and restart backend. |
| Docker Compose configuration | P2 | ⬜ | Include Redis + app with health checks |
| Kubernetes manifests | P3 | ⬜ | For larger deployments |
| Environment variable validation | P1 | ⬜ | Fail fast with clear messages |

---

## Phase 7: Documentation

| Doc | Status | Notes |
|-----|--------|-------|
| README.md | ⬜ | Quick start, features, screenshots |
| INSTALLATION.md | ⬜ | Docker, manual setup, env vars, **Cloudflare tunnel setup** |
| API.md | ⬜ | Full API reference (200+ endpoints) |
| CONFIGURATION.md | ⬜ | Env vars, settings, provider setup, **first-run setup UI** |
| CONTRIBUTING.md | ⬜ | How to contribute, code style |
| LICENSE | ⬜ | Apache 2.0 or MIT |
| CHANGELOG.md | ⬜ | Version history |
| ARCHITECTURE.md | ⬜ | System design, module overview |

---

## Phase 8: Pre-Launch

| Task | Status | Notes |
|------|--------|-------|
| Clean up console.logs | ⬜ | Replace with structured logger |
| Remove debug/TODO code | ⬜ | |
| Update package.json metadata | ⬜ | Name, description, repo URL |
| Create .env.example | ⬜ | All env vars with defaults (incl. `GATEWAY_PROXY_PATH`) |
| Test Docker build | ⬜ | |
| Test Docker + Cloudflare tunnel | ⬜ | End-to-end deployment test |
| Test fresh `pnpm install && pnpm build` | ⬜ | |
| Verify `pnpm start` works | ⬜ | |
| Test first-run setup UI flow | ⬜ | Clean install -> setup wizard -> configured |
| Create demo video | ⬜ | |
| Write launch post | ⬜ | |
| Set up GitHub repo (public) | ⬜ | Issues, discussions, actions |

---

## Progress Tracking

| Phase | Progress | Notes |
|-------|----------|-------|
| 1. Fix Tests | **100%** | 466 passing, 0 failing |
| 2. API Testing | **100%** | 10/10 pass, parallel + timeouts |
| 3. Module Coverage | **67% (20/30)** | 73.5% line coverage, all targets exceeded |
| 3b. UI/UX Polish | **100% (11/11)** | Chat fullscreen, cost fix, tool polish, glass modals |
| 3c. Infra & DX | **100% (8/8)** | Model consolidation, effort levels, OpenAPI, notifications, UI widgets |
| 4. E2E Flows | 0% (0/10) | Next priority after security fixes |
| 5. Security & Auth | **65% (13/20)** | Auth middleware, scrypt hashing, zod validation, CORS lockdown done |
| 6. Deployment & Infra | 0% (0/6) | Cloudflare tunnel, setup UI, env vars |
| 7. Docs | 20% (ROADMAP + OpenAPI) | Swagger UI live at `/api/docs` |
| 8. Pre-Launch | 0% (0/12) | After everything else |

**Overall: ~55% complete**

---

## Test Commands

```bash
pnpm test                    # Run all tests
pnpm test --coverage         # With coverage report
pnpm test src/routes/        # Test specific directory
pnpm test --watch            # Watch mode
REDIS_URL=... pnpm test src/e2e/  # E2E with Redis

# API Tests
cd docs/api-testing
./run-all.sh --quick         # Core tests (~10s)
./run-all.sh --parallel      # All tests parallel (~40-60s)
./run-all.sh --isolated      # Fresh conversations per test
```

---

## Next Actions

1. [x] Fix 16 failing tests (Phase 1)
2. [x] Set up coverage reporting
3. [x] API test suite with parallel execution (Phase 2)
4. [x] Fix extractor.test.ts ESM mock issue
5. [x] UI/UX polish: chat fullscreen, cost tracking, tool cards (Phase 3b)
6. [x] Security audit completed (Phase 5)
7. [x] Fix auth system issues (Phase 5)
   - [x] Upgrade password hashing to scrypt (with legacy SHA256 migration)
   - [x] Hash session tokens before storage (SHA256 hash in DB, plaintext in cookie only)
   - [x] Add auth middleware to all API routes (`src/auth/middleware.ts`)
   - [x] Add zod validation to auth endpoints
   - [x] CORS lockdown (localhost-only dev, explicit config for prod)
   - [x] Rate limiting on auth endpoints (login/signup/admin/recovery/reset)
   - [x] Password strength enforcement (letter + number + 8 chars)
   - [x] Shared password utility (`src/auth/password.ts`)
   - [x] Secure webhook secret handling (verified all 6 integrations)
8. [ ] Continue unit tests for remaining 8 modules (gateway, cron, skills, sync, labels, states, memory, mcp)
9. [ ] Implement Cloudflare tunnel integration (Phase 6)
10. [ ] Build first-run setup UI (Phase 6)
11. [ ] Make gateway proxy path configurable (Phase 6)
12. [ ] Route-level integration tests for critical endpoints (Phase 4)
13. [ ] Documentation (Phase 7)
14. [ ] Pre-launch cleanup (Phase 8)
