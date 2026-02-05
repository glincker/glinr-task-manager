# Implementation Plan: Plane Parity Phase A - UI Components

## Overview

Build the UI components for features that already have backend support. This is the fastest path to PM feature parity since no schema/API changes needed.

## Sprint 1: Core PM UI (2 weeks)

### 1. Estimate Points Component
**Files to create:**
- `ui/src/features/tickets/components/EstimateSelect.tsx`

**Files to modify:**
- `src/storage/libsql.ts` - Add `estimate_points` column
- `src/tickets/types.ts` - Add `estimatePoints` to schemas
- `src/routes/tickets.ts` - Add to create/update/query
- `ui/src/features/tickets/components/CreateTicketModal.tsx`
- `ui/src/features/tickets/views/TicketDetail.tsx`
- `ui/src/features/tickets/views/TicketList.tsx` (optional column)

**Pattern:**
```tsx
// EstimateSelect.tsx
const ESTIMATES = [0, 1, 2, 3, 5, 8, 13, 21] as const;
<Select value={value} onValueChange={onChange}>
  {ESTIMATES.map(e => <SelectItem key={e} value={e}>{e} pts</SelectItem>)}
</Select>
```

### 2. Issue Relations UI
**Files to create:**
- `ui/src/features/tickets/components/RelationsWidget.tsx`
- `ui/src/features/tickets/components/AddRelationModal.tsx`

**Files to modify:**
- `ui/src/features/tickets/views/TicketDetail.tsx` - Add RelationsWidget

**Pattern:** Collapsible card showing blocked-by, blocks, relates-to, duplicates

### 3. Multi-Assignee UI
**Files to create:**
- `ui/src/features/tickets/components/AssigneePicker.tsx` (multi-select)

**Files to modify:**
- `ui/src/features/tickets/components/CreateTicketModal.tsx`
- `ui/src/features/tickets/views/TicketDetail.tsx`

**Pattern:** Multi-select dropdown with avatars

### 4. Watchers Widget
**Files to create:**
- `ui/src/features/tickets/components/WatchersWidget.tsx`

**Files to modify:**
- `ui/src/features/tickets/views/TicketDetail.tsx`

**Pattern:** Avatar stack with add/remove toggle

### 5. Attachments UI
**Files to create:**
- `ui/src/features/tickets/components/AttachmentsWidget.tsx`
- `ui/src/features/tickets/components/AttachmentUpload.tsx`

**Files to modify:**
- `ui/src/features/tickets/views/TicketDetail.tsx`

**Pattern:** File list with upload dropzone (requires storage setup)

### 6. Reactions Picker
**Files to create:**
- `ui/src/features/tickets/components/ReactionPicker.tsx`

**Files to modify:**
- `ui/src/features/tickets/views/TicketDetail.tsx`

**Pattern:** Emoji picker popover (like GitHub)

### 7. Bulk Actions Toolbar
**Files to create:**
- `ui/src/features/tickets/components/BulkActionBar.tsx`

**Files to modify:**
- `ui/src/features/tickets/views/TicketList.tsx` - Add selection state + toolbar

**Pattern:** Sticky toolbar when items selected (status, assignee, priority, delete)

## Implementation Order

1. **EstimateSelect** (schema change + UI) - 2 hours
2. **RelationsWidget** (UI only) - 3 hours
3. **AssigneePicker** (UI only) - 2 hours
4. **WatchersWidget** (UI only) - 2 hours
5. **ReactionPicker** (UI only) - 2 hours
6. **BulkActionBar** (UI only) - 3 hours
7. **AttachmentsWidget** (needs file storage) - 4 hours

## Bash Commands Needed

```bash
# Database migrations
pnpm db:migrate

# Development
pnpm dev

# Build verification
pnpm build && pnpm lint
```

## File Storage Consideration

For attachments, we need to decide:
- **Option A**: Local file storage (simplest, good for self-hosted)
- **Option B**: S3/R2 compatible (Cloudflare R2, MinIO)
- **Recommendation**: Start with local storage, add S3 later

## UI Patterns to Follow

1. **Components**: Use shadcn/ui primitives (Button, Select, Dialog, Popover)
2. **State**: TanStack Query for server state
3. **Styling**: Tailwind only, use CSS variables
4. **Forms**: Simple useState (no form library needed)
5. **Toasts**: sonner `toast.success()` / `toast.error()`

## Ready to Start

Begin with **EstimateSelect** - it's the simplest and demonstrates the full stack:
1. Schema change
2. Type updates
3. API updates
4. UI component
5. Integration into existing views
