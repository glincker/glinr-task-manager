import type { Context } from 'hono';
import { createHmac, timingSafeEqual } from 'crypto';
import type { CreateTaskInput } from '../types/task.js';

/**
 * Jira Webhook Integration
 *
 * Receives webhooks from Jira and creates tasks from issues.
 *
 * Supported events:
 * - issue.created - New issue created
 * - issue.updated - Issue updated
 */

const WEBHOOK_SECRET = process.env.JIRA_WEBHOOK_SECRET || '';

/**
 * Verify Jira webhook signature
 */
export function verifyJiraSignature(
  payload: string,
  signature: string | undefined
): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('JIRA_WEBHOOK_SECRET not set - skipping signature verification');
    return true;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = `sha256=${createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`;

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Handle Jira webhook
 */
export async function handleJiraWebhook(
  c: Context
): Promise<CreateTaskInput | null> {
  const event = c.req.header('X-Jira-Event') as string;
  const signature = c.req.header('X-Hub-Signature');
  const rawBody = await c.req.text();

  // Verify signature
  if (!verifyJiraSignature(rawBody, signature)) {
    throw new Error('Invalid webhook signature');
  }

  const payload = JSON.parse(rawBody);

  switch (event) {
    case 'issue_created':
      return handleIssueCreatedEvent(payload);
    case 'issue_updated':
      return handleIssueUpdatedEvent(payload);
    default:
      console.log(`[Jira Webhook] Unhandled event: ${event}`);
      return null;
  }
}

/**
 * Handle issue created events
 */
function handleIssueCreatedEvent(payload: any): CreateTaskInput | null {
  const { issue } = payload;

  // Create task from issue
  return {
    title: issue.fields.summary,
    description: issue.fields.description || undefined,
    priority: 3,
    prompt: `Please analyze the new Jira issue: ${issue.key}.`,
    source: 'jira_issue' as const,
    sourceId: issue.id,
    sourceUrl: issue.permalink,
    labels: [],
    metadata: {
      issueId: issue.id,
      createdAt: issue.fields.created,
    },
  };
}

/**
 * Handle issue updated events
 */
function handleIssueUpdatedEvent(payload: any): CreateTaskInput | null {
  const { issue } = payload;

  // Create task from updated issue
  return {
    title: `Updated Jira Issue: ${issue.fields.summary}`,
    description: issue.fields.description || undefined,
    priority: 3,
    prompt: `Please review the updates to the Jira issue: ${issue.key}.`,
    source: 'jira_issue_update' as const,
    sourceId: issue.id,
    sourceUrl: issue.permalink,
    labels: [],
    metadata: {
      issueId: issue.id,
      updatedAt: issue.fields.updated,
    },
  };
}