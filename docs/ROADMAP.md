# GLINR Task Manager - Vision & Roadmap

> **For AI Agents:** Pick any unchecked item, validate your approach, implement, and submit a PR.
> **Workflow:** Research → Validate → Implement → Verify → PR

---

## Product Vision

### What This IS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   GLINR Task Manager = AI Agent ORCHESTRATOR (not another AI agent)        │
│                                                                             │
│   ┌─────────────┐     ┌─────────────────────────┐     ┌─────────────────┐  │
│   │   GitHub    │     │                         │     │   Claude Code   │  │
│   │   Issues    │────▶│                         │────▶│   OpenClaw      │  │
│   ├─────────────┤     │    GLINR Task Manager   │     │   Gemini        │  │
│   │   Jira      │────▶│                         │────▶│   Ollama        │  │
│   │   Tickets   │     │  • Routes tasks         │     │   Devin         │  │
│   ├─────────────┤     │  • Tracks costs         │     └────────┬────────┘  │
│   │   Linear    │────▶│  • Stores summaries     │              │           │
│   │   Issues    │     │  • Links to PRs         │              ▼           │
│   └─────────────┘     │  • Manages versions     │     ┌─────────────────┐  │
│                       │                         │     │   Artifacts     │  │
│                       └───────────┬─────────────┘     │   • PRs         │  │
│                                   │                   │   • Commits     │  │
│                                   ▼                   │   • Deployments │  │
│                       ┌─────────────────────────┐     │   • Summaries   │  │
│                       │   Developer Dashboard   │     └─────────────────┘  │
│                       │   "What did AI do?"     │                          │
│                       └─────────────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Problem We Solve

| Pain Point | Current State | GLINR Solution |
|------------|---------------|----------------|
| **"What did the AI do?"** | Random MD files, scattered PRs | Unified task view with linked artifacts |
| **Token burn** | No visibility, surprise bills | Cost tracking per task, budget alerts |
| **Multi-agent chaos** | Each agent works in isolation | Coordinated routing, shared context |
| **No accountability** | Can't trace AI decisions | Full audit trail with summaries |
| **Manual version bumps** | Devs do it themselves | Smart semantic versioning |

### What We DON'T Do

- We don't replace AI agents (Claude, OpenClaw, Gemini work as-is)
- We don't compete with IDE copilots (use those for real-time coding)
- We don't try to be another chatbot (we orchestrate, not chat)

### Market Position

```
     ┌──────────────────────────────────────────────────────────────┐
     │                      AI AGENT LANDSCAPE                      │
     ├───────────────────┬──────────────────────┬───────────────────┤
     │   CODING AGENTS   │   ORCHESTRATORS      │   OBSERVABILITY   │
     ├───────────────────┼──────────────────────┼───────────────────┤
     │   Claude Code     │   ★ GLINR ★          │   Langfuse        │
     │   OpenClaw        │   (Developer-centric │   OpenLIT         │
     │   Devin           │    with DevOps       │   Helicone        │
     │   Cursor          │    integration)      │   Traceloop       │
     │   GitHub Copilot  │                      │                   │
     └───────────────────┴──────────────────────┴───────────────────┘
```

---

## Phase 1: Core Stability (Priority: HIGH)

### 1.1 Testing Coverage
- [x] Set up test coverage reporting with Vitest
- [x] Add unit tests for `src/adapters/openclaw.ts` (target: 80% coverage)
- [x] Add unit tests for `src/adapters/claude-code.ts` (target: 80% coverage)
- [x] Add integration tests for webhook handlers (`src/integrations/`)
- [x] Add e2e test for full task lifecycle (create → queue → process → complete)

### 1.2 Error Handling
- [x] Implement structured error types in `src/types/errors.ts`
- [x] Add error boundaries for adapter failures (retry vs fail fast)
- [x] Add circuit breaker pattern for external API calls
- [ ] Improve DLQ (dead letter queue) with failure categorization

### 1.3 Logging & Observability
- [x] Add structured logging with correlation IDs
- [x] Add request/response logging middleware
- [x] Add task processing metrics (duration, success rate, queue depth)
- [x] Create health check dashboard endpoint (`/api/health/detailed`)

---

## Phase 2: Source Integrations (Priority: HIGH)

### 2.1 Linear Integration
- [x] Create `src/integrations/linear.ts` webhook handler
- [x] Map Linear issue fields to `CreateTaskInput`
- [x] Add Linear signature verification
- [x] Add tests for Linear webhook handler
- [x] Update server.ts to register Linear webhook route

### 2.2 Slack Integration
- [ ] Create `src/integrations/slack.ts` for slash commands
- [ ] Implement `/task create` slash command
- [ ] Implement `/task status <id>` slash command
- [ ] Add Slack notification on task completion
- [ ] Add tests for Slack integration

### 2.3 Discord Integration
- [ ] Create `src/integrations/discord.ts` for bot commands
- [ ] Implement `!task create` command
- [ ] Implement `!task status` command
- [ ] Add Discord notification on task completion

---

## Phase 3: Agent Adapters (Priority: MEDIUM)

### 3.1 Gemini Adapter
- [ ] Create `src/adapters/gemini.ts` implementing `AgentAdapter`
- [ ] Add Gemini API client (use Google AI SDK)
- [ ] Map task prompts to Gemini format
- [ ] Handle Gemini-specific response parsing
- [ ] Add tests for Gemini adapter

### 3.2 Local LLM Adapter (Ollama)
- [ ] Create `src/adapters/ollama.ts` implementing `AgentAdapter`
- [ ] Add Ollama REST API client
- [ ] Support model selection (llama, mistral, codellama)
- [ ] Add health check for local Ollama instance
- [ ] Add tests for Ollama adapter

### 3.3 Devin Adapter
- [ ] Research Devin API (if available)
- [ ] Create `src/adapters/devin.ts` implementing `AgentAdapter`
- [ ] Map task types to Devin capabilities
- [ ] Add tests for Devin adapter

---

## Phase 4: Smart Task Routing (Priority: MEDIUM)

### 4.1 Task Classification
- [ ] Create `src/routing/classifier.ts` for task type inference
- [ ] Implement keyword-based classification (code, docs, test, etc.)
- [ ] Add ML-based classification using embeddings (optional)
- [ ] Add confidence scoring for classifications

### 4.2 Adapter Scoring
- [ ] Create `src/routing/scorer.ts` for adapter selection
- [ ] Score adapters based on capability match
- [ ] Score adapters based on historical success rate
- [ ] Score adapters based on current load/availability
- [ ] Implement weighted scoring algorithm

### 4.3 Load Balancing
- [ ] Add adapter capacity tracking
- [ ] Implement round-robin for equal-capability adapters
- [ ] Add queue depth awareness to routing
- [ ] Implement adapter cooldown after failures

---

## Phase 5: MCP Server & Agent Integration (Priority: HIGH) ⭐ CRITICAL

> **Goal:** How agents report to GLINR WITHOUT double-burning tokens

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ZERO-BURN INTEGRATION METHODS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  Claude Code        │────▶│  1. MCP SERVER       │  ~50 tokens/call      │
│  │  (via MCP tools)    │     │  glinr__log_task     │  (structured report)  │
│  └─────────────────────┘     └──────────────────────┘                       │
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  Claude Code        │────▶│  2. HOOKS            │  0 tokens             │
│  │  (PostToolUse)      │     │  Auto-intercept      │  (shell command)      │
│  └─────────────────────┘     └──────────────────────┘                       │
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  OpenClaw/Devin     │────▶│  3. WEBHOOK          │  0 tokens             │
│  │  (HTTP POST)        │     │  POST /api/hook/*    │  (HTTP callback)      │
│  └─────────────────────┘     └──────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 MCP Server (For Claude Code)
- [x] Create `src/mcp/server.ts` - MCP server implementation
- [x] Implement `glinr__log_task` tool - Log current work
- [x] Implement `glinr__complete_task` tool - Mark done with summary
- [x] Implement `glinr__report_usage` tool - Report token counts
- [x] Implement `glinr__get_context` tool - Get relevant past tasks
- [x] Add MCP server to package.json bin for npx usage
- [x] Document MCP setup in Claude Code settings

### 5.2 Claude Code Hooks (Zero Token)
- [x] Create `src/hooks/` directory for hook handlers
- [x] Create `/api/hook/tool-use` endpoint for PostToolUse
- [x] Create `/api/hook/session-end` endpoint for Stop hook
- [x] Create `/api/hook/prompt-submit` endpoint for UserPromptSubmit
- [x] Parse hook payloads and extract summaries
- [x] Generate example `.claude/settings.json` for users
- [x] Document hook setup process

### 5.3 External Agent Webhooks
- [x] Create `/api/webhook/openclaw` endpoint
- [ ] Create `/api/webhook/devin` endpoint (when API available)
- [x] Create `/api/webhook/generic` for custom agents
- [x] Verify webhook signatures (HMAC)
- [x] Parse agent-specific payload formats
- [x] Extract artifacts (PRs, commits, files changed)

### 5.4 Log Parsing (Retrospective)
- [ ] Create `src/parsers/claude-log.ts` for Claude conversation logs
- [ ] Extract tool calls from conversation history
- [ ] Extract file changes from Edit/Write tool outputs
- [ ] Calculate token usage from API responses
- [ ] Generate summary from conversation without re-running AI

### 5.5 Skills/Plugins (Optional)
- [ ] Research Claude Code skills format
- [ ] Create `glinr-track` skill for manual tracking
- [ ] Create `glinr-summary` skill to generate summary on demand
- [ ] Publish skills to community registry

### 5.6 Intelligence Layer (Where "Smartness" Comes From)

> **Goal:** GLINR needs to be smart WITHOUT burning user's tokens

```
┌─────────────────────────────────────────────────────────────────┐
│  INTELLIGENCE ROUTING (tiered, cost-optimized)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hook arrives ──▶ Rules Engine (70% handled, $0)               │
│       │                                                         │
│       │ Complex?                                                │
│       ▼                                                         │
│  Has Ollama? ──▶ Local LLM ($0)                                │
│       │                                                         │
│       │ No                                                      │
│       ▼                                                         │
│  Has Copilot? ──▶ Copilot Proxy ($0, user's subscription)      │
│       │                                                         │
│       │ No                                                      │
│       ▼                                                         │
│  Gemini Flash ──▶ $0.01/task (cheap fallback)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.6.1 Rules Engine (No AI, $0)
- [x] Create `src/intelligence/rules.ts` for pattern-based inference
- [x] Infer task type from file path (`/auth/` → auth, `.test.` → testing)
- [x] Infer action from tool name (Edit → modify, Write → create)
- [x] Extract commit messages from Bash git commands
- [x] Link to GitHub issues via `#123` pattern matching
- [x] Link to PRs via branch name patterns

#### 5.6.2 Local LLM (Ollama, $0)
- [ ] Create `src/intelligence/ollama.ts` for local inference
- [ ] Detect if Ollama is running (`localhost:11434`)
- [ ] Use small model (llama3.2:3b) for summaries
- [ ] Use code model (codellama) for code analysis
- [ ] Cache responses to avoid re-inference

#### 5.6.3 Copilot Proxy (User's Subscription, $0)
- [ ] Create `src/intelligence/copilot.ts` for Copilot integration
- [ ] Check if user has Copilot subscription via GitHub API
- [ ] Integrate with [copilot-api](https://github.com/ericc-ch/copilot-api) or similar
- [ ] Use OpenAI-compatible endpoint for inference
- [ ] Handle token refresh automatically
- [ ] Fallback gracefully if Copilot unavailable

#### 5.6.4 Cheap API Fallback (Gemini Flash)
- [ ] Create `src/intelligence/gemini.ts` for cloud fallback
- [ ] Use Gemini 2.0 Flash ($0.075/1M tokens)
- [ ] Only use when Ollama and Copilot unavailable
- [ ] Rate limit to prevent cost overrun
- [ ] Track usage for cost reporting

#### 5.6.5 Intelligence Router
- [ ] Create `src/intelligence/router.ts` to coordinate
- [ ] Priority: Rules → Ollama → Copilot → Gemini
- [ ] Allow user to configure preference in settings
- [ ] Log which intelligence source was used per task

---

## Phase 6: Token Cost Management (Priority: HIGH) ⭐ NEW

> **Goal:** Prevent token burn, provide visibility, enable budgeting

### 5.1 Token Tracking
- [x] Create `src/costs/token-tracker.ts` for unified token counting
- [x] Track input/output tokens per task
- [x] Support multiple providers (OpenAI, Anthropic, Google)
- [x] Store token usage in task result (via `initTokenTracker` listening to events)

### 5.2 Cost Calculation
- [x] Create `src/costs/pricing.ts` with per-model pricing
- [x] Calculate cost per task in USD
- [x] Support custom pricing overrides (via `PRICING_CONFIG`)
- [x] Add daily/weekly/monthly rollups (tracked in `getUsageSummary`)

### 5.3 Budget Alerts
- [x] Create `src/costs/budget.ts` for budget management
- [x] Set budget limits per user/project/team (currently global limit)
- [x] Alert at 50%, 80%, 100% of budget (logs warning and returns status)
- [ ] Optional: pause tasks when budget exceeded

### 5.4 Cost Dashboard
- [x] Add `/api/costs/summary` endpoint
- [x] Show cost by adapter, task type, time period (aggregated in summary)
- [x] Show cost per user (currently global rollup)
- [x] Export cost reports as CSV (available via API)

---

## Phase 7: Structured Summaries (Priority: HIGH) ⭐ IN PROGRESS

> **Goal:** Store AI work summaries properly, not random MD files

### 7.1 Summary Schema
- [x] Create `src/types/summary.ts` with structured summary type
- [x] Define fields: what changed, why, decisions made, blockers
- [x] Support markdown content with metadata
- [x] Add summary validation with Zod

### 7.2 Summary Extraction
- [x] Create `src/summaries/extractor.ts` to parse agent outputs
- [x] Extract key decisions and trade-offs
- [x] Extract file changes with line counts
- [x] Extract error/warning messages

### 7.3 Summary Storage
- [x] Create `src/summaries/storage.ts` with persistent storage
- [x] Store summaries linked to tasks
- [x] Add full-text search on summaries
- [x] Add `/api/summaries/*` endpoints (list, create, get, delete, search, stats)
- [x] Support filtering by date, agent, task type

### 7.4 Summary Templates
- [ ] Define templates per task type (bug fix, feature, refactor)
- [ ] Auto-generate PR descriptions from summaries
- [ ] Auto-generate changelog entries
- [ ] Support custom templates

---

## Phase 8: GitHub Deep Integration (Priority: HIGH) ⭐ NEW

> **Goal:** OAuth login, link PRs/deployments, smart versioning

### 7.1 GitHub OAuth
- [ ] Create `src/auth/github.ts` for OAuth flow
- [ ] Implement `/auth/github/login` and `/auth/github/callback`
- [ ] Store user GitHub tokens securely
- [ ] Add user session management

### 7.2 Repository Connection
- [ ] Create `src/github/repos.ts` for repo management
- [ ] List user's repos and orgs
- [ ] Install webhooks on selected repos
- [ ] Sync repo metadata (branches, collaborators)

### 7.3 Artifact Linking
- [ ] Create `src/github/artifacts.ts` for PR/deployment links
- [ ] Link tasks to PRs created by AI agents
- [ ] Link tasks to Vercel/Netlify deployments
- [ ] Track deployment status (pending, success, failed)

### 7.4 Semantic Versioning
- [ ] Create `src/versioning/semver.ts` for version management
- [ ] Analyze PR content to suggest version bump (patch/minor/major)
- [ ] Auto-update package.json version (opt-in)
- [ ] Generate CHANGELOG.md entries
- [ ] Support conventional commits analysis

---

## Phase 9: Jira/Linear Sync (Priority: MEDIUM) ⭐ NEW

> **Goal:** Bi-directional sync with project management tools

### 8.1 Jira OAuth
- [ ] Create `src/auth/jira.ts` for Atlassian OAuth
- [ ] Connect to Jira Cloud instances
- [ ] Sync issue metadata (status, assignee, labels)

### 8.2 Linear OAuth
- [ ] Create `src/auth/linear.ts` for Linear OAuth
- [ ] Connect to Linear workspaces
- [ ] Sync issue metadata

### 8.3 Bi-directional Sync
- [ ] Update Jira/Linear when task completes
- [ ] Post summary as comment on issue
- [ ] Link PR to issue automatically
- [ ] Update issue status based on task result

### 8.4 Smart Mapping
- [ ] Map issue labels to task types
- [ ] Map issue priority to task priority
- [ ] Map issue assignee to preferred agent
- [ ] Extract acceptance criteria for validation

---

## Phase 10: Persistence & State (Priority: HIGH) ⭐ REDESIGNED

> **Goal:** Local-first storage with optional cloud sync and AI embeddings
> **Architecture:** See `docs/STORAGE_ARCHITECTURE.md`

```
┌─────────────────────────────────────────────────────────────┐
│                    Storage Tiers                             │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   SQLite    │   libSQL    │  PostgreSQL │   User-Provided   │
│ + sqlite-vec│   (Turso)   │ + pgvector  │   (BYODB)         │
│   [FREE]    │   [HYBRID]  │  [PREMIUM]  │   [ENTERPRISE]    │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

### 10.1 Storage Adapter Interface
- [x] Create `src/storage/adapter.ts` with `StorageAdapter` interface
- [x] Define CRUD operations for all entities (tasks, summaries, sessions)
- [x] Define vector operations (`storeEmbedding`, `searchSimilar`) - interface ready
- [x] Add health check and connection management

### 10.2 libSQL Foundation (Free Tier)
- [x] Add `@libsql/client` and `drizzle-orm` dependencies
- [x] Create `src/storage/schema.ts` with Drizzle schema
- [x] Implement `LibSQLAdapter` using Drizzle
- [x] Add migrations system with `drizzle-kit` (db:generate, db:migrate scripts)
- [x] Migrate in-memory storage to libSQL
- [x] Wire storage into server.ts startup

### 10.3 Vector Search (AI Features)
- [ ] Add `sqlite-vec` extension for embeddings
- [ ] Create embeddings table in schema
- [ ] Implement `storeEmbedding()` for task/summary vectors
- [ ] Implement `searchSimilar()` for semantic search
- [ ] Add `/api/search/semantic` endpoint

### 10.4 Cloud Sync (Premium Tier)
- [ ] Add libSQL/Turso integration
- [ ] Implement sync engine with conflict resolution
- [ ] Add CRDT-based merge strategy
- [ ] Create cloud API endpoints
- [ ] Add offline-first with sync queue

### 10.5 BYODB (Enterprise Tier)
- [ ] Implement PostgreSQL adapter with pgvector
- [ ] Implement MySQL adapter
- [ ] Add connection string validation
- [ ] Add schema migration tools for external DBs

### 10.6 Task History & Analytics
- [ ] Store full task execution history
- [ ] Add task search/filter API endpoints
- [ ] Add task analytics (avg duration, success rate by type)
- [ ] Implement task archival for old completed tasks

### 10.7 Agent Memory
- [ ] Create `src/memory/store.ts` for agent context
- [ ] Store relevant task context for follow-up tasks
- [ ] Implement context retrieval via embedding similarity
- [ ] Add memory cleanup/expiration

---

## Phase 11: Agent Feedback Loop (Priority: MEDIUM) ⭐ NEW

> **Goal:** Send commands to agents, get structured feedback

### 10.1 Command Protocol
- [ ] Create `src/commands/protocol.ts` for agent commands
- [ ] Define command types (run, pause, cancel, clarify)
- [ ] Support command parameters
- [ ] Add command acknowledgment

### 10.2 Feedback Collection
- [ ] Create `src/feedback/collector.ts` for agent feedback
- [ ] Collect progress updates (% complete, current step)
- [ ] Collect blockers and questions
- [ ] Collect confidence scores

### 10.3 Human-in-the-Loop
- [ ] Pause task for human review
- [ ] Request clarification from user
- [ ] Approve/reject AI decisions
- [ ] Resume with additional context

### 10.4 Learning from Feedback
- [ ] Store task outcomes (success, failure, partial)
- [ ] Track which agents perform best for which tasks
- [ ] Adjust routing based on historical performance
- [ ] A/B test different routing strategies

---

## Phase 12: API & Real-time (Priority: LOW)

### 11.1 REST API
- [ ] Add OpenAPI/Swagger documentation
- [ ] Add API versioning (`/api/v1/...`)
- [ ] Add rate limiting middleware
- [ ] Add API key authentication
- [ ] Add request validation with Zod

### 11.2 WebSocket Support
- [ ] Add WebSocket server for real-time updates
- [ ] Implement task progress streaming
- [ ] Add task completion notifications
- [ ] Add queue status updates

### 11.3 GraphQL API (Optional)
- [ ] Evaluate need for GraphQL
- [ ] Create GraphQL schema for tasks/agents
- [ ] Implement resolvers
- [ ] Add subscriptions for real-time updates

---

## Phase 13: UI Dashboard (Priority: LOW)

### 12.1 Basic Dashboard
- [ ] Create simple HTML dashboard at `/dashboard`
- [ ] Show active tasks with status
- [ ] Show agent health status
- [ ] Show queue depth metrics

### 12.2 Task Management UI
- [ ] Add task creation form
- [ ] Add task detail view with full history
- [ ] Add task cancellation button
- [ ] Add manual retry for failed tasks

### 12.3 Cost Dashboard
- [ ] Show token usage over time (chart)
- [ ] Show cost breakdown by agent/model
- [ ] Show budget vs actual spending
- [ ] Export cost reports

### 12.4 Summary Browser
- [ ] List all AI summaries with search
- [ ] Show linked PRs and deployments
- [ ] Show file changes per task
- [ ] Diff view for code changes

---

## Phase 14: DevOps & Deployment (Priority: LOW)

### 13.1 Docker
- [ ] Create `Dockerfile` for production build
- [ ] Create `docker-compose.yml` with Redis
- [ ] Add health check to Docker container
- [ ] Document deployment process

### 13.2 CI/CD
- [ ] Set up GitHub Actions for PR checks
- [ ] Add automated testing on push
- [ ] Add build verification
- [ ] Add automatic deployment (optional)

### 13.3 Monitoring
- [ ] Add Prometheus metrics endpoint
- [ ] Create Grafana dashboard template
- [ ] Add alerting rules for failures
- [ ] Add uptime monitoring

---

## How to Contribute (For AI Agents)

### Picking a Task

1. Choose any unchecked `[ ]` item from above
2. Check that no open PR already addresses it
3. Create a branch: `feat/<task-name>` or `fix/<task-name>`

### Implementation Checklist

```
[ ] Researched approach (Context7, docs, existing code)
[ ] Followed existing patterns in codebase
[ ] Added/updated tests
[ ] Build passes: pnpm build
[ ] Tests pass: pnpm test
[ ] Lint passes: pnpm lint
[ ] PR description explains the change
```

### PR Template

```markdown
## Summary
- What this PR does

## Changes
- List of changes

## Testing
- How to test this

## Research
- Links to docs/resources used

Closes #<issue-number-if-any>
```

---

## Priority Guide

| Priority | Meaning |
|----------|---------|
| **HIGH** | Core functionality, MVP features |
| **MEDIUM** | Important features, can be parallelized |
| **LOW** | Nice to have, do when HIGH/MEDIUM are done |

---

## Current Status

**Last Updated:** 2026-02-01

| Phase | Status | Progress | Priority |
|-------|--------|----------|----------|
| Phase 1: Core Stability | In Progress | 80% | HIGH |
| Phase 2: Source Integrations | In Progress | 60% | HIGH |
| Phase 3: Agent Adapters | Not Started | 0% | MEDIUM |
| Phase 4: Smart Routing | Not Started | 0% | MEDIUM |
| Phase 5: MCP Server & Integration | Complete | 95% | HIGH ⭐⭐ |
| Phase 6: Token Cost Management | Complete | 100% | HIGH ⭐ |
| Phase 7: Structured Summaries | Complete | 100% | HIGH ⭐ |
| Phase 8: GitHub Deep Integration | Not Started | 0% | HIGH ⭐ |
| Phase 9: Jira/Linear Sync | Not Started | 0% | MEDIUM |
| Phase 10: Persistence & State | In Progress | 40% | HIGH ⭐ (Upgraded) |
| Phase 11: Agent Feedback Loop | Not Started | 0% | MEDIUM |
| Phase 12: API & Real-time | Not Started | 0% | LOW |
| Phase 13: UI Dashboard | Not Started | 0% | LOW |
| Phase 14: DevOps | Not Started | 0% | LOW |

---

## MVP Definition

**Minimum Viable Product** = Phases 1 + 2 + 5 + 6 + 7 + 8 (partial)

At MVP:
- ✅ Tasks flow from GitHub/Jira to AI agents
- ✅ **MCP Server** for Claude Code integration (zero-burn tracking)
- ✅ **Hooks** for automatic activity capture
- ✅ Token costs are tracked per task
- ✅ Summaries are stored (not random MD files)
- ✅ PRs are linked to tasks
- ✅ Basic dashboard shows what AI did

---

## Competitive Advantage

| Feature | GLINR | Port.io | LangChain | Langfuse |
|---------|-------|---------|-----------|----------|
| Multi-agent routing | ✅ | ❌ | ✅ | ❌ |
| Token cost tracking | ✅ | ❌ | ❌ | ✅ |
| GitHub OAuth | ✅ | ✅ | ❌ | ❌ |
| PR/Deployment linking | ✅ | ✅ | ❌ | ❌ |
| Structured summaries | ✅ | ❌ | ❌ | ❌ |
| Semantic versioning | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ✅ | ✅ |
| Self-hostable | ✅ | ❌ | ✅ | ✅ |
| Developer-first | ✅ | ❌ | ✅ | ✅ |

---

## Notes for AI Agents

1. **Start with Phase 1, 2, 5, 6, 7** - These are MVP priorities
2. **One task per PR** - Keep PRs focused and atomic
3. **Include tests** - Every new feature needs tests
4. **Follow patterns** - Check existing code before creating new patterns
5. **Document decisions** - Explain why in PR description

**Questions?** Check existing code, read CLAUDE.md, or ask in PR.

---

## Resources

- [Deloitte: AI Agent Orchestration Market](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/ai-agent-orchestration.html)
- [Langfuse: Token Cost Tracking](https://langfuse.com/docs/observability/features/token-and-cost-tracking)
- [CrewAI: Multi-Agent Framework](https://github.com/crewAIInc/crewAI)
- [Port.io: Task Manager AI Agent](https://docs.port.io/guides/all/setup-task-manager-ai-agent/)
