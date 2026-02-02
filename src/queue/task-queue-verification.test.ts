import { test, expect, describe, vi, beforeEach } from 'vitest';

vi.mock('bullmq', () => ({
  Queue: class {
    add = vi.fn();
    close = vi.fn();
  },
  Worker: class {
    on = vi.fn();
    close = vi.fn();
  },
  Job: class {},
}));

vi.mock('../adapters/registry.js', () => ({
  getAgentRegistry: () => ({}),
}));

import { getTasks, _seedTaskStore, addTask, initTaskQueue } from './task-queue';
import { Task, TaskStatus } from '../types/task';
import { randomUUID } from 'crypto';

describe('Task Queue Verification', () => {
    beforeEach(() => {
         // Clear tasks before each test
        _seedTaskStore([]);
    });

    test('getTasks returns tasks in descending order of createdAt', () => {
        const tasks: Task[] = [];
        const now = Date.now();
        for (let i = 0; i < 5; i++) {
            tasks.push({
                id: `task-${i}`,
                title: `Task ${i}`,
                prompt: 'prompt',
                status: 'pending',
                priority: 3,
                source: 'api',
                // Task 0 is oldest, Task 4 is newest
                createdAt: new Date(now + i * 1000),
                updatedAt: new Date(),
                attempts: 0,
                maxAttempts: 3,
                labels: [],
                metadata: {}
            });
        }

        // Seed randomly to ensure sort works (though seed sorts it, we trust seed)
        // Let's use seed helper
        _seedTaskStore(tasks);

        const retrieved = getTasks();
        expect(retrieved).toHaveLength(5);
        expect(retrieved[0].id).toBe('task-4'); // Newest
        expect(retrieved[4].id).toBe('task-0'); // Oldest
    });

    test('addTask maintains sort order (newest first)', async () => {
        // We need to initialize queue to call addTask
        await initTaskQueue();

        // Add task 1
        const task1 = await addTask({
            title: 'Task 1',
            prompt: 'prompt',
            source: 'api'
        });

        // Wait a bit to ensure timestamp difference
        await new Promise(r => setTimeout(r, 10));

        // Add task 2
        const task2 = await addTask({
            title: 'Task 2',
            prompt: 'prompt',
            source: 'api'
        });

        const tasks = getTasks();
        expect(tasks[0].id).toBe(task2.id);
        expect(tasks[1].id).toBe(task1.id);
    });

    test('pagination works correctly', () => {
        const tasks: Task[] = [];
        for (let i = 0; i < 20; i++) {
            tasks.push({
                id: `task-${i}`,
                title: `Task ${i}`,
                prompt: 'prompt',
                status: 'pending',
                priority: 3,
                source: 'api',
                createdAt: new Date(Date.now() + i * 1000),
                updatedAt: new Date(),
                attempts: 0,
                maxAttempts: 3,
                labels: [],
                metadata: {}
            });
        }
        _seedTaskStore(tasks);

        // Page 1 (limit 5) -> should be 19, 18, 17, 16, 15
        const page1 = getTasks({ limit: 5, offset: 0 });
        expect(page1).toHaveLength(5);
        expect(page1[0].id).toBe('task-19');
        expect(page1[4].id).toBe('task-15');

        // Page 2 (limit 5, offset 5) -> 14..10
        const page2 = getTasks({ limit: 5, offset: 5 });
        expect(page2).toHaveLength(5);
        expect(page2[0].id).toBe('task-14');
        expect(page2[4].id).toBe('task-10');
    });

    test('filtering by status works correctly', () => {
         const tasks: Task[] = [];
         // 5 pending, 5 completed
        for (let i = 0; i < 10; i++) {
            tasks.push({
                id: `task-${i}`,
                title: `Task ${i}`,
                prompt: 'prompt',
                status: i % 2 === 0 ? 'pending' : 'completed',
                priority: 3,
                source: 'api',
                createdAt: new Date(Date.now() + i * 1000),
                updatedAt: new Date(),
                attempts: 0,
                maxAttempts: 3,
                labels: [],
                metadata: {}
            });
        }
        _seedTaskStore(tasks);

        const pending = getTasks({ status: 'pending' });
        expect(pending).toHaveLength(5);
        expect(pending.every(t => t.status === 'pending')).toBe(true);
        // Should still be sorted newest first
        // task-8 (pending), task-6, task-4, task-2, task-0
        expect(pending[0].id).toBe('task-8');

        const completed = getTasks({ status: 'completed' });
        expect(completed).toHaveLength(5);
        expect(completed.every(t => t.status === 'completed')).toBe(true);
        expect(completed[0].id).toBe('task-9');
    });

    test('filtering combined with pagination', () => {
        const tasks: Task[] = [];
        // 20 pending tasks
        for (let i = 0; i < 20; i++) {
            tasks.push({
                id: `task-${i}`,
                title: `Task ${i}`,
                prompt: 'prompt',
                status: 'pending',
                priority: 3,
                source: 'api',
                createdAt: new Date(Date.now() + i * 1000),
                updatedAt: new Date(),
                attempts: 0,
                maxAttempts: 3,
                labels: [],
                metadata: {}
            });
        }
        _seedTaskStore(tasks);

        const page2 = getTasks({ status: 'pending', limit: 5, offset: 5 });
        expect(page2).toHaveLength(5);
        expect(page2[0].id).toBe('task-14');
    });
});
