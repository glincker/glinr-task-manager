# GLINR Task Manager - UI Guidelines

> **For AI Agents:** Follow these guidelines strictly to maintain consistency and avoid tech debt.
> **Design System:** macOS Sequoia Liquid Glass
> **Last Updated:** 2026-02-01

---

## Design System: Liquid Glass

We follow the **macOS Sequoia Liquid Glass** aesthetic - floating elements with multi-layer glass effects, organic curves, and vibrant colors.

### Core Principles

1. **Floating Elements** - Nothing touches viewport edges, everything has margins
2. **Multi-layer Glass** - backdrop-blur + saturation + inner glow borders
3. **Organic Curves** - 12-20px radius on all containers
4. **Depth via Shadows** - 4-layer shadow stacks for floating effect
5. **Vibrant Colors** - OKLCH color space with saturation
6. **Mesh Gradients** - Subtle gradient backgrounds

### Glass Utility Classes

```css
/* Standard glass panel */
.glass {
  background: var(--card);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border);
}

/* Heavy blur for modals/overlays */
.glass-heavy {
  backdrop-filter: blur(40px) saturate(200%);
}

/* Floating sidebar */
.sidebar-glass {
  backdrop-filter: blur(32px) saturate(180%);
  box-shadow: var(--shadow-float),
    inset 0 0 0 1px oklch(1 0 0 / 0.05),
    inset 0 1px 1px 0 oklch(1 0 0 / 0.1);
}

/* Header toolbar */
.header-glass {
  backdrop-filter: blur(40px) saturate(180%);
}

/* Active navigation item */
.nav-item-active-glass {
  background: var(--primary);
  box-shadow: 0 4px 12px -2px oklch(from var(--primary) l c h / 0.4);
}

/* Floating shadow */
.shadow-float {
  box-shadow:
    0 4px 8px -2px oklch(0 0 0 / 0.08),
    0 12px 24px -4px oklch(0 0 0 / 0.12),
    0 24px 48px -8px oklch(0 0 0 / 0.16);
}

/* Lift on hover */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
}

/* Smooth transitions */
.transition-liquid {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### Status Indicators with Glow

```tsx
// Green (online/success)
<div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_oklch(0.6_0.2_150)] animate-pulse" />

// Blue (processing)
<div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_oklch(0.6_0.2_250)] animate-pulse" />

// Red (error)
<div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_oklch(0.6_0.2_25)]" />
```

### Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌────────────────────────────────────┐  │
│ │              │  │ header-glass (floating pill)       │  │
│ │   sidebar    │  └────────────────────────────────────┘  │
│ │   -glass     │                                          │
│ │   (floating) │  ┌────────────────────────────────────┐  │
│ │              │  │                                    │  │
│ │              │  │     Content Area                   │  │
│ │              │  │     (glass cards)                  │  │
│ │              │  │                                    │  │
│ └──────────────┘  └────────────────────────────────────┘  │
│                                                            │
│  Background: mesh gradient (radial gradients at corners)   │
└────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Build | **Vite** | Lightning-fast HMR, native ES modules |
| Framework | **React 19** | Component composition, hooks ecosystem |
| Language | **TypeScript** | Type safety, better DX |
| Styling | **Tailwind CSS v4** | Utility-first, CSS-first config |
| Components | **shadcn/ui** | Copy-paste ownership, Radix primitives |
| Icons | **Lucide React** | Consistent, lightweight icons |
| State | **TanStack Query** | Server state management |
| Routing | **React Router v7** | Client-side routing |
| Theming | **next-themes** | Dark/light mode switching |

---

## Architecture: Feature-Based

We use **feature-based architecture** - group by business domain, not file type.

```
ui/
├── src/
│   ├── core/                    # Global configuration & shared resources
│   │   ├── api/                 # API client, fetch utilities
│   │   ├── config/              # App configuration
│   │   ├── providers/           # React context providers
│   │   └── styles/              # Global CSS, theme variables
│   │
│   ├── components/              # Shared UI components (from shadcn/ui)
│   │   ├── ui/                  # Base components (Button, Card, etc.)
│   │   └── shared/              # App-specific reusable components
│   │
│   ├── layouts/                 # Page layouts
│   │   ├── RootLayout.tsx       # App shell with sidebar/header
│   │   └── AuthLayout.tsx       # Auth pages layout
│   │
│   ├── features/                # Feature modules (business domains)
│   │   ├── tasks/
│   │   │   ├── components/      # Task-specific components
│   │   │   ├── hooks/           # Task-specific hooks
│   │   │   ├── types/           # Task types (if not shared)
│   │   │   └── views/           # Task pages (TaskList, TaskDetail)
│   │   │
│   │   ├── summaries/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── views/
│   │   │
│   │   ├── agents/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── views/
│   │   │
│   │   └── dashboard/
│   │       ├── components/
│   │       └── views/
│   │
│   ├── hooks/                   # Shared hooks
│   ├── lib/                     # Utility functions
│   ├── types/                   # Shared TypeScript types
│   │
│   ├── App.tsx                  # App entry with providers
│   ├── router.tsx               # Route definitions
│   └── main.tsx                 # Vite entry point
│
├── public/                      # Static assets
├── index.html                   # HTML template
├── tailwind.css                 # Tailwind v4 CSS-first config
├── components.json              # shadcn/ui configuration
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Naming Conventions

### Files & Folders

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskCard.tsx` |
| Hooks | camelCase with `use` prefix | `useTaskQuery.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `Task.ts` or in `types/` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Folders (grouping) | kebab-case or camelCase | `components/`, `task-list/` |

### Component Files

```typescript
// TaskCard.tsx - Component with same name as file
export function TaskCard({ task }: TaskCardProps) { ... }

// useTaskQuery.ts - Hook with same name as file
export function useTaskQuery(id: string) { ... }
```

---

## Component Patterns

### 1. Composition Over Props Drilling

```tsx
// Good - Composition pattern
<Card>
  <CardHeader>
    <CardTitle>Task Details</CardTitle>
  </CardHeader>
  <CardContent>
    <TaskStatus status={task.status} />
  </CardContent>
</Card>

// Avoid - Prop drilling
<Card title="Task Details" status={task.status} content={...} />
```

### 2. Container/Presentational Split

```tsx
// Container - handles data fetching & logic
function TaskListContainer() {
  const { data, isLoading } = useTasksQuery();
  if (isLoading) return <TaskListSkeleton />;
  return <TaskList tasks={data} />;
}

// Presentational - pure UI, receives props
function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-4">
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
```

### 3. Controlled Components

Lift state up to parent when siblings need access:

```tsx
// Parent manages shared state
function TaskFilters() {
  const [status, setStatus] = useState<Status>('all');
  const [search, setSearch] = useState('');

  return (
    <>
      <StatusFilter value={status} onChange={setStatus} />
      <SearchInput value={search} onChange={setSearch} />
      <TaskList status={status} search={search} />
    </>
  );
}
```

### 4. Derive State, Don't Duplicate

```tsx
// Good - Derive from existing state
const completedTasks = tasks.filter(t => t.status === 'completed');
const completedCount = completedTasks.length;

// Avoid - Separate state that can drift
const [completedCount, setCompletedCount] = useState(0);
```

---

## Styling Guidelines

### Tailwind CSS v4 Setup

```css
/* tailwind.css - CSS-first configuration */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Custom Colors - OKLCH for better color space */
  --color-brand: oklch(0.7 0.15 250);
  --color-brand-foreground: oklch(0.98 0.01 250);

  /* Shadows - Subtle 3D feel */
  --shadow-soft: 0 2px 8px -2px oklch(0 0 0 / 0.08),
                 0 4px 16px -4px oklch(0 0 0 / 0.12);
  --shadow-elevated: 0 4px 12px -2px oklch(0 0 0 / 0.1),
                     0 8px 24px -4px oklch(0 0 0 / 0.15);

  /* Border Radius */
  --radius-lg: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.25rem;
}

:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.15 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0 0);
  --primary: oklch(0.25 0 0);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.96 0 0);
  --secondary-foreground: oklch(0.15 0 0);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.45 0 0);
  --accent: oklch(0.96 0 0);
  --accent-foreground: oklch(0.15 0 0);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.9 0 0);
  --input: oklch(0.9 0 0);
  --ring: oklch(0.7 0.1 250);
}

:root[class~="dark"] {
  --background: oklch(0.12 0.02 260);
  --foreground: oklch(0.95 0 0);
  --card: oklch(0.16 0.02 260);
  --card-foreground: oklch(0.95 0 0);
  --primary: oklch(0.95 0 0);
  --primary-foreground: oklch(0.15 0 0);
  --secondary: oklch(0.22 0.02 260);
  --secondary-foreground: oklch(0.95 0 0);
  --muted: oklch(0.22 0.02 260);
  --muted-foreground: oklch(0.6 0 0);
  --accent: oklch(0.22 0.02 260);
  --accent-foreground: oklch(0.95 0 0);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.28 0.02 260);
  --input: oklch(0.28 0.02 260);
  --ring: oklch(0.7 0.1 250);
}
```

### shadcn/ui Theming

Use the background/foreground convention:

```tsx
// Using theme colors
<Button className="bg-primary text-primary-foreground">
  Submit
</Button>

// Card with proper theming
<Card className="bg-card text-card-foreground shadow-soft">
  <CardContent>...</CardContent>
</Card>
```

### Utility Class Ordering

Use this order for Tailwind classes (enforced by Prettier plugin):

1. Layout (display, position, flex/grid)
2. Sizing (width, height, padding, margin)
3. Typography (font, text)
4. Visual (background, border, shadow)
5. Interactive (hover, focus, transition)

```tsx
// Good ordering
<div className="flex items-center gap-4 p-4 text-sm bg-card border rounded-lg hover:shadow-soft transition-shadow">
```

---

## Typography

### Font Stack

```css
/* Inter for UI text - clean, modern, great for interfaces */
--font-sans: "Inter Variable", "Inter", system-ui, sans-serif;

/* JetBrains Mono for code - excellent readability */
--font-mono: "JetBrains Mono Variable", "JetBrains Mono", monospace;
```

### Scale

| Use | Class | Size |
|-----|-------|------|
| Page title | `text-3xl font-bold` | 30px |
| Section title | `text-xl font-semibold` | 20px |
| Card title | `text-lg font-medium` | 18px |
| Body | `text-sm` | 14px |
| Small/Caption | `text-xs` | 12px |

---

## Icons

Use **Lucide React** exclusively:

```tsx
import { Plus, Settings, ChevronRight, Loader2 } from 'lucide-react';

// Standard icon sizing
<Plus className="h-4 w-4" />           // Small (buttons)
<Settings className="h-5 w-5" />       // Medium (nav)
<ChevronRight className="h-6 w-6" />   // Large (headers)

// Loading state
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## Dark Mode

### Implementation with next-themes

```tsx
// core/providers/ThemeProvider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Theme Toggle Component

```tsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

---

## Shadows & Visual Depth

### Subtle 3D Feel (Not Heavy)

```css
/* Light, layered shadows for depth */
.shadow-soft {
  box-shadow:
    0 2px 8px -2px oklch(0 0 0 / 0.08),
    0 4px 16px -4px oklch(0 0 0 / 0.12);
}

.shadow-elevated {
  box-shadow:
    0 4px 12px -2px oklch(0 0 0 / 0.1),
    0 8px 24px -4px oklch(0 0 0 / 0.15);
}

/* Dark mode - lighter, more diffuse */
.dark .shadow-soft {
  box-shadow:
    0 2px 8px -2px oklch(0 0 0 / 0.3),
    0 4px 16px -4px oklch(0 0 0 / 0.4);
}
```

### Usage

```tsx
// Cards with subtle elevation
<Card className="shadow-soft hover:shadow-elevated transition-shadow">

// Modal/Dialog with stronger elevation
<DialogContent className="shadow-elevated">
```

---

## State Management

### Server State: TanStack Query

```tsx
// features/tasks/hooks/useTasksQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api';

export function useTasksQuery(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.tasks.list(filters),
    staleTime: 30_000, // 30 seconds
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

### Client State: React State/Context

Only use for truly local UI state (form inputs, modals, selections):

```tsx
// Local state for UI
const [isOpen, setIsOpen] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

---

## Performance Guidelines

### 1. Memoization

```tsx
// Memoize expensive calculations
const sortedTasks = useMemo(
  () => tasks.slice().sort((a, b) => b.priority - a.priority),
  [tasks]
);

// Memoize callbacks passed to children
const handleSelect = useCallback((id: string) => {
  setSelectedIds(prev => new Set(prev).add(id));
}, []);
```

### 2. Code Splitting

```tsx
// Lazy load feature views
const TaskList = lazy(() => import('./features/tasks/views/TaskList'));
const Dashboard = lazy(() => import('./features/dashboard/views/Dashboard'));

// In router with Suspense
<Suspense fallback={<PageSkeleton />}>
  <TaskList />
</Suspense>
```

### 3. List Virtualization

For lists > 50 items, use virtualization:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualTaskList({ tasks }: { tasks: Task[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <TaskCard
            key={tasks[virtualRow.index].id}
            task={tasks[virtualRow.index]}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Accessibility (A11y)

### Required Practices

1. **Use semantic HTML**: `<button>`, `<nav>`, `<main>`, `<article>`
2. **Add ARIA labels** where needed: `aria-label`, `aria-describedby`
3. **Keyboard navigation**: All interactive elements must be focusable
4. **Focus indicators**: Never remove, style appropriately
5. **Color contrast**: Minimum 4.5:1 for text (WCAG AA)

```tsx
// Good accessibility
<Button aria-label="Add new task">
  <Plus className="h-4 w-4" />
</Button>

// Screen reader only text
<span className="sr-only">Loading tasks...</span>

// Focus ring styling (from shadcn)
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

---

## Testing

### Component Tests

```tsx
// TaskCard.test.tsx
import { render, screen } from '@testing-library/react';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  it('displays task title', () => {
    render(<TaskCard task={{ id: '1', title: 'Test Task', ... }} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

---

## Do NOT

- **Don't use `any` type** - Always provide proper types
- **Don't inline complex logic in JSX** - Extract to hooks/utilities
- **Don't nest ternaries** - Use early returns or extract components
- **Don't ignore accessibility** - It's required, not optional
- **Don't over-abstract early** - Wait for 3+ similar patterns
- **Don't mix styling approaches** - Tailwind only, no inline styles
- **Don't skip loading/error states** - Always handle all states
- **Don't use index as key** - Use unique IDs for list items

---

## Quick Reference: shadcn/ui Components to Use

| Purpose | Component |
|---------|-----------|
| Buttons | `Button` (variants: default, destructive, outline, secondary, ghost, link) |
| Cards | `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` |
| Forms | `Input`, `Label`, `Select`, `Checkbox`, `RadioGroup`, `Switch` |
| Feedback | `Toast`, `Alert`, `Skeleton`, `Progress` |
| Overlay | `Dialog`, `Sheet`, `Popover`, `Tooltip`, `DropdownMenu` |
| Data Display | `Table`, `Badge`, `Avatar`, `Separator` |
| Navigation | `Tabs`, `NavigationMenu`, `Breadcrumb` |
| Layout | `ScrollArea`, `Resizable`, `Collapsible` |

---

## Sources & References

- [React Architecture Patterns 2025](https://www.geeksforgeeks.org/reactjs/react-architecture-pattern-and-best-practices/)
- [Feature-Based React Structure](https://github.com/naserrasoulii/feature-based-react)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Dark Mode](https://ui.shadcn.com/docs/dark-mode)
- [Tailwind v4 with shadcn](https://ui.shadcn.com/docs/tailwind-v4)
- [React UI Libraries 2025](https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra)
