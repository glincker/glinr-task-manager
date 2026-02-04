# GLINR Task Manager - Roadmap

> **Last Updated:** 2026-02-03
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
| 16. DevOps | Not Started | 0% |

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
- [ ] Slack slash commands
- [ ] Discord bot commands

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

### AI-Native Tickets (Phase 9)
- [x] Universal ticket schema with sequence IDs (GLINR-123)
- [x] External links table for multi-platform sync
- [x] MCP ticket tools (create, update, comment, assign, transition)
- [x] Bi-directional sync with Linear and GitHub
- [x] Unified comments from all platforms
- [x] Ticket REST API with full CRUD
- [x] Ticket history/audit trail

### Multi-Model AI Chat (Phase 10)
- [x] Vercel AI SDK v6 integration
- [x] 15 providers: Anthropic, OpenAI, Azure, Google, Groq, Ollama, OpenRouter, xAI, Mistral, Cohere, Perplexity, DeepSeek, Together, Cerebras, Fireworks
- [x] Provider health indicators and configuration UI
- [x] Chat REST API with streaming
- [x] Voice input (Web Audio API)
- [x] Image upload with preview
- [x] Provider status badges (stable/beta/experimental)

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
- [x] 18 built-in tools (exec, files, git, system, web)
- [x] Sandbox execution with Docker
- [x] Process pool with concurrent limits
- [x] Audit logging with filters
- [x] Rate limiting per user/conversation
- [x] Chat integration with native tool calling
- [x] Output streaming (SSE) - `/tools/execute/stream` and `/tools/sessions/:id/stream`
- [ ] Secrets detection in output
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
- [ ] Secrets detection in output
- [ ] Security UI for mode/allowlist management
- [x] Tool approval dialog in chat (component exists)

### Remaining Integrations
- [ ] Slack slash commands
- [ ] Discord bot
- [ ] Copilot proxy for $0 AI inference
- [ ] Gemini Flash cheap fallback

### Cloud & Enterprise
- [ ] libSQL/Turso cloud sync
- [ ] PostgreSQL adapter with pgvector
- [ ] BYODB (MySQL, external Postgres)
- [ ] Agent memory with embeddings

---

## Not Started

### DevOps (Phase 16)
- [ ] Dockerfile for production
- [ ] docker-compose with Redis
- [ ] GitHub Actions CI/CD
- [ ] Prometheus metrics + Grafana dashboard

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

| Feature | GLINR | Plane | Linear | Jira |
|---------|-------|-------|--------|------|
| AI-native tickets | Yes | No | No | No |
| AI moves states | Yes | No | No | No |
| Multi-agent routing | Yes | No | No | No |
| Token cost tracking | Yes | No | No | No |
| Multi-platform sync | Yes | Import only | Jira only | No |
| MCP server | Yes | Yes | No | No |
| Open source | Yes | Yes | No | No |
| Self-hostable | Yes | Yes | No | Data Center |
| Lightweight (SQLite) | Yes | No (Postgres) | No | No |

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
