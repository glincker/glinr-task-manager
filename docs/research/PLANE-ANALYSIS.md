# Plane Reference Analysis

> **Repo:** `/Users/gdsks/G-Development/GLINR-V3/plane-reference`
> **Analysis Date:** 2026-02-02

---

## Project Structure

```
plane-reference/
├── apps/
│   ├── api/          # Django backend (Python)
│   ├── web/          # Next.js frontend
│   ├── admin/        # Admin panel
│   ├── space/        # Public spaces
│   └── live/         # Real-time features
├── packages/
│   ├── types/        # TypeScript types (shared)
│   ├── ui/           # UI component library
│   ├── editor/       # Rich text editor
│   ├── services/     # API client services
│   └── hooks/        # React hooks
└── deployments/
    ├── kubernetes/
    ├── docker/
    └── cli/
```

---

## Key Learnings

### 1. Issue Schema (TBaseIssue)

Plane's core issue type from `packages/types/src/issues/issue.ts`:

```typescript
type TBaseIssue = {
  // Identity
  id: string;
  sequence_id: number;          // Human-readable: PROJ-123
  name: string;                 // Title
  sort_order: number;

  // Classification
  state_id: string | null;      // Status (linked to states table)
  priority: TIssuePriorities;   // 'urgent' | 'high' | 'medium' | 'low' | 'none'
  label_ids: string[];
  type_id: string | null;       // Issue type (bug, feature, etc.)

  // Assignment
  assignee_ids: string[];

  // Relationships
  project_id: string | null;
  parent_id: string | null;     // Sub-issues
  cycle_id: string | null;      // Sprint
  module_ids: string[];         // Feature groups

  // Counts (denormalized for performance)
  sub_issues_count: number;
  attachment_count: number;
  link_count: number;

  // Dates
  created_at: string;
  updated_at: string;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  archived_at: string | null;

  // Audit
  created_by: string;
  updated_by: string;

  // Flags
  is_draft: boolean;
  is_epic: boolean;
  is_intake: boolean;           // Triage queue
};
```

### 2. Extended Issue (TIssue)

```typescript
type TIssue = TBaseIssue & {
  description_html?: string;    // Rich text content
  is_subscribed?: boolean;      // Notification subscription
  parent?: Partial<TBaseIssue>; // Expanded parent data
  issue_reactions?: TIssueReaction[];
  issue_attachments?: TIssueAttachment[];
  issue_link?: TIssueLink[];    // External links
  issue_relation?: IssueRelation[];
  issue_related?: IssueRelation[];
};
```

### 3. Activity/History Tracking

```typescript
interface IIssueActivity {
  actor: string;
  actor_detail: IUserLite;
  field: string | null;         // Which field changed
  old_value: string | null;
  new_value: string | null;
  old_identifier: string | null; // For relations
  new_identifier: string | null;
  verb: string;                 // created, updated, deleted
  comment?: string;
  comment_html?: string;
  created_at: Date;
}
```

### 4. Priority Enum

```typescript
type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";
```

### 5. Layout Types

```typescript
enum EIssueLayoutTypes {
  LIST = "list",
  KANBAN = "kanban",
  CALENDAR = "calendar",
  GANTT = "gantt_chart",
  SPREADSHEET = "spreadsheet",
}
```

---

## What We Should Copy

| Feature | Plane Pattern | GLINR Adaptation |
|---------|---------------|------------------|
| `sequence_id` | Auto-increment per project | Same - GLINR-1, GLINR-2 |
| `sort_order` | Float for drag-drop | Same |
| `state_id` → states table | Flexible status machine | Same |
| `label_ids[]` | Many-to-many | Same |
| `assignee_ids[]` | Multiple assignees | Add `assignee_agent` for AI |
| `sub_issues_count` | Denormalized count | Good for performance |
| `is_draft` flag | Draft mode | Useful for AI WIP |
| Activity tracking | Field-level history | Essential for sync |

---

## What We Should NOT Copy

| Feature | Why Skip |
|---------|----------|
| `cycle_id` (sprints) | Too PM-heavy for v1 |
| `module_ids` | Too PM-heavy for v1 |
| Gantt/Calendar views | Too complex for v1 |
| Complex inbox/intake | Start simple |
| Django/Python backend | We're TypeScript |

---

## What We Should Improve On

| Plane | GLINR Improvement |
|-------|-------------------|
| Human creates issues | AI creates issues |
| Human moves states | AI moves states (with approval) |
| No AI agent tracking | `created_by_agent`, `ai_session_id` |
| One-way Jira import | Bi-directional sync |
| No external_source in schema | Add `external_links[]` table |
| No AI comment response | AI auto-responds to comments |

---

## GLINR Simplified Schema

Based on Plane analysis, our lean version:

```typescript
// Much simpler than Plane, but compatible

interface GlinrTicket {
  // Core (from Plane)
  id: string;
  sequence: number;              // GLINR-123
  title: string;
  description: string;
  descriptionHtml: string;

  // Classification (from Plane)
  status: string;                // References states table
  priority: 'critical' | 'high' | 'medium' | 'low' | 'none';
  type: 'task' | 'bug' | 'feature' | 'epic';
  labelIds: string[];

  // Assignment (enhanced)
  assigneeId?: string;           // Human
  assigneeAgentId?: string;      // AI agent (NEW)

  // Relationships (simplified)
  parentId?: string;
  linkedPrs: string[];           // GitHub PR URLs
  linkedCommits: string[];

  // External Sync (NEW - not in Plane)
  externalLinks: ExternalLink[];

  // AI Metadata (NEW - not in Plane)
  createdByType: 'human' | 'ai';
  aiAgentId?: string;
  aiSessionId?: string;

  // Denormalized counts (from Plane)
  commentsCount: number;
  attachmentsCount: number;

  // Timestamps (from Plane)
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Flags
  isDraft: boolean;
  isArchived: boolean;
}
```

---

## File Locations to Study

### Backend (Django models)
- `apps/api/plane/db/models/issue.py` - Issue model
- `apps/api/plane/db/models/state.py` - State machine
- `apps/api/plane/app/views/issue/base.py` - Issue API

### Frontend (React/Next.js)
- `apps/web/components/issues/` - Issue components
- `apps/web/store/issue/` - State management
- `packages/ui/src/` - Reusable components

### Types
- `packages/types/src/issues/` - All issue types
- `packages/types/src/state.ts` - State types

---

## Next Steps

1. **Don't copy code** - Adapt patterns to TypeScript/Drizzle
2. **Start with tickets table** - Based on TBaseIssue
3. **Add external_links table** - For sync (Plane doesn't have this)
4. **Add AI metadata** - `created_by_agent`, `ai_session_id`
5. **Simple list view first** - Not Kanban (that's Phase 2)
