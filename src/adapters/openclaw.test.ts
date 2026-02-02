
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

  it('handles concurrent extractArtifacts calls without race conditions', async () => {
    // Create different messages to test concurrent extraction
    const messages = [
      {
        message: `
          commit aaa1111
          https://github.com/owner1/repo1/pull/100
          modified file src/file1.ts
        `,
        expected: {
          commits: ['aaa1111'],
          prs: [{ owner: 'owner1', repo: 'repo1', number: 100 }],
          files: ['src/file1.ts'],
        },
      },
      {
        message: `
          commit bbb2222
          commit ccc3333
          https://github.com/owner2/repo2/pull/200
          created file src/file2.ts
          edited src/file3.ts
        `,
        expected: {
          commits: ['bbb2222', 'ccc3333'],
          prs: [{ owner: 'owner2', repo: 'repo2', number: 200 }],
          files: ['src/file2.ts', 'src/file3.ts'],
        },
      },
      {
        message: `
          commit ddd4444
          https://github.com/owner3/repo3/pull/300
          https://github.com/owner4/repo4/pull/400
          wrote file src/file4.ts
        `,
        expected: {
          commits: ['ddd4444'],
          prs: [
            { owner: 'owner3', repo: 'repo3', number: 300 },
            { owner: 'owner4', repo: 'repo4', number: 400 },
          ],
          files: ['src/file4.ts'],
        },
      },
    ];

    // Execute extractArtifacts concurrently
    const results = await Promise.all(
      messages.map((msg) => {
        const response = { message: msg.message };
        // @ts-ignore - Accessing private method
        return (adapter as any).extractArtifacts(response);
      })
    );

    // Verify each result matches its expected output
    results.forEach((artifacts, index) => {
      const expected = messages[index].expected;
      
      // Check commits
      const commits = artifacts.filter((a: any) => a.type === 'commit');
      expect(commits).toHaveLength(expected.commits.length);
      expected.commits.forEach((sha, i) => {
        expect(commits[i].sha).toBe(sha);
      });

      // Check PRs
      const prs = artifacts.filter((a: any) => a.type === 'pull_request');
      expect(prs).toHaveLength(expected.prs.length);
      expected.prs.forEach((pr, i) => {
        expect(prs[i].metadata.owner).toBe(pr.owner);
        expect(prs[i].metadata.repo).toBe(pr.repo);
        expect(prs[i].metadata.number).toBe(pr.number);
      });

      // Check files
      const files = artifacts.filter((a: any) => a.type === 'file');
      expect(files).toHaveLength(expected.files.length);
      expected.files.forEach((path, i) => {
        expect(files[i].path).toBe(path);
      });
    });
  });
});
