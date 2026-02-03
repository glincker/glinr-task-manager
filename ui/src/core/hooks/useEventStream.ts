import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TaskEvent {
  taskId: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: number;
    source: string;
    assignedAgent?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
  };
  result?: {
    success: boolean;
    error?: string;
  };
  progress?: number;
  timestamp: string;
}

const API_BASE = 'http://localhost:3000';

export function useEventStream() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Don't create multiple connections
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    const eventSource = new EventSource(`${API_BASE}/api/events`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      console.log('[SSE] Connected:', data.message);
    });

    eventSource.addEventListener('ping', () => {
      // Keep-alive, no action needed
    });

    eventSource.addEventListener('task:created', (event) => {
      const data: TaskEvent = JSON.parse(event.data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.info(`New task: ${data.task.title}`);
    });

    eventSource.addEventListener('task:started', (event) => {
      const data: TaskEvent = JSON.parse(event.data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.taskId] });
    });

    eventSource.addEventListener('task:completed', (event) => {
      const data: TaskEvent = JSON.parse(event.data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
      toast.success(`Task completed: ${data.task.title}`);
    });

    eventSource.addEventListener('task:failed', (event) => {
      const data: TaskEvent = JSON.parse(event.data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['dlq'] });
      toast.error(`Task failed: ${data.task.title}`, {
        description: data.result?.error,
      });
    });

    eventSource.addEventListener('task:progress', (event) => {
      const data: TaskEvent = JSON.parse(event.data);
      queryClient.invalidateQueries({ queryKey: ['tasks', data.taskId] });
    });

    eventSource.onerror = () => {
      console.log('[SSE] Connection error, will reconnect...');
      eventSource.close();
      eventSourceRef.current = null;

      // Reconnect after delay
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };
  }, [queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
