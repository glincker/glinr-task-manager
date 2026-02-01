import { describe, it, expect } from 'vitest';
import { ClaudeCodeAdapter } from './claude-code.js';
import { AgentConfig } from '../types/agent.js';

describe('ClaudeCodeAdapter', () => {
  const config: AgentConfig = {
    id: 'test-agent',
    type: 'claude-code',
    enabled: true,
    maxConcurrent: 1,
    priority: 1,
    config: {},
  };

  it('should extract artifacts correctly', () => {
    const adapter = new ClaudeCodeAdapter(config);
    // Access private method
    const extractArtifacts = (adapter as any).extractArtifacts.bind(adapter);

    const output = `
      Some text.
      commit 1a2b3c4
      commit 5d6e7f8

      Link to PR: https://github.com/org/repo/pull/123

      Modified: src/file1.ts
      Created: src/file2.ts
    `;

    const artifacts = extractArtifacts(output);

    expect(artifacts).toHaveLength(5);

    // Check commits
    const commits = artifacts.filter((a: any) => a.type === 'commit');
    expect(commits).toHaveLength(2);
    expect(commits[0].sha).toBe('1a2b3c4');
    expect(commits[1].sha).toBe('5d6e7f8');

    // Check PRs
    const prs = artifacts.filter((a: any) => a.type === 'pull_request');
    expect(prs).toHaveLength(1);
    expect(prs[0].url).toBe('https://github.com/org/repo/pull/123');

    // Check files
    const files = artifacts.filter((a: any) => a.type === 'file');
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe('src/file1.ts');
    expect(files[1].path).toBe('src/file2.ts');
  });

  it('should handle empty output', () => {
    const adapter = new ClaudeCodeAdapter(config);
    const extractArtifacts = (adapter as any).extractArtifacts.bind(adapter);
    const artifacts = extractArtifacts('');
    expect(artifacts).toHaveLength(0);
  });

  it('should handle output with no matches', () => {
    const adapter = new ClaudeCodeAdapter(config);
    const extractArtifacts = (adapter as any).extractArtifacts.bind(adapter);
    const artifacts = extractArtifacts('Just some text with no artifacts.');
    expect(artifacts).toHaveLength(0);
  });
});
