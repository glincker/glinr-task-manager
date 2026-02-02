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
- [ ] Add unit tests for `src/adapters/openclaw.ts` (target: 80% coverage)
- [ ] Add unit tests for `src/adapters/claude-code.ts` (target: 80% coverage)
- [ ] Add integration tests for webhook handlers (`src/integrations/`)
- [ ] Add e2e test for full task lifecycle (create → queue → process → complete)
- [ ] Set up test coverage reporting with Vitest

### 1.2 Error Handling
- [ ] Implement structured error types in `src/types/errors.ts`
- [ ] Add error boundaries for adapter failures (retry vs fail fast)
- [ ] Add circuit breaker pattern for external API calls
- [ ] Improve DLQ (dead letter queue) with failure categorization

### 1.3 Logging & Observability
- [ ] Add structured logging with correlation IDs
- [ ] Add request/response logging middleware
- [ ] Add task processing metrics (duration, success rate, queue depth)
- [ ] Create health check dashboard endpoint (`/api/health/detailed`)

---

## Phase 2: Source Integrations (Priority: HIGH)

### 2.1 Linear Integration
- [ ] Create `src/integrations/linear.ts` webhook handler
- [ ] Map Linear issue fields to `CreateTaskInput`
- [ ] Add Linear signature verification
- [ ] Add tests for Linear webhook handler
- [ ] Update server.ts to register Linear webhook route

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
- [ ] Create `src/mcp/server.ts` - MCP server implementation
- [ ] Implement `glinr__log_task` tool - Log current work
- [ ] Implement `glinr__complete_task` tool - Mark done with summary
- [ ] Implement `glinr__report_usage` tool - Report token counts
- [ ] Implement `glinr__get_context` tool - Get relevant past tasks
- [ ] Add MCP server to package.json bin for npx usage
- [ ] Document MCP setup in Claude Code settings

### 5.2 Claude Code Hooks (Zero Token)
- [ ] Create `src/hooks/` directory for hook handlers
- [ ] Create `/api/hook/tool-use` endpoint for PostToolUse
- [ ] Create `/api/hook/session-end` endpoint for Stop hook
- [ ] Create `/api/hook/prompt-submit` endpoint for UserPromptSubmit
- [ ] Parse hook payloads and extract summaries
- [ ] Generate example `.claude/settings.json` for users
- [ ] Document hook setup process

### 5.3 External Agent Webhooks
- [ ] Create `/api/webhook/openclaw` endpoint
- [ ] Create `/api/webhook/devin` endpoint (when API available)
- [ ] Create `/api/webhook/generic` for custom agents
- [ ] Verify webhook signatures (HMAC)
- [ ] Parse agent-specific payload formats
- [ ] Extract artifacts (PRs, commits, files changed)

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

---

## Phase 6: Token Cost Management (Priority: HIGH) ⭐ NEW

> **Goal:** Prevent token burn, provide visibility, enable budgeting

### 5.1 Token Tracking
- [ ] Create `src/costs/token-tracker.ts` for unified token counting
- [ ] Track input/output tokens per task
- [ ] Support multiple providers (OpenAI, Anthropic, Google)
- [ ] Store token usage in task result

### 5.2 Cost Calculation
- [ ] Create `src/costs/pricing.ts` with per-model pricing
- [ ] Calculate cost per task in USD
- [ ] Support custom pricing overrides (Azure, enterprise)
- [ ] Add daily/weekly/monthly rollups

### 5.3 Budget Alerts
- [ ] Create `src/costs/budget.ts` for budget management
- [ ] Set budget limits per user/project/team
- [ ] Alert at 50%, 80%, 100% of budget
- [ ] Optional: pause tasks when budget exceeded

### 5.4 Cost Dashboard
- [ ] Add `/api/costs/summary` endpoint
- [ ] Show cost by adapter, task type, time period
- [ ] Show cost per user (when auth enabled)
- [ ] Export cost reports as CSV

---

## Phase 7: Structured Summaries (Priority: HIGH) ⭐ NEW

> **Goal:** Store AI work summaries properly, not random MD files

### 6.1 Summary Schema
- [ ] Create `src/types/summary.ts` with structured summary type
- [ ] Define fields: what changed, why, decisions made, blockers
- [ ] Support markdown content with metadata
- [ ] Add summary validation with Zod

### 6.2 Summary Extraction
- [ ] Create `src/summaries/extractor.ts` to parse agent outputs
- [ ] Extract key decisions and trade-offs
- [ ] Extract file changes with line counts
- [ ] Extract error/warning messages

### 6.3 Summary Storage
- [ ] Store summaries linked to tasks
- [ ] Add full-text search on summaries
- [ ] Add `/api/summaries/search` endpoint
- [ ] Support filtering by date, agent, task type

### 6.4 Summary Templates
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

## Phase 10: Persistence & State (Priority: MEDIUM)

### 9.1 Database Integration
- [ ] Choose database (SQLite for dev, PostgreSQL for prod)
- [ ] Create `src/db/schema.ts` with task/result tables
- [ ] Migrate from in-memory Map to database
- [ ] Add database migrations support
- [ ] Add connection pooling

### 9.2 Task History
- [ ] Store full task execution history
- [ ] Add task search/filter API endpoints
- [ ] Add task analytics (avg duration, success rate by type)
- [ ] Implement task archival for old completed tasks

### 9.3 Agent Memory
- [ ] Create `src/memory/store.ts` for agent context
- [ ] Store relevant task context for follow-up tasks
- [ ] Implement context retrieval for related tasks
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
| Phase 1: Core Stability | In Progress | 30% | HIGH |
| Phase 2: Source Integrations | In Progress | 40% | HIGH |
| Phase 3: Agent Adapters | Not Started | 0% | MEDIUM |
| Phase 4: Smart Routing | Not Started | 0% | MEDIUM |
| Phase 5: MCP Server & Integration | Not Started | 0% | HIGH ⭐⭐ |
| Phase 6: Token Cost Management | Not Started | 0% | HIGH ⭐ |
| Phase 7: Structured Summaries | Not Started | 0% | HIGH ⭐ |
| Phase 8: GitHub Deep Integration | Not Started | 0% | HIGH ⭐ |
| Phase 9: Jira/Linear Sync | Not Started | 0% | MEDIUM |
| Phase 10: Persistence & State | Not Started | 0% | MEDIUM |
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
