import { Hono } from 'hono';
import { getDeadLetterQueue, retryDeadLetterTask, removeFromDeadLetterQueue } from '../queue/failure-handler.js';

const dlq = new Hono();

// List dead letter queue tasks
dlq.get('/', (c) => {
  const tasks = getDeadLetterQueue();
  return c.json({
    tasks,
    count: tasks.length,
  });
});

// Get DLQ stats
dlq.get('/stats', (c) => {
  const tasks = getDeadLetterQueue();
  return c.json({
    total: tasks.length,
  });
});

// Retry a task from DLQ
dlq.post('/:id/retry', async (c) => {
  const id = c.req.param('id');
  const success = await retryDeadLetterTask(id);

  if (!success) {
    return c.json({ error: 'Task not found in dead letter queue' }, 404);
  }

  return c.json({ message: 'Task moved back to queue for retry' });
});

// Remove task from DLQ (manual resolution)
dlq.delete('/:id', (c) => {
  const id = c.req.param('id');
  const success = removeFromDeadLetterQueue(id);

  if (!success) {
    return c.json({ error: 'Task not found in dead letter queue' }, 404);
  }

  return c.json({ message: 'Task removed from dead letter queue' });
});

export { dlq as dlqRoutes };
