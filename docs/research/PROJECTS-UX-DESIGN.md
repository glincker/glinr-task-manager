# Projects & Enhanced UX Design

> **Status:** Planning
> **Created:** 2026-02-02
> **Goal:** Transform GLINR into a multi-project, JIRA-like experience

---

## Overview

Enhance the ticket management system with:
1. **Projects & Workspaces** - Multi-project support with custom prefixes
2. **Rich Dashboard** - Recharts analytics, velocity tracking, burndowns
3. **Integration Visibility** - Show connected GitHub/Linear/Jira sources
4. **JIRA-like Views** - Kanban board, list view, calendar, roadmap
5. **Smart Filtering** - By project, assignee, labels, sprints

---

## Phase 1: Projects Foundation

### Data Model

```typescript
// src/projects/types.ts
interface Project {
  id: string;
  key: string;           // e.g., "GLINR", "MOBILE", "API" (used for ticket prefix)
  name: string;          // "GLINR Task Manager"
  description?: string;
  icon?: string;         // emoji or icon name
  color?: string;        // theme color for the project

  // Repository links
  repositories: RepositoryLink[];

  // Defaults
  defaultAssignee?: string;
  defaultAgent?: string;
  defaultLabels?: string[];

  // Settings
  settings: ProjectSettings;

  // Metadata
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

interface RepositoryLink {
  id: string;
  platform: 'github' | 'gitlab' | 'bitbucket';
  owner: string;
  repo: string;
  defaultBranch: string;
  syncEnabled: boolean;
}

interface ProjectSettings {
  ticketTypes: TicketType[];       // Enabled ticket types
  priorities: TicketPriority[];    // Enabled priorities
  statuses: StatusConfig[];        // Custom status workflow
  autoAssign: boolean;
  aiEnabled: boolean;
}

interface StatusConfig {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done';
  color: string;
  order: number;
}
```

### Database Schema

```sql
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,          -- Ticket prefix like "GLINR"
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#6366f1',
  default_assignee TEXT,
  default_agent TEXT,
  default_labels TEXT,               -- JSON array
  settings TEXT NOT NULL,            -- JSON ProjectSettings
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

-- Repository links
CREATE TABLE IF NOT EXISTS project_repositories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  platform TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  default_branch TEXT DEFAULT 'main',
  sync_enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- Modify tickets table
ALTER TABLE tickets ADD COLUMN project_id TEXT REFERENCES projects(id);
CREATE INDEX idx_tickets_project ON tickets(project_id);
```

### API Endpoints

```
GET    /api/projects                  # List all projects
POST   /api/projects                  # Create project
GET    /api/projects/:id              # Get project details
PATCH  /api/projects/:id              # Update project
DELETE /api/projects/:id              # Archive project
GET    /api/projects/:id/stats        # Project statistics
GET    /api/projects/:id/tickets      # Tickets in project
POST   /api/projects/:id/repositories # Link repository
DELETE /api/projects/:id/repositories/:repoId
```

---

## Phase 2: Dashboard Analytics

### Dashboard Components

```
┌─────────────────────────────────────────────────────────────────────┐
│  GLINR Dashboard                                    [Project ▾] [+] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ Open Tickets │ │ In Progress  │ │ Completed    │ │ Velocity    ││
│  │     42       │ │     12       │ │     156      │ │   8.5/wk    ││
│  │   ▲ 12%      │ │   ▼ 3%       │ │   ▲ 23%      │ │   ▲ 15%     ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘│
│                                                                     │
│  ┌─────────────────────────────────┐ ┌─────────────────────────────┐│
│  │ Ticket Velocity (Last 30 days) │ │ By Type                     ││
│  │  ▄▄▄▄                          │ │    ● Bugs      38%          ││
│  │ ▄████▄                         │ │    ● Features  42%          ││
│  │▄██████▄▄▄▄▄▄▄▄▄               │ │    ● Tasks    20%           ││
│  └─────────────────────────────────┘ └─────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────┐ ┌─────────────────────────────┐│
│  │ Burndown Chart                  │ │ Recent Activity             ││
│  │  \                              │ │ • GLINR-42 status → done    ││
│  │   \    ___                      │ │ • MOBILE-15 created         ││
│  │    \__/   \___                  │ │ • API-8 assigned to AI      ││
│  │              \___               │ │ • GLINR-41 PR merged        ││
│  └─────────────────────────────────┘ └─────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Connected Integrations                                          ││
│  │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐ ││
│  │ │  GitHub   │ │  Linear   │ │   Jira    │ │ + Add Integration │ ││
│  │ │ 3 repos   │ │ 1 team    │ │ Disabled  │ │                   │ ││
│  │ │ ● Active  │ │ ● Active  │ │ ○ Setup   │ │                   │ ││
│  │ └───────────┘ └───────────┘ └───────────┘ └───────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Recharts Implementation

```tsx
// ui/src/features/dashboard/components/VelocityChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VelocityData {
  date: string;
  created: number;
  completed: number;
}

export function VelocityChart({ data }: { data: VelocityData[] }) {
  return (
    <div className="glass rounded-[20px] p-4">
      <h3 className="text-sm font-semibold mb-4">Ticket Velocity</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} />
          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
          <Tooltip
            contentStyle={{
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px'
            }}
          />
          <Area type="monotone" dataKey="created" stroke="#6366f1" fill="url(#colorCreated)" />
          <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#colorCompleted)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Statistics API

```typescript
// GET /api/projects/:id/stats
interface ProjectStats {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    done: number;
    byType: Record<TicketType, number>;
    byPriority: Record<TicketPriority, number>;
  };
  velocity: {
    daily: VelocityPoint[];   // Last 30 days
    weekly: VelocityPoint[];  // Last 12 weeks
    average: number;          // Tickets per week
    trend: number;            // % change vs previous period
  };
  agents: {
    assigned: number;
    completed: number;
    avgCompletionTime: number;
  };
  integrations: {
    github: { repos: number; prs: number; commits: number };
    linear: { issues: number; synced: number };
    jira: { issues: number; synced: number };
  };
}
```

---

## Phase 3: JIRA-like Views

### View Types

1. **List View** (current, enhanced)
   - Sortable columns
   - Inline editing
   - Bulk actions
   - Saved filters

2. **Kanban Board**
   - Drag-and-drop status changes
   - Swimlanes by assignee/type/priority
   - WIP limits
   - Quick create in column

3. **Calendar View**
   - Due dates visualization
   - Sprint planning
   - Drag to reschedule

4. **Roadmap/Timeline**
   - Gantt-style view
   - Dependency visualization
   - Milestone tracking

### Kanban Board Design

```
┌─────────────────────────────────────────────────────────────────────┐
│  Board: GLINR  [Filter ▾] [Group by: None ▾] [View: ≡ ▦ 📅 📊]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Backlog (8) │ │ Todo (4)    │ │ In Progress │ │ Done ✓      │   │
│  │             │ │             │ │ (2/3)       │ │             │   │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤   │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │   │
│  │ │GLINR-42 │ │ │ │GLINR-38 │ │ │ │GLINR-35 │ │ │ │GLINR-30 │ │   │
│  │ │Auth bug │ │ │ │Add dark │ │ │ │Dashboard│ │ │ │Login    │ │   │
│  │ │🐛 High  │ │ │ │mode     │ │ │ │charts   │ │ │ │feature  │ │   │
│  │ │👤 @ai   │ │ │ │✨ Medium│ │ │ │✨ High  │ │ │ │✨ Done  │ │   │
│  │ └─────────┘ │ │ └─────────┘ │ │ │🤖 Claude│ │ │ └─────────┘ │   │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ └─────────┘ │ │ ┌─────────┐ │   │
│  │ │GLINR-41 │ │ │ │GLINR-37 │ │ │ ┌─────────┐ │ │ │GLINR-29 │ │   │
│  │ │API perf │ │ │ │Export   │ │ │ │GLINR-34 │ │ │ │Settings │ │   │
│  │ │⚡ Medium│ │ │ │feature  │ │ │ │Webhooks │ │ │ │page     │ │   │
│  │ └─────────┘ │ │ └─────────┘ │ │ │📋 Medium│ │ │ └─────────┘ │   │
│  │             │ │             │ │ └─────────┘ │ │             │   │
│  │ + Add ticket│ │ + Add ticket│ │             │ │             │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### View Components Structure

```
ui/src/features/tickets/
├── views/
│   ├── TicketList.tsx          # Enhanced list view
│   ├── TicketBoard.tsx         # Kanban board
│   ├── TicketCalendar.tsx      # Calendar view
│   ├── TicketRoadmap.tsx       # Timeline/Gantt
│   └── TicketDetail.tsx        # Detail panel/modal
├── components/
│   ├── BoardColumn.tsx         # Kanban column
│   ├── BoardCard.tsx           # Draggable ticket card
│   ├── TicketFilters.tsx       # Filter bar
│   ├── ViewSwitcher.tsx        # View toggle buttons
│   ├── BulkActions.tsx         # Multi-select actions
│   └── QuickCreate.tsx         # Inline ticket create
└── hooks/
    ├── useTicketDrag.ts        # DnD logic
    ├── useTicketFilters.ts     # Filter state
    └── useSavedViews.ts        # Saved filter presets
```

---

## Phase 4: Integration Visibility

### Settings Integration Panel

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Integrations                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Source Control                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ┌───┐                                                           ││
│  │ │ ◉ │ GitHub                                          Connected ││
│  │ └───┘ 3 repositories synced                                     ││
│  │       Last sync: 2 minutes ago                      [Configure] ││
│  │                                                                 ││
│  │       Repositories:                                             ││
│  │       • GLINCKER/glinr-backend      → Project: GLINR           ││
│  │       • GLINCKER/glinr-mobile       → Project: MOBILE          ││
│  │       • GLINCKER/glinr-docs         → Project: DOCS            ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  Issue Tracking                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ┌───┐                                                           ││
│  │ │ ◉ │ Linear                                          Connected ││
│  │ └───┘ Team: GLINR Engineering                                   ││
│  │       Bi-directional sync enabled               [Configure]     ││
│  │                                                                 ││
│  │ ┌───┐                                                           ││
│  │ │ ○ │ Jira                                        Not Connected ││
│  │ └───┘ Connect to sync Jira issues                    [Connect]  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  AI Providers                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ┌───┐                                                           ││
│  │ │ ◉ │ Ollama (Local)                                     Active ││
│  │ └───┘ Model: llama3.2 • localhost:11434                         ││
│  │       Used for: Categorization, Suggestions, Responses          ││
│  │                                                     [Configure] ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Integration Status API

```typescript
// GET /api/integrations/status
interface IntegrationStatus {
  github: {
    connected: boolean;
    repositories: Array<{
      owner: string;
      repo: string;
      projectId: string;
      projectKey: string;
      lastSync: string;
      syncStatus: 'active' | 'error' | 'paused';
    }>;
    webhookActive: boolean;
  };
  linear: {
    connected: boolean;
    team: string;
    syncDirection: 'inbound' | 'outbound' | 'bidirectional';
    lastSync: string;
  };
  jira: {
    connected: boolean;
    project?: string;
    lastSync?: string;
  };
  ai: {
    provider: string;
    model: string;
    available: boolean;
    features: string[];
  };
}
```

---

## Phase 5: Enhanced Filtering & Grouping

### Filter Bar Design

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Project ▾] [Status ▾] [Type ▾] [Priority ▾] [Assignee ▾] [Labels] │
│ [+ Add filter]                              [Save view] [Clear all] │
├─────────────────────────────────────────────────────────────────────┤
│ Active filters: Project = GLINR • Status = Open • Priority = High  │
│                                                      [x] Clear      │
└─────────────────────────────────────────────────────────────────────┘
```

### Saved Views

```typescript
interface SavedView {
  id: string;
  name: string;
  projectId?: string;  // null = all projects
  filters: TicketFilters;
  sort: { field: string; direction: 'asc' | 'desc' };
  viewType: 'list' | 'board' | 'calendar' | 'roadmap';
  columns?: string[];  // For list view
  groupBy?: string;    // For board swimlanes
  isDefault: boolean;
  isShared: boolean;
  createdBy: string;
}
```

### Quick Filter Presets

- **My Tickets** - Assigned to current user
- **High Priority** - Critical + High priority open tickets
- **Recently Updated** - Updated in last 24 hours
- **Blocked** - Tickets with blockers
- **AI Assigned** - Tickets assigned to AI agents
- **Ready for Review** - PR linked, needs review

---

## Implementation Phases

### Phase 1: Projects (Week 1)
1. Database schema for projects
2. Projects API endpoints
3. Projects CRUD UI
4. Link tickets to projects
5. Custom ticket prefixes

### Phase 2: Dashboard (Week 2)
1. Install Recharts: `pnpm add recharts`
2. Statistics API endpoints
3. Velocity chart component
4. Distribution pie/bar charts
5. Activity feed component
6. Integration status cards

### Phase 3: Kanban Board (Week 3)
1. Install dnd-kit: `pnpm add @dnd-kit/core @dnd-kit/sortable`
2. Board layout component
3. Draggable card component
4. Drop zones with status update
5. Swimlane grouping
6. WIP limit indicators

### Phase 4: Enhanced List & Filters (Week 4)
1. Advanced filter components
2. Saved views storage
3. Bulk selection & actions
4. Inline editing
5. Column customization

### Phase 5: Calendar & Roadmap (Week 5)
1. Install date-fns & calendar lib
2. Calendar view with due dates
3. Roadmap/timeline view
4. Sprint management (optional)

---

## Technical Decisions

### State Management
- **TanStack Query** for server state (tickets, projects)
- **Zustand** for UI state (filters, view preferences)
- **URL params** for shareable filter states

### Drag and Drop
- **@dnd-kit** (modern, accessible, performant)
- Supports touch, keyboard, screen readers
- Tree sorting for nested items

### Charts
- **Recharts** (React-native, composable)
- Custom glass-morphism styling
- Responsive containers

### Database
- Projects table with JSON settings
- Indexes on project_id, status, priority
- Materialized views for stats (optional)

---

## Questions to Decide

1. **Multi-tenancy?** - Single workspace or multiple?
2. **Sprints?** - Do we need sprint planning?
3. **Time tracking?** - Log time on tickets?
4. **Automations?** - Auto-transitions, auto-assign rules?
5. **Notifications?** - Email/Slack for ticket updates?

---

## Next Steps

1. Get user feedback on priorities
2. Create wireframes for key screens
3. Start with Projects foundation
4. Iterate based on usage

