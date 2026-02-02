import { bench, describe, vi } from 'vitest';

vi.mock('bullmq', () => ({
  Queue: class {},
  Worker: class {},
  Job: class {},
}));

vi.mock('../adapters/registry.js', () => ({
  getAgentRegistry: () => ({}),
}));

import { getTasks, _seedTaskStore } from './task-queue';
import { Task, TaskStatus } from '../types/task';
import { randomUUID } from 'crypto';

function generateTasks(count: number): Task[] {
  const tasks: Task[] = [];
  const statuses = Object.values(TaskStatus);
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    tasks.push({
      id: randomUUID(),
      title: `Task ${i}`,
      prompt: 'test prompt',
      status: statuses[i % statuses.length],
      priority: 3,
      source: 'api',
      createdAt: new Date(now - i * 1000),
      updatedAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      labels: [],
      metadata: {}
    });
  }
  return tasks;
}

const tasks = generateTasks(10000);
_seedTaskStore(tasks);

describe('getTasks', () => {
  bench('getTasks (no filter)', () => {
    getTasks({ limit: 50 });
  });

  bench('getTasks (filter by status)', () => {
    getTasks({ status: 'completed', limit: 50 });
  });

  bench('getTasks (pagination deep)', () => {
    getTasks({ offset: 5000, limit: 50 });
  });
});
