import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processTask, initTaskQueue, closeTaskQueue } from './task-queue.js';
import type { Task, TaskResult } from '../types/task.js';
import { Job } from 'bullmq';

// Mock BullMQ
const mockQueueAdd = vi.fn();
const mockQueueClose = vi.fn();
const mockWorkerClose = vi.fn();
const mockWorkerOn = vi.fn();

vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: mockQueueAdd,
      close: mockQueueClose,
    })),
    Worker: vi.fn().mockImplementation(() => ({
      on: mockWorkerOn,
      close: mockWorkerClose,
    })),
    Job: vi.fn(),
  };
});

// Mock Registry
vi.mock('../adapters/registry.js', () => ({
  getAgentRegistry: () => ({
    findAdapterForTask: () => ({
      name: 'MockAdapter',
      executeTask: async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms task execution
        return {
          success: true,
          output: 'Task completed',
          duration: 100,
        } as TaskResult;
      },
    }),
  }),
}));

// Mock Notifications
vi.mock('./notifications.js', () => ({
  postResultToSource: async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms notification
  },
}));

describe('Task Queue Performance Benchmark', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await initTaskQueue();
  });

  afterEach(async () => {
    await closeTaskQueue();
  });

  it('measures processTask execution time (optimized)', async () => {
    const mockJob = {
      data: {
        id: 'task-1',
        title: 'Test Task',
        priority: 1,
        source: 'github_issue',
        status: 'queued',
      } as Task,
    } as unknown as Job<Task>;

    const start = performance.now();
    await processTask(mockJob);
    const end = performance.now();
    const duration = end - start;

    console.log(`[Benchmark] processTask took ${duration.toFixed(2)}ms`);

    // Should take ~100ms (task execution only)
    expect(duration).toBeGreaterThan(90);
    expect(duration).toBeLessThan(200); // Allow some overhead, but definitely not 600ms

    // Verify queue add was called
    expect(mockQueueAdd).toHaveBeenCalledWith('notify-source', expect.objectContaining({
      task: mockJob.data,
      result: expect.objectContaining({ success: true }),
    }));
  });
});
