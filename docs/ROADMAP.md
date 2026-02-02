# GLINR Task Manager - Roadmap & Checklist

> **For AI Agents:** Pick any unchecked item, validate your approach, implement, and submit a PR.
> **Workflow:** Research → Validate → Implement → Verify → PR

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

## Phase 2: New Integrations (Priority: HIGH)

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

## Phase 3: New Adapters (Priority: MEDIUM)

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

## Phase 5: Persistence & State (Priority: MEDIUM)

### 5.1 Database Integration
- [ ] Choose database (SQLite for dev, PostgreSQL for prod)
- [ ] Create `src/db/schema.ts` with task/result tables
- [ ] Migrate from in-memory Map to database
- [ ] Add database migrations support
- [ ] Add connection pooling

### 5.2 Task History
- [ ] Store full task execution history
- [ ] Add task search/filter API endpoints
- [ ] Add task analytics (avg duration, success rate by type)
- [ ] Implement task archival for old completed tasks

### 5.3 Agent Memory
- [ ] Create `src/memory/store.ts` for agent context
- [ ] Store relevant task context for follow-up tasks
- [ ] Implement context retrieval for related tasks
- [ ] Add memory cleanup/expiration

---

## Phase 6: API Enhancements (Priority: LOW)

### 6.1 REST API
- [ ] Add OpenAPI/Swagger documentation
- [ ] Add API versioning (`/api/v1/...`)
- [ ] Add rate limiting middleware
- [ ] Add API key authentication
- [ ] Add request validation with Zod

### 6.2 WebSocket Support
- [ ] Add WebSocket server for real-time updates
- [ ] Implement task progress streaming
- [ ] Add task completion notifications
- [ ] Add queue status updates

### 6.3 GraphQL API (Optional)
- [ ] Evaluate need for GraphQL
- [ ] Create GraphQL schema for tasks/agents
- [ ] Implement resolvers
- [ ] Add subscriptions for real-time updates

---

## Phase 7: UI Dashboard (Priority: LOW)

### 7.1 Basic Dashboard
- [ ] Create simple HTML dashboard at `/dashboard`
- [ ] Show active tasks with status
- [ ] Show agent health status
- [ ] Show queue depth metrics

### 7.2 Task Management UI
- [ ] Add task creation form
- [ ] Add task detail view
- [ ] Add task cancellation button
- [ ] Add manual retry for failed tasks

### 7.3 Analytics Dashboard
- [ ] Show task completion trends
- [ ] Show adapter performance comparison
- [ ] Show error rate trends
- [ ] Export reports as CSV

---

## Phase 8: DevOps & Deployment (Priority: LOW)

### 8.1 Docker
- [ ] Create `Dockerfile` for production build
- [ ] Create `docker-compose.yml` with Redis
- [ ] Add health check to Docker container
- [ ] Document deployment process

### 8.2 CI/CD
- [ ] Set up GitHub Actions for PR checks
- [ ] Add automated testing on push
- [ ] Add build verification
- [ ] Add automatic deployment (optional)

### 8.3 Monitoring
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
| **HIGH** | Core functionality, should be done first |
| **MEDIUM** | Important features, can be parallelized |
| **LOW** | Nice to have, do when HIGH/MEDIUM are done |

---

## Current Status

**Last Updated:** 2026-02-01

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Core Stability | In Progress | 30% |
| Phase 2: New Integrations | In Progress | 40% |
| Phase 3: New Adapters | Not Started | 0% |
| Phase 4: Smart Routing | Not Started | 0% |
| Phase 5: Persistence | Not Started | 0% |
| Phase 6: API Enhancements | Not Started | 0% |
| Phase 7: UI Dashboard | Not Started | 0% |
| Phase 8: DevOps | Not Started | 0% |

---

## Notes for AI Agents

1. **Start with Phase 1 & 2** - These are highest priority
2. **One task per PR** - Keep PRs focused and atomic
3. **Include tests** - Every new feature needs tests
4. **Follow patterns** - Check existing code before creating new patterns
5. **Document decisions** - Explain why in PR description

**Questions?** Check existing code, read CLAUDE.md, or ask in PR.
