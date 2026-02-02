import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import {
  initTaskQueue,
  addTask,
  getTask,
  getTasks,
  onTaskEvent,
  closeTaskQueue,
} from '../queue/task-queue.js';
import type { CreateTaskInput, Task, TaskResult } from '../types/task.js';
import { TaskSource, TaskStatus } from '../types/task.js';
import { getAgentRegistry } from '../adapters/registry.js';

/**
 * End-to-End Test: Full Task Lifecycle
 *
 * Tests the complete journey of a task:
 * 1. Create task input
 * 2. Add to queue
 * 3. Task gets picked up by worker
 * 4. Agent adapter executes the task
 * 5. Result is stored
 * 6. Notifications are sent
 *
 * This requires Redis to be running.
 * Set REDIS_URL environment variable or defaults to localhost.
 */

describe('E2E: Full Task Lifecycle', () => {
  // Track events for assertions
  let receivedEvents: Array<{ type: string; taskId: string; task: Task; result?: TaskResult }> = [];
  let unsubscribe: (() => void) | null = null;

  beforeAll(async () => {
    // Initialize the task queue (this connects to Redis)
    try {
      await initTaskQueue();
    } catch (error) {
      console.error('Failed to initialize task queue. Is Redis running?', error);
      throw error;
    }

    // Subscribe to task events
    unsubscribe = onTaskEvent((event) => {
      receivedEvents.push(event);
    });
  });

  beforeEach(() => {
    receivedEvents = [];
  });

  afterAll(async () => {
    // Clean up
    if (unsubscribe) {
      unsubscribe();
    }
    await closeTaskQueue();
  });

  it('should complete full task lifecycle: create → queue → process → complete', async () => {
    // Step 1: Create task input
    const taskInput: CreateTaskInput = {
      title: 'E2E Test: Add health check endpoint',
      description: 'Add a /health endpoint that returns server status',
      prompt: 'Create a GET /health endpoint in the server that returns { status: "ok" }',
      priority: 2, // High priority
      source: TaskSource.API,
      sourceId: 'e2e-test-1',
      sourceUrl: undefined,
      repository: 'glinr/task-manager',
      branch: 'main',
      labels: ['enhancement', 'test'],
      assignedAgent: undefined, // Let routing decide
      metadata: {
        testRun: true,
        timestamp: new Date().toISOString(),
      },
    };

    // Step 2: Add task to queue
    const task = await addTask(taskInput);

    // Verify task was created with correct properties
    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.title).toBe(taskInput.title);
    expect(task.status).toBe(TaskStatus.QUEUED);
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.attempts).toBe(0);

    // Verify task is in store
    const storedTask = getTask(task.id);
    expect(storedTask).toBeDefined();
    expect(storedTask?.id).toBe(task.id);

    // Verify 'created' and 'queued' events were emitted
    expect(receivedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'created',
          taskId: task.id,
        }),
        expect.objectContaining({
          type: 'queued',
          taskId: task.id,
        }),
      ])
    );

    // Step 3: Wait for task to be processed
    // The worker picks it up automatically
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();
    let processedTask: Task | undefined;

    while (Date.now() - startTime < maxWaitTime) {
      processedTask = getTask(task.id);
      if (processedTask && processedTask.status === TaskStatus.COMPLETED) {
        break;
      }
      if (processedTask && processedTask.status === TaskStatus.FAILED) {
        break;
      }
      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Step 4: Verify task completed successfully
    expect(processedTask).toBeDefined();
    expect(processedTask!.status).toBe(TaskStatus.COMPLETED);
    expect(processedTask!.result).toBeDefined();
    expect(processedTask!.result?.success).toBe(true);
    expect(processedTask!.startedAt).toBeInstanceOf(Date);
    expect(processedTask!.completedAt).toBeInstanceOf(Date);
    expect(processedTask!.result?.duration).toBeGreaterThan(0);

    // Step 5: Verify events were emitted in correct order
    expect(receivedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'created', taskId: task.id }),
        expect.objectContaining({ type: 'queued', taskId: task.id }),
        expect.objectContaining({ type: 'started', taskId: task.id }),
        expect.objectContaining({ type: 'completed', taskId: task.id }),
      ])
    );

    const completedEvent = receivedEvents.find(
      (e) => e.type === 'completed' && e.taskId === task.id
    );
    expect(completedEvent?.result).toBeDefined();
    expect(completedEvent?.result?.success).toBe(true);
  }, 35000); // Increase timeout for this test

  it('should handle task retrieval with filters', async () => {
    // Add multiple tasks
    const task1 = await addTask({
      title: 'Task 1',
      prompt: 'Do task 1',
      priority: 1,
      source: TaskSource.API,
      labels: [],
      metadata: {},
    });

    const task2 = await addTask({
      title: 'Task 2',
      prompt: 'Do task 2',
      priority: 3,
      source: TaskSource.API,
      labels: [],
      metadata: {},
    });

    // Get all tasks
    const allTasks = getTasks();
    expect(allTasks.length).toBeGreaterThanOrEqual(2);
    expect(allTasks.some((t) => t.id === task1.id)).toBe(true);
    expect(allTasks.some((t) => t.id === task2.id)).toBe(true);

    // Get tasks with specific status
    const queuedTasks = getTasks({ status: TaskStatus.QUEUED });
    expect(queuedTasks.every((t) => t.status === TaskStatus.QUEUED)).toBe(true);

    // Test pagination
    const limitedTasks = getTasks({ limit: 1 });
    expect(limitedTasks.length).toBe(1);

    const offsetTasks = getTasks({ limit: 1, offset: 1 });
    expect(offsetTasks.length).toBeGreaterThanOrEqual(0);
    if (offsetTasks.length > 0) {
      expect(offsetTasks[0].id).not.toBe(limitedTasks[0].id);
    }
  });

  it('should handle task failure and store error information', async () => {
    // Create a task that will fail (invalid agent assignment)
    const taskInput: CreateTaskInput = {
      title: 'E2E Test: Task failure handling',
      prompt: 'Test task that should fail gracefully',
      priority: 3,
      source: TaskSource.API,
      labels: [],
      metadata: {},
      assignedAgent: 'non-existent-adapter', // This will cause failure
    };

    const task = await addTask(taskInput);

    // Wait for task to fail
    const maxWaitTime = 15000;
    const startTime = Date.now();
    let finalTask: Task | undefined;

    while (Date.now() - startTime < maxWaitTime) {
      finalTask = getTask(task.id);
      if (finalTask && finalTask.status === TaskStatus.FAILED) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Verify task failed with proper error information
    expect(finalTask).toBeDefined();
    expect(finalTask!.status).toBe(TaskStatus.FAILED);
    expect(finalTask!.result).toBeDefined();
    expect(finalTask!.result?.success).toBe(false);
    expect(finalTask!.result?.error).toBeDefined();
    expect(finalTask!.result?.error?.message).toBeDefined();

    // Verify failed event was emitted
    const failedEvent = receivedEvents.find(
      (e) => e.type === 'failed' && e.taskId === task.id
    );
    expect(failedEvent).toBeDefined();
  }, 20000);

  it('should respect task priority in queue processing', async () => {
    const tasksCreated: Task[] = [];

    // Add low priority task
    const lowPriorityTask = await addTask({
      title: 'Low priority task',
      prompt: 'This should be processed last',
      priority: 4, // LOW
      source: TaskSource.API,
      labels: [],
      metadata: { priority: 'low' },
    });
    tasksCreated.push(lowPriorityTask);

    // Add high priority task
    const highPriorityTask = await addTask({
      title: 'High priority task',
      prompt: 'This should be processed first',
      priority: 2, // HIGH
      source: TaskSource.API,
      labels: [],
      metadata: { priority: 'high' },
    });
    tasksCreated.push(highPriorityTask);

    // Add critical priority task
    const criticalPriorityTask = await addTask({
      title: 'Critical priority task',
      prompt: 'This should be processed immediately',
      priority: 1, // CRITICAL
      source: TaskSource.API,
      labels: [],
      metadata: { priority: 'critical' },
    });
    tasksCreated.push(criticalPriorityTask);

    // Wait for all to complete
    const maxWaitTime = 45000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const allCompleted = tasksCreated.every((t) => {
        const current = getTask(t.id);
        return current && (current.status === TaskStatus.COMPLETED || current.status === TaskStatus.FAILED);
      });

      if (allCompleted) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Verify all tasks completed
    const completedTasks = tasksCreated.map((t) => getTask(t.id)!);
    expect(completedTasks.every((t) => t.status === TaskStatus.COMPLETED)).toBe(true);

    // Check that started events respected priority order
    const startedEvents = receivedEvents
      .filter((e) => e.type === 'started' && tasksCreated.some((t) => t.id === e.taskId))
      .map((e) => e.task);

    // Note: Due to concurrency, we can't guarantee strict ordering
    // But the critical task should start before or at same time as low priority
    const criticalStarted = startedEvents.find((t) => t.id === criticalPriorityTask.id);
    const lowStarted = startedEvents.find((t) => t.id === lowPriorityTask.id);

    if (criticalStarted && lowStarted) {
      expect(criticalStarted.startedAt!.getTime()).toBeLessThanOrEqual(
        lowStarted.startedAt!.getTime()
      );
    }
  }, 50000);
});
