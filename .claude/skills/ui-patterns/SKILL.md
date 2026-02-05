---
name: ui-patterns
description: UI component patterns for React 19 + Tailwind v4 + shadcn/ui. Use when creating UI components or pages.
---

## Component Structure

```tsx
// ui/src/features/<feature>/components/<Component>.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Props {
  data: SomeType;
  onAction: () => void;
}

export function MyComponent({ data, onAction }: Props) {
  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={onAction}>Action</Button>
      </CardContent>
    </Card>
  );
}
```

## Data Fetching with TanStack Query

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks', taskId],
  queryFn: () => fetchTask(taskId),
});

// Mutation with cache invalidation
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: updateTask,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

## Tailwind Class Ordering

`layout → size → typography → visual → interactive`

```tsx
<div className="flex items-center gap-4 p-4 text-sm bg-muted rounded-lg hover:bg-accent">
```

## Loading States

```tsx
{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
) : error ? (
  <div className="text-destructive p-4">Error: {error.message}</div>
) : (
  <ActualContent data={data} />
)}
```
