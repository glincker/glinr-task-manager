import type { Context } from 'hono';
import { createHmac, timingSafeEqual } from 'crypto';
import type { CreateTaskInput } from '../types/task.js';

/**
 * Linear Webhook Integration
 *
 * Receives webhooks from Linear and creates tasks from issues.
 *
 * Supported events:
 * - issue.created - New issue created
 * - issue.updated - Issue updated
 */

const WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET || '';

/**
 * Verify Linear webhook signature
 */
export function verifyLinearSignature(
  payload: string,
  signature: string | undefined
): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('LINEAR_WEBHOOK_SECRET not set - skipping signature verification');
    return true;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  try {
    const providedSignatureBuffer = Buffer.from(signature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');

    return timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer);
  } catch {
    return false;
  }
}

/**
 * Handle Linear webhook
 */
export async function handleLinearWebhook(
  c: Context
): Promise<CreateTaskInput | null> {
  const event = c.req.header('X-Linear-Event') as string;
  const signature = c.req.header('X-Hub-Signature');
  const rawBody = await c.req.text();

  // Verify signature
  if (!verifyLinearSignature(rawBody, signature)) {
    throw new Error('Invalid webhook signature');
  }

  const payload = JSON.parse(rawBody);

  switch (event) {
    case 'issue.created':
      return handleIssueCreatedEvent(payload);
    case 'issue.updated':
      return handleIssueUpdatedEvent(payload);
    default:
      console.log(`[Linear Webhook] Unhandled event: ${event}`);
      return null;
  }
}

/**
 * Handle issue created events
 */
function handleIssueCreatedEvent(payload: any): CreateTaskInput | null {
  const { issue } = payload as { issue: LinearIssue };

  // Create task from issue
  return {
    title: issue.title,
    description: issue.description || undefined,
    priority: 3,
    prompt: `Please analyze the new Linear issue: ${issue.id}.`,
    source: 'linear_issue' as const,
    sourceId: issue.id,
    sourceUrl: issue.url,
    labels: extractLabels(issue),
    metadata: {
      issueId: issue.id,
      createdAt: issue.createdAt,
    },
  };
}

/**
 * Handle issue updated events
 */
function handleIssueUpdatedEvent(payload: any): CreateTaskInput | null {
  const { issue } = payload as { issue: LinearIssue };

  // Create task from updated issue
  return {
    title: `Updated Linear Issue: ${issue.title}`,
    description: issue.description || undefined,
    priority: 3,
    prompt: `Please review the updates to the Linear issue: ${issue.id}.`,
    source: 'linear_issue_update' as const,
    sourceId: issue.id,
    sourceUrl: issue.url,
    labels: extractLabels(issue),
    metadata: {
      issueId: issue.id,
      updatedAt: issue.updatedAt,
    },
  };
}

/**
 * Extract labels from Linear issue
 * Linear issues can have labels as an array of label objects with a 'name' property
 */
function extractLabels(issue: LinearIssue): string[] {
  // Linear webhooks include labels as an array of label objects
  if (issue.labels && Array.isArray(issue.labels)) {
    return issue.labels.map((label: LinearLabel) => label.name);
  }
  
  return [];
}

// Linear API types (simplified)
interface LinearLabel {
  name: string;
}

interface LinearIssue {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  createdAt: string;
  updatedAt?: string;
  labels?: LinearLabel[] | null;
}