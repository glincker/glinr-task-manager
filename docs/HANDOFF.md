# GLINR Task Manager - Agent Handoff Document

> **Last Updated:** 2026-02-01
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

---

## HIGH Priority Tasks

### 1. SSE Event Stream (Backend)
**Effort: Medium | Files: `src/routes/events.ts`**

```typescript
// GET /api/events (Server-Sent Events)
// Stream: task:created, task:started, task:completed, task:failed
// Replace polling for real-time updates
// Include task summary in event payload
```

---

### 2. Settings API (Backend)
**Effort: Medium | Files: `src/routes/settings.ts`**

```typescript
// GET /api/settings → Current config (secrets masked)
// PATCH /api/settings → Update settings
// Store in SQLite settings table
// Fields: theme, apiKeys (masked), webhookUrls, preferences
```

---

## MEDIUM Priority Tasks

### 3. Mobile Sidebar Drawer
**Effort: Medium | Files: `ui/src/layouts/RootLayout.tsx`**

Responsive sidebar:
```typescript
// On mobile (< 768px):
// - Hide sidebar by default
// - Add hamburger menu in header
// - Sidebar slides in as drawer from left
// - Backdrop closes it
// - Use sheet component from shadcn/ui
```

---

### 4. Export/Import Tasks
**Effort: Small | Files: Backend + UI**

Backup and restore:
```typescript
// Backend:
// - GET /api/tasks/export → JSON file download
// - POST /api/tasks/import → Upload JSON file

// UI:
// - Export button in Settings or Task list header
// - Import with file picker
// - Validation and conflict handling
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

## API Response Types

**Important:** All GET endpoints wrap data in objects:
```typescript
// GET /api/tasks/:id → { task: Task }
// GET /api/summaries/:id → { summary: Summary }
// GET /api/summaries/recent → { summaries: Summary[], count: number }
// GET /api/tasks → { tasks: Task[], count: number }
// GET /api/costs/summary → { totalTokens, totalCost, taskCount }
// GET /api/costs/analytics → { daily[], byModel{}, byAgent{} }
```

## Key Files

| Path | Purpose |
|------|---------|
| `ui/src/index.css` | Liquid Glass Design Tokens |
| `ui/src/layouts/RootLayout.tsx` | Main layout with sidebar + header |
| `ui/src/features/` | Feature modules (tasks, agents, etc) |
| `ui/src/components/ui/` | shadcn/ui base components |
| `ui/src/components/shared/` | Shared components |
| `ui/src/core/api/client.ts` | API client with types |
| `ui/src/router.tsx` | Route definitions |

## Do NOT Modify Without Care

- `ui/src/index.css` - Liquid glass system (add new, don't break existing)
- `src/queue/task-queue.ts` - Core queue logic
- `src/storage/schema.ts` - DB schema (needs migrations)
- `ui/src/core/api/client.ts` - API types are synced with backend
