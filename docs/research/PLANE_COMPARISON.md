# GLINR vs Plane Feature Comparison

> Comprehensive feature-by-feature comparison based on Plane v1.2.0 source code analysis.
> Last updated: 2026-02-04
> Plane repo: `/Users/gdsks/G-Development/GLINR-V3/plane-ref`

---

## Executive Summary

| Category | Plane | GLINR | Leader |
|----------|-------|-------|--------|
| **Issue/Ticket Management** | Full PM suite | AI-native tickets | Plane (depth) |
| **AI Integration** | Basic (page AI, GPT) | **Deep** (15 providers, 51 tools, agent routing) | **GLINR** |
| **Agent Orchestration** | None | **Full** (multi-agent routing, MCP) | **GLINR** |
| **Sprint/Cycle Mgmt** | Mature (burndown, velocity) | Basic (sprints, kanban) | Plane |
| **Modules/Epics** | Full (status, members, links) | Not implemented | Plane |
| **Views & Layouts** | 4 layouts (list, kanban, calendar, gantt) | 2 layouts (list, kanban) | Plane |
| **Pages/Wiki** | Full wiki with versioning | None | Plane |
| **Analytics** | Advanced (custom queries, charts) | Basic (dashboard stats, cost) | Plane |
| **Import/Export** | Jira, GitHub, CSV, XLSX, JSON | GitHub Projects only | Plane |
| **Integrations** | GitHub sync, Slack, webhooks | GitHub, Jira, Linear, Slack webhooks | Tie |
| **Cost Tracking** | None | **Full** (per-message, budget alerts) | **GLINR** |
| **Multi-Agent** | None | **Full** (OpenClaw, Claude, Ollama) | **GLINR** |
| **Tool Execution** | None | **51 tools** with security modes | **GLINR** |
| **Real-time** | WebSocket (plane-live) | SSE | Plane |
| **Notifications** | Full (email, in-app, granular prefs) | Basic (Slack only) | Plane |
| **Self-hosted** | Docker (10 services, PostgreSQL) | Docker (lightweight, SQLite) | Tie |
| **MCP Server** | Yes (plane-mcp-server) | Yes (7 tools built-in) | Tie |
| **Inbox/Intake** | Full triage system | None | Plane |
| **Archives** | Soft delete + restore | None | Plane |
| **Custom Fields** | Yes | No | Plane |
| **Gantt Charts** | Full implementation | None | Plane |
| **Calendar View** | Yes | No | Plane |
| **Webhooks (outbound)** | Full (5 event types, logging, retry) | HMAC inbound only | Plane |
| **Multi-workspace** | Yes | No (single instance) | Plane |
| **Automation** | Auto-archive, auto-close | None built-in | Plane |
| **Draft Issues** | Workspace-level drafts | None | Plane |
| **Time Tracking** | Referenced (premium) | None | Plane |

---

## Detailed Feature Comparison

### 1. Issue / Ticket Management

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| Create/Read/Update/Delete | ✅ | ✅ | — |
| Sequence IDs (PROJ-123) | ✅ | ✅ (GLINR-123) | — |
| Priority levels | ✅ (urgent/high/med/low/none) | ✅ (same) | — |
| Custom states | ✅ (per-project, grouped) | ✅ (backlog/todo/in_progress/in_review/done/cancelled) | Plane: custom per-project |
| Assignees | ✅ (multiple) | ✅ (single) | **Need**: multi-assignee |
| Labels | ✅ (multi-label) | ✅ (array) | — |
| Due dates | ✅ (start + target date) | ✅ (single due date) | **Need**: start date |
| Rich description | ✅ (JSON + HTML + plain) | ✅ (markdown) | — |
| Sub-issues | ✅ (parent_id hierarchy) | ✅ (parentId) | — |
| Issue relations | ✅ (duplicate, relates_to, blocked_by, start/finish_before) | ❌ | **Need**: relation types |
| Issue links | ✅ (external URLs) | ✅ (external_links table) | — |
| Reactions | ✅ (emoji reactions) | ❌ | **Need**: reactions |
| Voting | ✅ (IssueVote) | ❌ | Nice to have |
| Subscribers/Watchers | ✅ (IssueSubscriber) | ❌ | **Need**: watchers |
| Mentions (@user) | ✅ (IssueMention) | ❌ | **Need**: mentions |
| Attachments | ✅ (file uploads, S3) | ❌ | **Need**: attachments |
| Version history | ✅ (IssueVersion, IssueDescriptionVersion) | ✅ (ticket history) | — |
| Activity log | ✅ (IssueActivity, 50k+ lines) | ✅ (audit trail) | Plane: more granular |
| Comments | ✅ (threaded, reactions) | ✅ (unified cross-platform) | — |
| Draft issues | ✅ (workspace-level) | ❌ | Nice to have |
| Bulk operations | ✅ (bulk update/delete) | ❌ | **Need**: bulk ops |
| Estimate points | ✅ (0-12 range) | ❌ | **Need**: story points |

### 2. Project Management

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| Projects with identifiers | ✅ | ✅ (custom prefixes) | — |
| Project members & roles | ✅ (admin/member/guest) | ❌ (single user) | **Need**: multi-user |
| Sprints/Cycles | ✅ (dates, burndown) | ✅ (dates, capacity) | — |
| Modules/Epics | ✅ (status, members, links) | ❌ | **Need**: modules |
| Kanban board | ✅ | ✅ (drag-drop) | — |
| Burndown charts | ✅ | ✅ | — |
| Velocity charts | ✅ | ✅ | — |
| Gantt chart | ✅ (12+ components) | ❌ | **Need**: gantt |
| Calendar view | ✅ | ❌ | **Need**: calendar view |
| Auto-archive/close | ✅ (configurable per project) | ❌ | Nice to have |
| Project favorites | ✅ | ❌ | Nice to have |
| Project webhooks | ✅ | ❌ (only inbound) | **Need**: outbound webhooks |

### 3. Views & Filtering

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| Saved views | ✅ (public/private, locked) | ❌ | **Need**: saved views |
| List layout | ✅ | ✅ | — |
| Kanban layout | ✅ | ✅ | — |
| Calendar layout | ✅ | ❌ | **Need** |
| Gantt layout | ✅ | ❌ | **Need** |
| Spreadsheet layout | ✅ | ❌ | Nice to have |
| Group by (state, priority, assignee, label) | ✅ | ⚠️ Partial | **Need**: more group options |
| Filter by 15+ fields | ✅ | ⚠️ Basic filters | **Need**: advanced filters |
| Display properties toggle | ✅ (15+ columns) | ❌ | **Need**: column config |

### 4. Pages / Wiki / Documentation

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| Rich text editor | ✅ (custom editor package) | ❌ | **Need**: pages |
| Page hierarchy | ✅ (parent pages) | ❌ | **Need** |
| Page versioning | ✅ (PageVersion) | ❌ | **Need** |
| AI-powered content | ✅ (GPT integration) | ❌ | **Need** |
| Page labels | ✅ | ❌ | — |
| Global/project pages | ✅ | ❌ | — |
| Convert to issue | ✅ | ❌ | — |

### 5. Inbox / Intake

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| Issue intake queue | ✅ (pending/accepted/rejected/snoozed/duplicate) | ❌ | Nice to have |
| External submissions | ✅ (email, external ID) | ❌ | Nice to have |
| Triage UI | ✅ (full sidebar + filters) | ❌ | Nice to have |

### 6. AI & Agent Features

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| AI chat | ⚠️ Page AI only (GPT) | ✅ **15 providers**, streaming | **GLINR wins** |
| AI creates tickets | ❌ | ✅ MCP tools | **GLINR wins** |
| AI moves ticket states | ❌ | ✅ MCP tools | **GLINR wins** |
| Multi-agent routing | ❌ | ✅ Gateway with scoring | **GLINR wins** |
| Agent adapters | ❌ | ✅ OpenClaw, Claude Code, Ollama | **GLINR wins** |
| Tool execution | ❌ | ✅ 51 tools, 5 security modes | **GLINR wins** |
| Token cost tracking | ❌ | ✅ Per-message, budget alerts | **GLINR wins** |
| Agent summaries | ❌ | ✅ Structured with Zod, auto-PR descriptions | **GLINR wins** |
| MCP server | ✅ (separate repo) | ✅ (built-in, 7 tools) | Tie |
| Voice input | ❌ | ✅ Web Audio API | **GLINR wins** |
| Image upload in chat | ❌ | ✅ | **GLINR wins** |
| Provider failover | ❌ | ✅ Auto-switch on errors | **GLINR wins** |
| Agentic mode | ❌ | ✅ Tools auto-enable | **GLINR wins** |
| Memory system | ❌ | ✅ Hybrid vector + FTS5 search | **GLINR wins** |
| Session management | ❌ | ✅ Spawn, send, list sessions | **GLINR wins** |

### 7. Analytics & Reporting

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| Issue distribution charts | ✅ | ✅ (dashboard) | — |
| Burndown charts | ✅ | ✅ | — |
| Velocity tracking | ✅ | ✅ | — |
| Custom analytics queries | ✅ (AnalyticView) | ❌ | **Need**: custom analytics |
| Project-level analytics | ✅ (367-line view) | ⚠️ Basic | **Need**: deeper analytics |
| Advanced analytics | ✅ (318-line view) | ❌ | **Need** |
| Cost analytics | ❌ | ✅ (per-model, CSV export) | **GLINR wins** |
| Token usage tracking | ❌ | ✅ (input/output per message) | **GLINR wins** |

### 8. Import / Export

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| GitHub Issues import | ✅ | ✅ (GitHub Projects V2) | — |
| Jira import | ✅ (cloud, API token) | ⚠️ Webhook only | **Need**: Jira importer |
| Linear import | ✅ | ⚠️ Webhook only | **Need**: Linear importer |
| CSV import | ✅ | ❌ | **Need**: CSV import |
| CSV export | ✅ | ✅ (cost dashboard) | — |
| JSON export | ✅ | ❌ | **Need**: JSON export |
| XLSX export | ✅ | ❌ | Nice to have |
| Async export (background) | ✅ (Celery task) | ❌ | **Need** |

### 9. Integrations

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| GitHub bidirectional sync | ✅ (issues + comments) | ✅ (external links + sync) | — |
| Jira integration | ✅ (import) | ✅ (webhook handler) | — |
| Linear integration | ✅ (import) | ✅ (webhook + bi-dir sync) | **GLINR wins** |
| Slack integration | ✅ (project sync, bot) | ✅ (slash commands, OAuth) | Tie |
| Discord | ❌ | ❌ (planned) | — |
| Outbound webhooks | ✅ (5 event types, logging, retry) | ❌ | **Need**: outbound webhooks |
| Webhook logging | ✅ (request/response/status) | ❌ | **Need** |
| OAuth providers | ✅ (social logins) | ✅ (GitHub OAuth) | Plane: more providers |

### 10. Notifications

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| In-app notifications | ✅ (full model, read/snooze/archive) | ❌ | **Need** |
| Email notifications | ✅ (12k+ line task handler) | ❌ | **Need** |
| Granular preferences | ✅ (property_change, state, comment, mention, completed) | ❌ | **Need** |
| Notification center UI | ✅ | ❌ | **Need** |
| Mention notifications | ✅ | ❌ | **Need** |

### 11. Authentication & Users

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| Email/password | ✅ | ✅ | — |
| OAuth (GitHub) | ✅ | ✅ | — |
| SSO | ✅ | ❌ | **Need** (enterprise) |
| API tokens | ✅ (rate limited 60/min) | ✅ (scoped) | — |
| Multi-user | ✅ (workspace members) | ❌ (single user) | **Need**: multi-user |
| Roles & permissions | ✅ (admin/member/guest per project) | ❌ | **Need** |
| Device management | ✅ | ✅ (ED25519, pairing) | **GLINR wins** (crypto-based) |
| Recovery codes | ❌ | ✅ (TXT/JSON/CSV download) | **GLINR wins** |

### 12. Infrastructure & Deployment

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| Docker Compose | ✅ (10 services) | ✅ (lightweight) | Tie |
| Database | PostgreSQL | SQLite/LibSQL | Plane: scale, GLINR: simplicity |
| Cache | Redis/Valkey | Redis (BullMQ) | — |
| Message queue | RabbitMQ | BullMQ (Redis-backed) | — |
| File storage | MinIO (S3-compatible) | ❌ | **Need**: file storage |
| Background workers | Celery (35 task handlers) | BullMQ workers | — |
| Real-time | WebSocket (plane-live) | SSE | **Need**: WebSocket upgrade |
| Admin panel | ✅ (separate app) | ⚠️ Settings page | — |
| Health checks | ✅ | ✅ (detailed) | — |
| Prometheus/Grafana | ❌ | ✅ | **GLINR wins** |

### 13. UI / UX

| Feature | Plane | GLINR | Gap |
|---------|-------|-------|-----|
| React frontend | ✅ (Next.js) | ✅ (Vite + React 19) | — |
| Dark/light mode | ✅ | ✅ (+ midnight theme) | **GLINR wins** |
| Command palette | ✅ | ✅ | — |
| Keyboard shortcuts | ✅ | ⚠️ Basic | **Need**: more shortcuts |
| Drag-drop kanban | ✅ | ✅ (@atlaskit/pragmatic-dnd) | — |
| Mobile responsive | ✅ | ⚠️ Partial | **Need** |
| i18n / Localization | ✅ (20+ languages) | ❌ | Nice to have |
| Theming | ✅ | ✅ (CSS variables) | — |

---

## What GLINR Has That Plane Doesn't

These are GLINR's unique advantages — things to **protect and double down on**:

| Feature | Details |
|---------|---------|
| **AI-native ticket creation** | AI agents create, move, and comment on tickets via MCP |
| **Multi-agent routing** | Gateway scores and routes tasks to best agent (OpenClaw, Claude, Ollama) |
| **51 built-in tools** | Exec, files, git, system, web, memory, sessions, agents, cron, browser, GLINR ops |
| **5 security modes** | deny/sandbox/allowlist/ask/full for tool execution |
| **Token cost tracking** | Per-message cost calculation with model-specific pricing and budget alerts |
| **Provider failover** | Auto-switch between 15 AI providers on errors |
| **Structured summaries** | Auto-generated PR descriptions, changelogs, release notes from agent work |
| **Memory system** | Hybrid vector + FTS5 semantic search across conversations |
| **Session orchestration** | Spawn, send, list cross-session agent communication |
| **Cron system** | 6 tools + event triggers + templates + retry policies |
| **Task queue** | BullMQ with smart routing, DLQ, circuit breaker |
| **Claude Code hooks** | PostToolUse, Stop, UserPromptSubmit integration |
| **Device identity** | ED25519 cryptographic device pairing |
| **Prometheus/Grafana** | Built-in monitoring and dashboards |
| **Voice input** | Web Audio API in chat |
| **Lightweight deployment** | SQLite — no PostgreSQL, no RabbitMQ, no MinIO needed |

---

## What Plane Has That GLINR Needs

### Must Build (High Priority)

| Feature | Plane Implementation | GLINR Effort | Why |
|---------|---------------------|--------------|-----|
| **Modules/Epics** | Module model with status, members, links | Medium | Group related issues for large features |
| **Issue relations** | duplicate, relates_to, blocked_by, start/finish_before | Medium | Dependency tracking is essential for planning |
| **Saved views** | IssueView with 15+ filters, public/private | Medium | Users need custom filtered views |
| **Outbound webhooks** | 5 event types, logging, retry | Medium | Enable external tool integration |
| **In-app notifications** | Notification model with read/snooze/archive | Medium | Users miss updates without this |
| **Bulk operations** | Bulk update status, assignee, labels, delete | Low | Productivity for large backlogs |
| **Estimate points** | 0-12 story points per issue | Low | Sprint planning needs estimates |
| **File attachments** | S3/MinIO storage, signed URLs | Medium | Attach screenshots, docs to issues |
| **Multi-assignee** | ManyToMany IssueAssignee | Low | Real teams need multiple assignees |
| **Start date** | start_date + target_date per issue | Low | Timeline planning |

### Should Build (Medium Priority)

| Feature | Plane Implementation | GLINR Effort | Why |
|---------|---------------------|--------------|-----|
| **Calendar view** | Date-based issue layout | Medium | Visual date-based planning |
| **Gantt chart** | 12+ component timeline view | High | Enterprise project visualization |
| **Pages/Wiki** | Rich editor, versioning, AI content | High | Documentation alongside tickets |
| **Advanced analytics** | Custom queries, project analytics | Medium | Data-driven decisions |
| **CSV/JSON import** | Multi-format importers | Medium | Onboard from other tools |
| **Reactions** | Emoji on issues and comments | Low | Team engagement |
| **Mentions (@user)** | IssueMention with notifications | Low | Collaboration |
| **Watchers/Subscribers** | IssueSubscriber | Low | Follow issues without assignment |
| **Advanced filters** | 15+ filter fields with operators | Medium | Power user filtering |
| **Display property toggle** | Show/hide 15+ columns | Low | Customizable list views |

### Nice to Have (Low Priority)

| Feature | Plane Implementation | GLINR Effort | Why |
|---------|---------------------|--------------|-----|
| **Inbox/Intake** | Triage queue for external submissions | Medium | Handle inbound requests |
| **Draft issues** | Workspace-level drafts | Low | Save work-in-progress issues |
| **Multi-workspace** | Workspace model with isolation | High | Multi-tenant support |
| **SSO** | Enterprise auth | High | Enterprise requirement |
| **Roles & permissions** | Admin/Member/Guest per project | High | Multi-user access control |
| **Auto-archive/close** | Configurable per project | Low | Reduce backlog clutter |
| **i18n** | 20+ languages | High | International users |
| **XLSX export** | Excel format export | Low | Enterprise reporting |
| **Spreadsheet view** | Table-style layout | Medium | Data-heavy workflows |
| **Time tracking** | Premium feature | Medium | Effort tracking |

---

## Recommended Build Order

Based on gap analysis, here's the suggested implementation sequence:

### Phase A: Core PM Parity (make tickets competitive)
1. **Issue relations** (blocked_by, relates_to, duplicate) — Medium
2. **Estimate points** (story points) — Low
3. **Start date** field — Low
4. **Multi-assignee** — Low
5. **Bulk operations** (bulk status/assignee/label change) — Low

### Phase B: Views & Organization
6. **Saved views** (with filters, public/private) — Medium
7. **Modules/Epics** (group issues into features) — Medium
8. **Calendar view** — Medium
9. **Advanced filters** (15+ fields) — Medium
10. **Display property toggles** — Low

### Phase C: Collaboration
11. **In-app notifications** (notification center) — Medium
12. **Outbound webhooks** (event-based, with logging) — Medium
13. **Reactions** on issues/comments — Low
14. **Mentions** (@user) — Low
15. **Watchers/Subscribers** — Low
16. **File attachments** (S3/R2 storage) — Medium

### Phase D: Advanced Features
17. **Pages/Wiki** system — High
18. **Gantt chart** — High
19. **Advanced analytics** — Medium
20. **CSV/JSON import** — Medium
21. **Inbox/Intake** triage — Medium

---

## Architecture Comparison

```
PLANE STACK                          GLINR STACK
─────────────────────────           ─────────────────────────
Next.js (React)                     Vite + React 19
Django (Python)                     Hono (TypeScript)
PostgreSQL                          SQLite/LibSQL
Redis/Valkey                        Redis (BullMQ)
RabbitMQ                            BullMQ (Redis-backed)
Celery (workers)                    BullMQ workers
MinIO (S3)                          — (no file storage yet)
plane-live (WebSocket)              SSE
Nginx proxy                         Direct Hono server
─────────────────────────           ─────────────────────────
10 Docker services                  2-3 Docker services
~200MB+ RAM minimum                 ~100MB RAM minimum
```

**GLINR advantage**: Dramatically simpler deployment. One binary + Redis vs 10 services.

**Plane advantage**: Battle-tested at scale with PostgreSQL and proper message queue.

---

## Competitive Positioning

| Axis | Plane | GLINR |
|------|-------|-------|
| **Target user** | Teams wanting open-source Jira/Linear | Developers using AI agents |
| **Core value** | Traditional PM with open-source freedom | AI drives, human reviews |
| **Differentiator** | Feature-complete PM alternative | AI-native from day one |
| **Weakness** | No AI agent integration | Missing traditional PM depth |
| **Opportunity** | Add AI features | Add PM features from Plane playbook |

**Strategy**: Don't try to out-Plane Plane. Build the PM features users expect (relations, modules, views) while keeping the AI-native advantage that Plane can't easily replicate.
