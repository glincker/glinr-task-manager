/**
 * Issue Poller
 *
 * Polls GitHub for new issues labeled with ai-task that aren't in the queue yet.
 * Runs every 5 minutes to catch issues that webhooks might have missed.
 */

import { addTask, getTask } from '../queue/task-queue.js';
import type { CreateTaskInput } from '../types/task.js';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const AI_TASK_LABEL = process.env.GITHUB_AI_TASK_LABEL || 'ai-task';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPOS_TO_POLL = (process.env.GITHUB_REPOS_TO_POLL || '').split(',').filter(Boolean);

let pollerInterval: NodeJS.Timeout | null = null;

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: Array<{ name: string }>;
  user: { login: string };
  created_at: string;
  pull_request?: unknown;
}

/**
 * Fetch open issues with ai-task label from a repo
 */
async function fetchOpenIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=${AI_TASK_LABEL}&per_page=20`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'glinr-task-manager',
        },
      }
    );

    if (!response.ok) {
      console.error(`[Poller] Failed to fetch issues from ${owner}/${repo}: ${response.status}`);
      return [];
    }

    const issues = await response.json() as GitHubIssue[];

    // Filter out pull requests (GitHub API returns PRs in issues endpoint)
    return issues.filter(issue => !issue.pull_request);
  } catch (error) {
    console.error(`[Poller] Error fetching issues from ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Build task input from GitHub issue
 */
function issueToTask(issue: GitHubIssue, repo: string): CreateTaskInput {
  return {
    title: issue.title,
    description: issue.body || undefined,
    prompt: buildPromptFromIssue(issue, repo),
    priority: getPriorityFromLabels(issue.labels),
    source: 'github_issue',
    sourceId: issue.number.toString(),
    sourceUrl: issue.html_url,
    repository: repo,
    labels: issue.labels.map(l => l.name),
    metadata: {
      issueNumber: issue.number,
      author: issue.user.login,
      createdAt: issue.created_at,
      polled: true, // Mark as polled vs webhook
    },
  };
}

/**
 * Build autonomous prompt from issue
 */
function buildPromptFromIssue(issue: GitHubIssue, repo: string): string {
  const repoName = repo.split('/').pop();

  return `You are an autonomous AI developer working on ${repo}.

## Task: ${issue.title}

## Issue Description
${issue.body || 'No description provided.'}

## Workflow (FOLLOW EXACTLY)
1. cd ~/openclaw-workdir/${repoName}
2. git fetch origin && git checkout main && git pull
3. git checkout -b fix/issue-${issue.number}
4. Analyze the issue and implement the solution
5. Run build/tests to verify: pnpm install && pnpm build
6. Stage changes: git add -A
7. Commit with message following conventional commits:
   git commit -m "feat: <description>

Closes #${issue.number}

Co-Authored-By: Glinr <bot@glincker.com>"
8. Push: git push -u origin HEAD
9. Create PR: gh pr create --title "<title>" --body "Closes #${issue.number}"

## On Errors
- Fix any build/lint errors before committing
- If blocked, explain clearly what's wrong
- Never leave uncommitted changes

## Output
When done, provide:
- Summary of changes made
- Files modified
- PR URL
- Any concerns or follow-up items`;
}

/**
 * Get priority from labels
 */
function getPriorityFromLabels(labels: Array<{ name: string }>): number {
  const names = labels.map(l => l.name.toLowerCase());
  if (names.includes('critical') || names.includes('p0')) return 1;
  if (names.includes('high') || names.includes('p1')) return 2;
  if (names.includes('low') || names.includes('p3')) return 4;
  return 3;
}

/**
 * Poll all configured repos for new issues
 */
async function pollForIssues(): Promise<void> {
  if (!GITHUB_TOKEN) {
    console.log('[Poller] No GITHUB_TOKEN, skipping poll');
    return;
  }

  if (REPOS_TO_POLL.length === 0) {
    return;
  }

  console.log(`[Poller] Polling ${REPOS_TO_POLL.length} repos for ai-task issues...`);

  for (const repo of REPOS_TO_POLL) {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) continue;

    const issues = await fetchOpenIssues(owner, repoName);

    for (const issue of issues) {
      // Check if already in queue by sourceId
      const existingTask = getTask(`github_issue_${issue.number}_${repo}`);

      // Also check by iterating (since we use random UUIDs)
      // In production, add a proper index/lookup

      if (!existingTask) {
        console.log(`[Poller] Found new issue #${issue.number} in ${repo}: ${issue.title}`);

        try {
          const task = await addTask(issueToTask(issue, repo));
          console.log(`[Poller] Created task ${task.id} for issue #${issue.number}`);
        } catch (error) {
          console.error(`[Poller] Failed to create task for issue #${issue.number}:`, error);
        }
      }
    }
  }
}

/**
 * Start the issue poller
 */
export function startIssuePoller(): void {
  if (pollerInterval) {
    console.log('[Poller] Already running');
    return;
  }

  console.log('[Poller] Starting issue poller (interval: 5 minutes)');

  // Run immediately on start
  pollForIssues().catch(console.error);

  // Then run every 5 minutes
  pollerInterval = setInterval(() => {
    pollForIssues().catch(console.error);
  }, POLL_INTERVAL);
}

/**
 * Stop the issue poller
 */
export function stopIssuePoller(): void {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
    console.log('[Poller] Stopped');
  }
}
