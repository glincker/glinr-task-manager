# GLINR Task Manager - Roadmap

> **Last Updated:** 2026-02-05 (Plane Parity Tracker added - Phases 18-21 for PM feature parity)
> **For AI Agents:** Pick any unchecked item, validate, implement, and PR.

---

## Product Vision

```
GLINR = AI-NATIVE TICKET SYSTEM + AGENT ORCHESTRATOR

"Everyone builds: PM tool + AI assistant"
"GLINR builds: AI-native where AI DRIVES, human REVIEWS"

┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│ AI AGENTS   │────▶│  GLINR TICKETS  │◄───▶│ EXTERNAL PM │
│ Claude Code │     │ • AI creates    │     │ Jira/Linear │
│ OpenClaw    │     │ • AI moves      │     │ GitHub/Plane│
│ Cursor      │     │ • AI responds   │     │ Monday      │
└─────────────┘     │ • Cost tracking │     └─────────────┘
                    │ • Bi-dir sync   │
                    └─────────────────┘
```

| Pain Point | GLINR Solution |
|------------|----------------|
| "What did AI do?" | Unified task view with artifacts |
| Token burn | Cost tracking per task, budget alerts |
| Multi-agent chaos | Coordinated routing, shared context |
| No accountability | Full audit trail with summaries |

---

## Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Core Stability | Complete | 100% |
| 2. Source Integrations | Partial | 60% |
| 3. Agent Adapters | Partial | 33% |
| 4. Smart Routing & Gateway | Complete | 100% |
| 5. MCP Server & Hooks | Complete | 95% |
| 6. Token Cost Management | Complete | 100% |
| 7. Structured Summaries | Complete | 100% |
| 8. Persistence & Storage | Complete | 90% |
| 9. AI-Native Tickets | Complete | 100% |
| 10. Multi-Model AI Chat | Complete | 100% |
| 11. Projects & Scrum | Complete | 100% |
| 12. GitHub Projects Import | Complete | 100% |
| 13. Tool Execution Engine | In Progress | 90% |
| 14. UI Dashboard & Polish | Complete | 98% |
| 15. CLI & Unified Control | Partial | 70% |
| 16. DevOps | In Progress | 50% |
| 17. Data Architecture Optimization | In Progress | 60% |
| **18. Plane Parity - Phase A** | In Progress | 30% |
| **19. Plane Parity - Phase B** | Not Started | 0% |
| **20. Plane Parity - Phase C** | Not Started | 0% |
| **21. Plane Parity - Phase D** | Not Started | 0% |

> **Plane Parity Tracker**: See [PLANE_PARITY_TRACKER.md](./PLANE_PARITY_TRACKER.md) for detailed feature comparison and implementation plans.

---

## Completed Features

### Core Infrastructure
- [x] Structured error types with DLQ categorization
- [x] Circuit breaker for external API calls
- [x] Structured logging with correlation IDs
- [x] Health check dashboard (`/api/health/detailed`)
- [x] Task cancel/retry API endpoints
- [x] libSQL/SQLite storage with Drizzle ORM
- [x] Vector search with cosine similarity fallback

### Source Integrations
- [x] GitHub webhook handler with signature verification
- [x] Jira webhook handler with OAuth
- [x] Linear webhook handler with OAuth
- [x] Slack slash commands
- [x] Discord bot commands (HTTP Interactions + Ed25519)

### Agent Adapters
- [x] OpenClaw adapter with artifact extraction
- [x] Claude Code adapter with subprocess handling
- [x] Ollama adapter with model selection
- [ ] Gemini adapter
- [ ] Devin adapter

### Smart Routing (Phase 4)
- [x] Gateway system with scoring-based agent selection
- [x] Workflow templates and inference from labels/content
- [x] Adapter scoring (capability, labels, priority, load, history)
- [x] Load balancing with capacity tracking
- [x] Cooldown after failures (exponential backoff)

### MCP Server & Hooks (Phase 5)
- [x] MCP server with 7 tools (log_task, complete_task, report_usage, get_context, create_ticket, etc.)
- [x] Claude Code hooks (PostToolUse, Stop, UserPromptSubmit)
- [x] External agent webhooks with HMAC verification
- [x] Rules engine for pattern-based inference ($0 cost)
- [x] Ollama local LLM for summaries ($0 cost)

### Token Cost Management (Phase 6)
- [x] Token tracking per task (input/output)
- [x] Cost calculation with per-model pricing
- [x] Budget alerts at 50%, 80%, 100%
- [x] Cost dashboard with CSV export

### Structured Summaries (Phase 7)
- [x] Summary schema with Zod validation
- [x] Summary extraction from agent outputs
- [x] Full-text search on summaries
- [x] Auto-generate PR descriptions, changelogs, release notes
- [x] Task type inference (bug_fix, feature, refactor, docs, test, perf, security, chore)
- [x] Component inference from file paths (ui, api, database, auth, etc.)
- [x] Smart title generation based on task type and files changed

### AI-Native Tickets (Phase 9)
- [x] Universal ticket schema with sequence IDs (GLINR-123)
- [x] External links table for multi-platform sync
- [x] MCP ticket tools (create, update, comment, assign, transition)
- [x] Bi-directional sync with Linear and GitHub
- [x] Unified comments from all platforms
- [x] Ticket REST API with full CRUD
- [x] Ticket history/audit trail
- [x] Issue relations (blocks/blocked-by/duplicates/relates-to)
- [x] Multi-assignee support
- [x] Watchers/followers on tickets
- [x] Mentions extraction + API
- [x] Attachments API (files/links)
- [x] Reactions (emoji) on tickets
- [x] Start date tracking
- [x] Bulk update and bulk delete

### Multi-Model AI Chat (Phase 10)
- [x] Vercel AI SDK v6 integration
- [x] 15 providers: Anthropic, OpenAI, Azure, Google, Groq, Ollama, OpenRouter, xAI, Mistral, Cohere, Perplexity, DeepSeek, Together, Cerebras, Fireworks
- [x] Provider health indicators and configuration UI
- [x] Chat REST API with streaming
- [x] Voice input (Web Audio API)
- [x] Image upload with preview
- [x] Provider status badges (stable/beta/experimental)
- [x] OpenClaw-style provider failover (auto-switch on errors)
- [x] Azure tool schema normalization (fixes `type: "None"` error)

### Projects & Scrum (Phase 11)
- [x] Projects with custom prefixes (MOBILE-xxx)
- [x] Sprints with dates, capacity, status
- [x] Dashboard analytics (velocity, distribution)
- [x] Project/Sprint UI with icon picker
- [x] Kanban board with drag-drop (@atlaskit/pragmatic-dnd)
- [x] Burndown and velocity charts

### GitHub Projects Import (Phase 12)
- [x] GitHub token storage and validation
- [x] GraphQL client for Projects V2
- [x] Import wizard (6-step modal with enhanced UX)
- [x] Field mapping UI (visual source → target mapping)
- [x] Dry-run preview with conflict detection
- [x] Interactive TanStack Table for item selection
- [x] Timestamp preservation (backdate from GitHub)
- [x] Selective import (checkbox filtering)
- [x] External link creation with GitHub references
- [x] Sync integration with external links
- [x] Comprehensive test coverage (33 tests - unit + E2E)

### Tool Execution Engine (Phase 13)
- [x] Tool registry with Zod validation
- [x] 5 security modes (deny/sandbox/allowlist/ask/full)
- [x] 51 built-in tools (exec, files, git, system, web, memory, sessions, agents, cron, browser, GLINR ops)
- [x] Session spawn/send tools for cross-session orchestration
- [x] Sandbox execution with Docker
- [x] Process pool with concurrent limits
- [x] Audit logging with filters
- [x] Rate limiting per user/conversation
- [x] Chat integration with native tool calling
- [x] Output streaming (SSE) - `/tools/execute/stream` and `/tools/sessions/:id/stream`
- [x] Secrets detection in output
- [x] Clear missing-parameter error messaging
- [ ] Interactive PTY support

### UI Dashboard (Phase 14)
- [x] React 19 + Vite + Tailwind v4 + shadcn/ui
- [x] Feature-based architecture
- [x] Dark/light/midnight themes
- [x] Dashboard with stat cards and charts
- [x] Task list/detail views with filters
- [x] Summary browser with search
- [x] Cost dashboard with export
- [x] Gateway dashboard with health status
- [x] Settings page with sub-navigation
- [x] Ticket list/detail/board views
- [x] Chat view with multi-provider support
- [x] Projects and Sprints views
- [x] Login/Signup with GitHub OAuth
- [x] "Continue as last user" feature
- [x] Recovery codes with download (TXT/JSON/CSV)
- [x] Frosted glass dropdowns and badges
- [x] Legal pages (Privacy, Terms)
- [x] Chat sidebar with collapsible design and conversation groups
- [x] Agent mode toggle (tools auto-enable in agentic mode)
- [x] Compact chat input with inline mode toggle
- [x] Focused view mode for maximized chat space
- [x] Lifted shadow effect on chat container
- [x] Floating chat polish (sky palette, simplified surfaces, reduced shadowing)
- [x] Memory UI in Settings (stats, search, files, sync controls)
- [x] Device Management UI (pairing, revoke, identity)

### CLI & Unified Control (Phase 15)
- [x] Server route modularization (split 1689-line server.ts)
- [x] CLI with Commander.js (task, summary, agent, cost, config commands)
- [x] Ticket CLI commands (list, create, show, update, transition, assign, comment)
- [x] API token authentication with scopes
- [x] Settings API with deep merge
- [ ] Interactive shell (Ink + React)
- [ ] Enhanced MCP tools for CLI commands

---

## In Progress

### Tool Execution Gaps
- [ ] PTY support for interactive commands
- [x] Output streaming via SSE (complete)
- [x] Secrets detection in output
- [ ] Security UI for mode/allowlist management
- [x] Tool approval dialog in chat (component exists)

### Remaining Integrations
- [x] Discord bot (HTTP Interactions + Ed25519)
- [ ] Copilot proxy for $0 AI inference
- [ ] Gemini Flash cheap fallback

### Cloud & Enterprise
- [ ] libSQL/Turso cloud sync
- [ ] PostgreSQL adapter with pgvector
- [ ] BYODB (MySQL, external Postgres)
- [ ] Agent memory with embeddings

---

## Next: OpenClaw Parity Features

Features from OpenClaw that would enhance GLINR:

### High Priority (User Experience)
| Feature | OpenClaw | GLINR Status | Effort |
|---------|----------|--------------|--------|
| Device Identity (ED25519) | `infra/device-identity.ts` | **Complete** | Medium |
| Pairing Codes | `pairing/pairing-store.ts` | **Complete** | Medium |
| Device Management UI | Settings UI | **Complete** | Medium |
| Node/Session Pairing | `infra/node-pairing.ts` | Via Device API | Medium |
| Browser Automation | `browser/` (Playwright) | **Complete** (Playwright) | Low |
| Session Spawn/Send | `sessions_spawn`, `sessions_send` | **Complete** | Medium |

### Medium Priority (Agent Enhancement)
| Feature | OpenClaw | GLINR Status | Effort |
|---------|----------|--------------|--------|
| Context Pruning | `pi-extensions/context-pruning/` | **Complete** (Enhanced) | Medium |
| Skills System | `agents/skills/` | **Complete** (Enhanced) | High |
| Agent Auth Profiles | `agents/auth-profiles/` | Not started | Medium |
| Canvas/Visual | `canvas-host/` | Not started | High |

### Low Priority (Messaging Channels)
| Feature | OpenClaw | GLINR Status | Effort |
|---------|----------|--------------|--------|
| Discord Integration | `discord/` | **Complete** (HTTP Interactions) | Medium |
| Telegram Bot | `telegram/` | **Complete** (Webhooks) | Medium |
| WhatsApp Business | N/A | **Complete** (Cloud API) | Medium |
| iMessage Bridge | `imessage/` | Not started | High |
| Matrix Support | `channels/` | Not started | Medium |

### Already Better in GLINR
| Feature | GLINR | OpenClaw |
|---------|-------|----------|
| Total Tools | **51** | 15 |
| Ticket System | Full CRUD + sync | None |
| Project Management | Projects + Sprints + Kanban | None |
| Git Operations | 7 git tools | None |
| File Operations | 4 file tools | None built-in |
| Cron System | 6 tools + REST API + Templates | Basic croner |
| Cost Tracking | Per-message with budget alerts | Per-session only |
| Web UI | Full React dashboard | Basic TUI |

---

## Not Started

### DevOps (Phase 16)
- [x] Dockerfile for production (multi-stage, health checks, Chromium)
- [x] docker-compose with Redis (health checks, volumes, monitoring profiles)
- [x] Prometheus + Grafana config (provisioning, dashboards)
- [ ] GitHub Actions CI/CD

| 17. Data Architecture Optimization | In Progress | 60% |

---

## Completed Features
...
### Data Architecture Optimization (Phase 17)

**High Priority:**
- [x] Move `rawOutput` from summaries table to separate blob storage (fetch on-demand)
- [x] Implement sparse fieldsets for list APIs (return only id, key, title, status)
- [x] Add pagination to all list endpoints with cursor-based navigation
- [ ] Lazy-load ticket descriptions and comments on detail view

**Medium Priority:**
- [ ] Remove redundant stored counts (`successfulRuns`, `failedRuns` in scheduledJobs)
- [x] Compute counts at query time with indexes (optimized getSummaryStats)
- [ ] Add `ticketId` column to tasks table for task→ticket relationship
- [ ] Index foreign keys for JOIN performance (projectId, sprintId, etc.)
- [ ] Add `lastActivityAt` computed column for sorting

**Low Priority:**
- [ ] Add FTS5 full-text search index on tickets/tasks
- [ ] Implement search highlighting with snippets
- [x] Add database vacuum/optimize scheduled job
- [ ] Create materialized view for dashboard stats (refresh on write)

### Agent Feedback Loop
- [ ] Command protocol (run, pause, cancel, clarify)
- [ ] Progress collection (% complete, blockers)
- [ ] Human-in-the-loop approval
- [ ] Learning from outcomes

### API Enhancements
- [ ] OpenAPI/Swagger documentation
- [ ] API versioning (`/api/v1/...`)
- [ ] WebSocket for real-time updates
- [ ] GraphQL API (optional)

---

## Plane Parity Roadmap

> Full details: [PLANE_PARITY_TRACKER.md](./PLANE_PARITY_TRACKER.md)
> Comparison analysis: [PLANE_COMPARISON.md](./research/PLANE_COMPARISON.md)

### Phase 18: Core PM Parity (Phase A)

**Backend already complete, need UI:**
- [x] Issue relations (blocks, relates, duplicates) - Backend ✅
- [ ] Issue relations UI in TicketDetail
- [x] Multi-assignee support - Backend ✅
- [ ] Multi-assignee picker UI
- [x] Watchers/Subscribers - Backend ✅
- [ ] Watchers UI widget
- [x] Attachments API - Backend ✅
- [ ] Attachments upload UI
- [x] Reactions API - Backend ✅
- [ ] Reactions picker UI
- [x] Bulk operations API - Backend ✅
- [ ] Bulk action toolbar in list view

**New features needed:**
- [ ] Estimate points (story points) - Schema + API + UI
- [ ] Estimate points in sprint capacity

### Phase 19: Views & Organization (Phase B)

- [ ] Saved views (filters, layouts, display props)
  - [ ] `saved_views` table + API
  - [ ] ViewSelector dropdown
  - [ ] ViewFiltersPanel
  - [ ] CreateViewModal
- [ ] Modules/Epics
  - [ ] `modules` tables + API
  - [ ] ModuleList and ModuleDetail views
  - [ ] Add tickets to modules
  - [ ] Module progress tracking
- [ ] Calendar view
- [ ] Gantt chart view
- [ ] Advanced filters (15+ fields)
- [ ] Display property toggles
- [ ] Group by options (status, priority, assignee, label, sprint, module)

### Phase 20: Collaboration (Phase C)

- [ ] In-app notifications
  - [ ] `notifications` table + API
  - [ ] Notification creation service
  - [ ] NotificationBell with dropdown
  - [ ] NotificationCenter page
  - [ ] SSE real-time updates
  - [ ] Notification preferences
- [ ] Outbound webhooks
  - [ ] `webhooks` table + API
  - [ ] Webhook delivery service (BullMQ)
  - [ ] Webhook management UI
  - [ ] Delivery logs
- [ ] Email notifications (optional)
- [ ] @mentions rendering in comments

### Phase 21: Advanced Features (Phase D)

- [ ] Pages/Wiki system
  - [ ] `pages` tables + API
  - [ ] TipTap editor with extensions
  - [ ] Page tree sidebar
  - [ ] Version history
  - [ ] AI content generation
- [ ] Advanced analytics
  - [ ] Custom query builder
  - [ ] More chart types
- [ ] CSV/JSON import
- [ ] Multi-format export (JSON, XLSX)
- [ ] Inbox/Intake triage (optional)
- [ ] Draft issues (optional)

---

## MVP Milestones

### MVP 1.0 (Orchestrator) - COMPLETE
- Tasks flow from GitHub/Jira to AI agents
- MCP Server for Claude Code integration
- Token costs tracked per task
- Summaries stored with search
- PRs linked to tasks

### MVP 2.0 (AI-Native Tickets) - COMPLETE
- AI agents CREATE tickets via MCP
- AI agents MOVE ticket states
- Bi-directional sync with Linear + GitHub
- Unified comment view
- Ticket list UI + CLI

### MVP 3.0 (Tool Execution) - IN PROGRESS
- 40+ tools for AI to use
- 5 security modes
- Sandbox execution
- Approval workflows
- Audit logging

---

## Competitive Advantage

### AI-Native Features (GLINR Wins)

| Feature | GLINR | Plane | Linear | Jira |
|---------|-------|-------|--------|------|
| AI creates tickets | **Yes** (MCP) | No | No | No |
| AI moves states | **Yes** (MCP) | No | No | No |
| Multi-agent routing | **Yes** (15 providers) | No | No | No |
| Token cost tracking | **Yes** (per-message) | No | No | No |
| 51 built-in tools | **Yes** | No | No | No |
| Agent memory system | **Yes** (vector + FTS) | No | No | No |
| Provider failover | **Yes** | No | No | No |
| Session orchestration | **Yes** | No | No | No |

### Traditional PM Features (Building Parity)

| Feature | GLINR | Plane | Gap |
|---------|-------|-------|-----|
| Issue relations | ✅ Backend | ✅ Full | UI needed |
| Multi-assignee | ✅ Backend | ✅ Full | UI needed |
| Watchers | ✅ Backend | ✅ Full | UI needed |
| Attachments | ✅ Backend | ✅ Full | UI needed |
| Reactions | ✅ Backend | ✅ Full | UI needed |
| Story points | ❌ | ✅ | Phase 18 |
| Saved views | ❌ | ✅ | Phase 19 |
| Modules/Epics | ❌ | ✅ | Phase 19 |
| Calendar view | ❌ | ✅ | Phase 19 |
| Gantt chart | ❌ | ✅ | Phase 19 |
| In-app notifications | ❌ | ✅ | Phase 20 |
| Outbound webhooks | ❌ | ✅ | Phase 20 |
| Pages/Wiki | ❌ | ✅ | Phase 21 |

### Infrastructure

| Feature | GLINR | Plane | Notes |
|---------|-------|-------|-------|
| Multi-platform sync | ✅ Bi-directional | Import only | GLINR wins |
| MCP server | ✅ Built-in (7 tools) | ✅ Separate repo | Tie |
| Open source | ✅ | ✅ | Tie |
| Self-hostable | ✅ | ✅ | Tie |
| Lightweight | ✅ SQLite (2-3 containers) | ❌ Postgres (10 containers) | GLINR wins |
| Prometheus/Grafana | ✅ Built-in | ❌ | GLINR wins |

---

## How to Contribute

1. Pick any unchecked `[ ]` item
2. Create branch: `feat/<task>` or `fix/<task>`
3. Follow existing patterns
4. Add tests
5. PR with description

```
[ ] Researched approach
[ ] Followed codebase patterns
[ ] Added/updated tests
[ ] Build passes: pnpm build
[ ] Tests pass: pnpm test
[ ] Lint passes: pnpm lint
```

---

## Resources

- [Plane GitHub](https://github.com/makeplane/plane) - Reference implementation
- [Plane MCP Server](https://github.com/makeplane/plane-mcp-server) - AI integration
- [Langfuse](https://langfuse.com/) - Token cost tracking reference
- [CrewAI](https://github.com/crewAIInc/crewAI) - Multi-agent framework
