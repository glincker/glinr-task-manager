
import { describe, it, expect } from 'vitest';
import { DefaultAgentRegistry } from './registry.js';
import { AgentAdapterFactory } from '../types/agent.js';

describe('DefaultAgentRegistry', () => {
  const mockFactory: AgentAdapterFactory = (config) => ({
    config,
    processTask: async (task) => ({
      id: '1',
      taskId: task.id,
      status: 'completed',
      output: 'done',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    })
  });

  it('should return default adapter types', () => {
    const registry = new DefaultAgentRegistry();
    const types = registry.getAdapterTypes();
    expect(types).toContain('openclaw');
    expect(types).toContain('claude-code');
  });

  it('should return new adapter types after registration', () => {
    const registry = new DefaultAgentRegistry();
    registry.registerAdapter('test-adapter', mockFactory);
    const types = registry.getAdapterTypes();
    expect(types).toContain('test-adapter');
    expect(types).toContain('openclaw');
    expect(types).toContain('claude-code');
  });

  it('should maintain the cached list correctly', () => {
    const registry = new DefaultAgentRegistry();
    let types = registry.getAdapterTypes();
    expect(types.length).toBe(2);

    registry.registerAdapter('test-adapter-1', mockFactory);
    types = registry.getAdapterTypes();
    expect(types).toContain('test-adapter-1');
    expect(types.length).toBe(3);

    registry.registerAdapter('test-adapter-2', mockFactory);
    types = registry.getAdapterTypes();
    expect(types).toContain('test-adapter-2');
    expect(types.length).toBe(4);
  });
});
