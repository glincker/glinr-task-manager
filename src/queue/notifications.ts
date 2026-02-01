import type { Task, TaskResult } from '../types/task.js';

/**
 * Post task result back to the source
 */
export async function postResultToSource(task: Task, result: TaskResult): Promise<void> {
  if (task.source === 'github_issue' || task.source === 'github_pr') {
    await postGitHubComment(task, result);
  }
  // Add other integrations here (Jira, Linear, etc.)
}

/**
 * Post a comment on GitHub with task results
 */
async function postGitHubComment(task: Task, result: TaskResult): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !task.repository || !task.sourceId) {
    console.log('[GitHub] Missing token or task info, skipping comment');
    return;
  }

  const [owner, repo] = task.repository.split('/');
  const issueNumber = parseInt(task.sourceId);

  // Build comment body
  let body = `## AI Task Result\n\n`;
  body += `**Status:** ${result.success ? '✅ Completed' : '❌ Failed'}\n\n`;

  if (result.output) {
    body += `### Summary\n\n${result.output}\n\n`;
  }

  if (result.artifacts && result.artifacts.length > 0) {
    body += `### Artifacts\n\n`;
    for (const artifact of result.artifacts) {
      if (artifact.type === 'commit') {
        body += `- Commit: \`${artifact.sha}\`\n`;
      } else if (artifact.type === 'pull_request') {
        body += `- Pull Request: ${artifact.url}\n`;
      } else if (artifact.type === 'file') {
        body += `- File: \`${artifact.path}\`\n`;
      }
    }
    body += '\n';
  }

  if (result.error) {
    body += `### Error\n\n\`\`\`\n${result.error.message}\n\`\`\`\n\n`;
  }

  if (result.duration) {
    body += `*Completed in ${(result.duration / 1000).toFixed(1)}s*\n`;
  }

  body += `\n---\n*Posted by [GLINR Task Manager](https://github.com/GLINCKER/glinr-task-manager)*`;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'glinr-task-manager',
        },
        body: JSON.stringify({ body }),
      }
    );

    if (!response.ok) {
      console.error('[GitHub] Failed to post comment:', await response.text());
    } else {
      console.log(`[GitHub] Posted result to issue #${issueNumber}`);
    }
  } catch (error) {
    console.error('[GitHub] Error posting comment:', error);
  }
}
