---
name: api-conventions
description: API design patterns for this codebase. Use when creating endpoints, routes, or handlers.
---

## Hono Route Patterns

```typescript
// Route definition in src/routes/
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// Validation schema
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
});

// Route with validation
app.post('/tasks', zValidator('json', createTaskSchema), async (c) => {
  const data = c.req.valid('json');
  // ... implementation
  return c.json({ success: true, data: result });
});
```

## Error Response Format

```typescript
// Always return this structure for errors
return c.json({
  success: false,
  error: {
    code: 'ERROR_CODE',  // SCREAMING_SNAKE_CASE
    message: 'Human readable message',
  }
}, 400);
```

## Common Error Codes

- `VALIDATION_ERROR` - Invalid input
- `NOT_FOUND` - Resource doesn't exist
- `UNAUTHORIZED` - Missing/invalid auth
- `FORBIDDEN` - Valid auth but not permitted
- `INTERNAL_ERROR` - Unexpected server error
