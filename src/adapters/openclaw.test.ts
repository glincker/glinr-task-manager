
import { describe, it, expect } from 'vitest';
import { OpenClawAdapter } from './openclaw.js';
import type { AgentConfig } from '../types/agent.js';

describe('OpenClawAdapter', () => {
  const config: AgentConfig = {
    id: 'test-agent',
    type: 'openclaw',
    enabled: true,
    maxConcurrent: 1,
    priority: 1,
    config: {
      token: 'test-token',
    },
  };

  const adapter = new OpenClawAdapter(config);

  it('extracts artifacts correctly', () => {
    const message = `
      Result:
      commit a1b2c3d
      https://github.com/owner/repo/pull/123
      modified file src/index.ts
    `;

    const response = {
      message,
    };

    // @ts-ignore - Accessing private method
    const artifacts = (adapter as any).extractArtifacts(response);

    expect(artifacts).toHaveLength(3);

    expect(artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'commit', sha: 'a1b2c3d' }),
      expect.objectContaining({
        type: 'pull_request',
        url: 'https://github.com/owner/repo/pull/123',
        metadata: { owner: 'owner', repo: 'repo', number: 123 }
      }),
      expect.objectContaining({ type: 'file', path: 'src/index.ts' }),
    ]));
  });

  it('handles multiple artifacts of same type', () => {
     const message = `
      commit 1111111
      commit 2222222
    `;

    const response = { message };
    // @ts-ignore
    const artifacts = (adapter as any).extractArtifacts(response);

    expect(artifacts).toHaveLength(2);
    expect(artifacts[0].sha).toBe('1111111');
    expect(artifacts[1].sha).toBe('2222222');
  });
});
