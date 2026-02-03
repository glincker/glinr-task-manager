# GLINR Task Manager - Agent Handoff Document

> **Last Updated:** 2026-02-02
> **For:** Antigravity and other AI agents
> **Design System:** macOS Sequoia Liquid Glass
> **Theme Logic:** Smart System Sync (Remembers Dark/Midnight preference)
> **Speed Mode:** Pick 2-3 tasks and run in parallel!

---

## Quick Start

```bash
# Start both backend + UI together (recommended)
pnpm dev

# Or start separately:
pnpm dev:api    # Backend on :3000
pnpm dev:ui     # UI on :5173
```

### Testing with Ollama (Recommended)

For local testing without burning API tokens:

```bash
# 1. Install & start Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama serve

# 2. Pull a model (in another terminal)
ollama pull llama3.2

# 3. Start GLINR with auto-discovery
AUTO_DISCOVER_AGENTS=true pnpm dev

# 4. Open UI → Gateway (⌘6) → Submit a task!
```

The Ollama adapter will auto-register when Ollama is detected running.

---

## Design System: Liquid Glass

### Core Principles
- **Floating elements** - Nothing touches viewport edges
- **Multi-layer glass** - backdrop-filter: blur + saturate + inner glow
- **Organic curves** - 12-20px radius everywhere (32px for main cards)
- **Depth via shadows** - 4-layer shadow stacks
- **Vibrant colors** - OKLCH with saturation

### CSS Utilities Available
```css
.glass              /* Standard glass panel */
.glass-heavy        /* 40px blur for modals/popovers */
.sidebar-glass      /* Floating sidebar with glow */
.header-glass       /* Top toolbar glass */
.nav-item-active-glass  /* Active nav with primary glow */
.nav-item-hover-glass   /* Subtle hover glass */
.shadow-float       /* Multi-layer floating shadow */
.hover-lift         /* Lift + shadow on hover */
.transition-liquid  /* Smooth 0.3s cubic-bezier */
.skeleton-glass     /* Glass-style skeleton loader */
.skeleton-shimmer   /* Shimmer effect for loaders */
```

---

## Current State

### Completed

| Feature | Status | Files |
|---------|--------|-------|
| Liquid Glass Design System | Done | `ui/src/index.css` |
| Floating Sidebar | Done | `ui/src/layouts/RootLayout.tsx` |
| macOS Toolbar Header | Done | `ui/src/layouts/RootLayout.tsx` |
| Dashboard with Stats | Done | `ui/src/features/dashboard/` |
| Task List + Filters + Search | Done | `ui/src/features/tasks/` |
| Task Detail View | Done | `ui/src/features/tasks/views/TaskDetail.tsx` |
| Task Actions (Cancel/Retry UI) | Done | `ui/src/features/tasks/views/TaskDetail.tsx` |
| Summary Browser | Done | `ui/src/features/summaries/` |
| Agent Status Dashboard | Done | `ui/src/features/agents/` |
| Settings Page | Done | `ui/src/features/settings/` |
| Command Palette (Cmd+K) | Done | `ui/src/components/shared/CommandPalette.tsx` |
| Notification Center | Done | `ui/src/features/notifications/` |
| Smart Theme Sync | Done | `ui/src/core/providers/ThemeProvider.tsx` |
| Loading Skeletons | Done | `ui/src/components/ui/skeleton.tsx` |
| Status Indicators | Done | `ui/src/components/shared/StatusIndicator.tsx` |
| Real-time Polling | Done | TanStack Query refetchInterval (stops on error) |
| Backend Offline UI | Done | Dashboard shows helpful "Backend Not Running" state |
| Concurrent Dev Script | Done | `pnpm dev` runs both API + UI |
| Cost Analytics Dashboard | Done | `ui/src/features/costs/views/CostDashboard.tsx` |
| Webhook Status Panel | Done | `ui/src/features/webhooks/` |
| Dead Letter Queue UI | Done | `ui/src/features/dlq/` |
| Onboarding Tour | Done | `ui/src/components/shared/OnboardingTour.tsx` |
| Integrations API | Done | `GET /api/integrations/status` |
| Summary Detail View | Done | `ui/src/features/summaries/views/SummaryDetail.tsx` |
| Keyboard Shortcuts Modal | Done | `ui/src/components/shared/KeyboardShortcuts.tsx` |
| SSE Event Stream | Done | `src/server.ts`, `ui/src/core/hooks/useEventStream.ts` |
| Mobile Sidebar Drawer | Done | `ui/src/layouts/RootLayout.tsx` |
| Export/Import Tasks | Done | `src/server.ts`, `ui/src/features/settings/views/Settings.tsx` |
| Gateway Dashboard | Done | `ui/src/features/gateway/views/GatewayDashboard.tsx` |
| Gateway Status Panel | Done | Real-time status, metrics, connected agents |
| Gateway Status API | Done | `GET /api/gateway/status` with utilization metrics |
| Ollama Adapter | Done | `src/adapters/ollama.ts` - Local LLM for testing |
| Server Route Modularization | Done | `src/routes/` - 12 route modules |
| Semantic Search API | Done | `src/routes/search.ts` - unified search endpoint |
| Task Analytics API | Done | `GET /api/tasks/analytics` - success rate, duration, breakdowns |
| Task Filtering API | Done | `GET /api/tasks/filter` - advanced multi-field filtering |
| Task Archival API | Done | `POST /api/tasks/archive`, `GET /api/tasks/archived` |
| Task Events API | Done | `GET /api/tasks/:id/events` - audit trail |
| UI API Client Types | Done | TaskAnalytics, TaskFilterParams, TaskEvent types |
| Summary Templates | Done | PR descriptions, changelog, release notes, commit messages |
| **AI-Native Ticket System** | Done | `src/tickets/`, `src/routes/tickets.ts` |
| Ticket Types & Schema | Done | Full Zod schemas, DB tables, external links, comments, history |
| Ticket REST API | Done | CRUD + transitions, comments, links, history endpoints |
| Ticket UI Types | Done | `ui/src/core/api/client.ts` - full type coverage |
| **Sync Engine** | Done | `src/sync/` - Bi-directional sync with external platforms |
| Linear Sync Adapter | Done | `src/sync/adapters/linear.ts` - GraphQL API |
| GitHub Issues Sync Adapter | Done | `src/sync/adapters/github.ts` - REST API |
| Sync YAML Config | Done | `config/settings.yml` - Platform config with env vars |
| **Multi-Model AI Chat** | Done | `src/providers/ai-sdk.ts`, `src/routes/chat.ts` |
| AI Provider System | Done | Vercel AI SDK v6 - Anthropic, OpenAI, Azure, Google, Groq, Ollama |
| Chat REST API | Done | `/api/chat/completions`, `/api/chat/models`, `/api/chat/providers` |
| Chat UI | Done | `ui/src/features/chat/views/ChatView.tsx` |
| Provider Config Dialog | Done | API key setup with health indicators |
| Settings AI Providers | Done | `ui/src/features/settings/views/Settings.tsx` - Full provider management |
| Voice Input | Done | Web Audio recording (transcription pending) |
| Image Upload | Done | Multi-image preview and attachment |
| Centralized Types | Done | `ui/src/core/types/index.ts` - All shared types |
| **Burndown & Velocity Charts** | Done | `ui/src/features/projects/components/BurndownChart.tsx` |
| Sprint Velocity Chart | Done | `ui/src/features/projects/components/VelocityChart.tsx` |
| Stats API (Burndown/Velocity) | Done | `src/routes/stats.ts` - `/api/stats/sprints/:id/burndown` |
| **GitHub Projects Import** | Done | `src/routes/import.ts`, `ui/src/features/projects/components/ImportWizard.tsx` |
| GitHub Projects GraphQL Client | Done | `src/integrations/github-projects.ts` - Projects V2 API |
| GitHub Token Storage | Done | `src/storage/schema.ts` - `github_tokens` table |
| Import Wizard UI | Done | Multi-step modal (Connect → Select → Preview → Configure → Import) |

---

## HIGH Priority Tasks

### 1. CLI Tool (NEW - Phase 14)
**Effort: Large | Files: `src/cli/*`**

CLI tool for shell/terminal control:
```bash
glinr                      # ASCII banner + help
glinr serve                # Start API server
glinr task list            # List tasks
glinr task create "desc"   # Create task
glinr config get           # View settings
glinr config set k v       # Update setting
glinr cost summary         # Cost analytics
```

**Status:** Foundation complete, needs testing and polish.

---

## MEDIUM Priority Tasks

### 2. Notification Preferences
**Effort: Small | Files: Backend + UI**

User preferences for notifications:
```typescript
// Backend:
// - Store notification preferences in settings table
// - Filter notifications based on preferences

// UI:
// - Toggle switches in Settings for each notification type
// - Email notification option (future)
```

---

### 3. Task Templates
**Effort: Medium | Files: Backend + UI**

Pre-defined task templates:
```typescript
// Backend:
// - Store templates in SQLite
// - GET/POST /api/templates endpoints

// UI:
// - Template picker in Create Task modal
// - Template management in Settings
```

---

## Quick Commands

```bash
# Full stack (recommended)
pnpm dev              # Starts API + UI together

# Separate
pnpm dev:api          # Backend on port 3000
pnpm dev:ui           # UI on port 5173

# Build
pnpm build            # Builds both backend + UI

# Tests
pnpm test             # Run backend tests

# Install UI dependency
pnpm --dir ui add <package>
```

## Sync Engine

Bi-directional sync between GLINR tickets and external platforms (Linear, GitHub, Jira, Plane).

### Configuration (config/settings.yml)
```yaml
sync:
  enabled: true  # Enable sync globally
  intervalMs: 60000
  conflictStrategy: latest_wins  # local_wins | remote_wins | latest_wins | manual

  platforms:
    linear:
      enabled: true
      apiKey: "${LINEAR_API_KEY}"
      teamId: "${LINEAR_TEAM_ID}"

    github:
      enabled: true
      accessToken: "${GITHUB_TOKEN}"
      owner: "${GITHUB_OWNER}"
      repo: "${GITHUB_REPO}"
```

### Usage
```typescript
import { initSyncEngine, getSyncEngine } from './sync/index.js';

// Initialize (reads from config/settings.yml)
const engine = await initSyncEngine();

// Push ticket to Linear
await engine.pushTicket(ticket, 'linear');

// Handle webhook
await engine.handleWebhook('github', webhookPayload);
```

### Adapters Available
- `linear` - Linear GraphQL API
- `github` - GitHub Issues REST API
- `jira` - (planned)
- `plane` - (planned)

---

## Multi-Model AI Chat

Universal chat interface connecting to multiple AI providers via Vercel AI SDK.

### Supported Providers
- **Anthropic** - Claude Opus 4.5, Sonnet 4.5, Haiku
- **OpenAI** - GPT-4.1, o1, o3-mini
- **Azure OpenAI** - Enterprise OpenAI deployments
- **Google** - Gemini 2.5 Pro, Flash
- **Groq** - Ultra-fast inference (Llama 3.3, Mixtral)
- **Ollama** - Local models (llama3.2, deepseek-r1, etc.)
- **OpenRouter** - 100+ models via one API

### Configuration

```bash
# Set API keys via environment
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_RESOURCE_NAME=my-resource
export GOOGLE_API_KEY=AIza...
export GROQ_API_KEY=gsk_...
export OLLAMA_BASE_URL=http://localhost:11434

# Or configure via UI
# Settings → AI Providers → Configure each provider
# Or Chat → Key icon → Quick provider setup
```

### Chat API Endpoints
```bash
POST /api/chat/completions  # Chat with any model
GET  /api/chat/models       # List models and aliases
GET  /api/chat/providers    # Provider health status
POST /api/chat/providers/:type/configure  # Save API key
POST /api/chat/quick        # Quick single-message chat
```

### Model Aliases
```typescript
opus    → anthropic/claude-opus-4-5
sonnet  → anthropic/claude-sonnet-4-5
gpt     → openai/gpt-4.5-turbo
gemini  → google/gemini-2.5-pro
local   → ollama/llama3.2
```

### UI Features
- **Provider Status** - Green/red indicators per provider
- **Smart Defaults** - Auto-selects first healthy provider
- **Voice Input** - Microphone recording (transcription coming)
- **Image Upload** - Attach images to messages
- **Token Tracking** - Usage and cost per message

---

## Gateway System

The gateway provides unified task routing with scoring-based agent selection.

### Gateway Endpoints
```bash
GET  /api/gateway/status      # Status, metrics, connected agents
GET  /api/gateway/agents      # Available agents with health
GET  /api/gateway/workflows   # Workflow templates
GET  /api/gateway/config      # Current config
POST /api/gateway/execute     # Execute task through gateway
```

### Ollama (Local Testing)
```bash
# Start Ollama
ollama serve

# Pull a model
ollama pull llama3.2

# Set environment (optional)
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=llama3.2
```

The Ollama adapter enables local testing without burning API tokens.

---

## API Response Types

**Important:** All GET endpoints wrap data in objects:
```typescript
// GET /api/tasks/:id → { task: Task }
// GET /api/summaries/:id → { summary: Summary }
// GET /api/summaries/recent → { summaries: Summary[], count: number }
// GET /api/tasks → { tasks: Task[], count: number }
// GET /api/costs/summary → { totalTokens, totalCost, taskCount }
// GET /api/costs/analytics → { daily[], byModel{}, byAgent{} }
// GET /api/gateway/status → { status, agents, metrics, history }
// GET /api/search/semantic?q=query → { tasks[], summaries[], totalResults }
// GET /api/search/text?q=query → { tasks[], summaries[], totalResults }
// GET /api/search/capabilities → { textSearch, semanticSearch, embeddingProvider }
// GET /api/tasks/analytics → { totalTasks, successRate, avgDurationMs, byStatus{}, byAgent{}, daily[] }
// GET /api/tasks/filter?status=X&priority=X → { tasks[], total, limit, offset }
// GET /api/tasks/:id/events → { taskId, events[], count }
// GET /api/tasks/archived → { tasks[], total, limit, offset }
// POST /api/tasks/archive { olderThanDays: 30 } → { message, archived }
// GET /api/summaries/:id/pr-description → { id, title, description }
// GET /api/summaries/:id/commit-message → { id, message }
// GET /api/summaries/changelog?version=X → { version, format, count, changelog }
// GET /api/summaries/release-notes?version=X → { version, count, notes }
// GET /api/summaries/templates → { templates, categories }

// === TICKET SYSTEM ===
// GET /api/tickets → { tickets[], total, limit, offset }
// POST /api/tickets → { message, ticket }
// GET /api/tickets/:id → { ticket }
// GET /api/tickets/:id?include=all → { ticket } (with relations)
// PATCH /api/tickets/:id → { message, ticket }
// DELETE /api/tickets/:id → { message }
// POST /api/tickets/:id/transition → { message, ticket }
// POST /api/tickets/:id/assign-agent → { message, ticket }
// GET /api/tickets/:id/comments → { ticketId, comments[], count }
// POST /api/tickets/:id/comments → { message, comment }
// GET /api/tickets/:id/links → { ticketId, links[], count }
// POST /api/tickets/:id/links → { message, link }
// GET /api/tickets/:id/history → { ticketId, history[], count }

// === CHAT SYSTEM ===
// POST /api/chat/completions → { id, provider, model, message, finishReason, usage, duration }
// GET /api/chat/models → { models[], aliases[] }
// GET /api/chat/providers → { default, providers[] }
// POST /api/chat/providers/:type/configure → { success, message }
// POST /api/chat/providers/:type/health → { provider, healthy, message, latencyMs }
// POST /api/chat/quick → { content, model, provider, usage }

// === GITHUB IMPORT ===
// POST /api/import/github/validate-token → { valid, username, stored }
// GET /api/import/github/status → { hasToken, connected, username }
// GET /api/import/github/projects → { projects[], count }
// GET /api/import/github/projects/:id/preview → { project, iterations[], items[], fieldMappings }
// POST /api/import/github/projects/:id/execute → { project, summary, tickets[] }
// DELETE /api/import/github/disconnect → { success, message }

// === STATS (Burndown/Velocity) ===
// GET /api/stats/sprints/:id/burndown → { sprint, totalPoints, ticketCount, completedPoints, burndown[] }
// GET /api/stats/projects/:id/velocity → { projectId, sprints[], averageVelocity, sprintCount }
// GET /api/stats/projects/:id → { tickets{}, sprints{} }
```

## Key Files

| Path | Purpose |
|------|---------|
| `ui/src/index.css` | Liquid Glass Design Tokens |
| `ui/src/layouts/RootLayout.tsx` | Main layout with sidebar + header |
| `ui/src/features/` | Feature modules (tasks, agents, chat, etc) |
| `ui/src/features/chat/views/ChatView.tsx` | Multi-model AI Chat UI |
| `ui/src/components/ui/` | shadcn/ui base components |
| `ui/src/components/shared/` | Shared components |
| `ui/src/core/api/client.ts` | API client (re-exports types) |
| `ui/src/core/types/index.ts` | **Centralized type definitions** |
| `ui/src/router.tsx` | Route definitions |
| `src/providers/ai-sdk.ts` | AI Provider System (Vercel AI SDK) |
| `src/routes/chat.ts` | Chat REST API endpoints |
| `src/routes/import.ts` | GitHub Import API endpoints |
| `src/routes/stats.ts` | Burndown and Velocity API endpoints |
| `src/integrations/github-projects.ts` | GitHub Projects V2 GraphQL client |
| `ui/src/features/projects/components/ImportWizard.tsx` | Multi-step import wizard |
| `ui/src/features/projects/components/BurndownChart.tsx` | Sprint burndown chart |
| `ui/src/features/projects/components/VelocityChart.tsx` | Project velocity chart |

## GitHub Projects Import

Import projects from GitHub Projects V2 into GLINR with full sprint and ticket migration.

### How to Use

1. Navigate to **Projects** (⌘3)
2. Click **Import** button
3. Follow the wizard:
   - **Step 1:** Enter your GitHub Personal Access Token (with `read:project` and `repo` scopes)
   - **Step 2:** Select a GitHub Project V2 from your account
   - **Step 3:** Preview items and iterations, review field mappings
   - **Step 4:** Configure GLINR project (key, name, icon, color)
   - **Step 5:** Execute import and view results

### Import API Endpoints

```bash
POST /api/import/github/validate-token  # Validate and store PAT
GET  /api/import/github/status          # Check if connected
GET  /api/import/github/projects        # List GitHub Projects V2
GET  /api/import/github/projects/:id/preview  # Preview items/iterations
POST /api/import/github/projects/:id/execute  # Run import
DELETE /api/import/github/disconnect    # Remove stored token
```

### What Gets Imported

- **Project** → GLINR Project with custom key prefix
- **Iterations** → GLINR Sprints with dates
- **Issues** → GLINR Tickets with mapped status/priority/type
- **Labels** → Preserved on tickets
- **Assignees** → First assignee mapped to ticket

### Field Mappings

| GitHub Status | GLINR Status |
|--------------|--------------|
| Todo, To Do, Backlog | backlog |
| In Progress | in_progress |
| In Review | in_review |
| Done, Closed | done |

---

## Do NOT Modify Without Care

- `ui/src/index.css` - Liquid glass system (add new, don't break existing)
- `src/queue/task-queue.ts` - Core queue logic
- `src/storage/schema.ts` - DB schema (needs migrations)
- `ui/src/core/api/client.ts` - API types are synced with backend
