/**
 * Summary Extractor
 *
 * Extracts structured summaries from agent outputs without
 * requiring additional AI calls (zero-cost extraction).
 */

import type {
  CreateSummaryInput,
  FileChange,
  Decision,
  Blocker,
  ArtifactReference,
} from '../types/summary.js';
import type { TaskResult, TaskArtifact } from '../types/task.js';
import type { SessionAggregate } from '../hooks/types.js';
import type { HookInference } from '../hooks/types.js';

// ============================================================================
// Patterns for extraction
// ============================================================================

// File change patterns
const FILE_CREATED_PATTERN = /(?:created?|added?|wrote?|new file)[:\s]+[`"']?([^\s`"'\n]+)[`"']?/gi;
const FILE_MODIFIED_PATTERN = /(?:modified?|updated?|changed?|edited?)[:\s]+[`"']?([^\s`"'\n]+)[`"']?/gi;
const FILE_DELETED_PATTERN = /(?:deleted?|removed?)[:\s]+[`"']?([^\s`"'\n]+)[`"']?/gi;

// Artifact patterns
const COMMIT_SHA_PATTERN = /\b([a-f0-9]{7,40})\b/g;
const PR_URL_PATTERN = /https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/gi;
const ISSUE_PATTERN = /#(\d+)/g;
const BRANCH_PATTERN = /(?:branch|checkout|switch)[:\s]+[`"']?([^\s`"'\n]+)[`"']?/gi;

// Decision patterns
const DECISION_PATTERNS = [
  /(?:decided? to|chose? to|opted? (?:for|to)|selected?)[:\s]+(.+?)(?:\.|$)/gi,
  /(?:instead of|rather than)[:\s]+(.+?)(?:,|\.|\n|$)/gi,
];

// Blocker patterns
const ERROR_PATTERN = /(?:error|failed?|couldn't|cannot|issue)[:\s]+(.+?)(?:\.|$)/gi;
const WARNING_PATTERN = /(?:warning|warn|caution)[:\s]+(.+?)(?:\.|$)/gi;

// Summary section patterns
const SUMMARY_SECTION_PATTERN = /##?\s*(?:summary|what changed|changes)[:\s]*\n([\s\S]*?)(?=\n##|$)/i;
const WHY_SECTION_PATTERN = /##?\s*(?:why|motivation|reason)[:\s]*\n([\s\S]*?)(?=\n##|$)/i;
const HOW_SECTION_PATTERN = /##?\s*(?:how|approach|implementation)[:\s]*\n([\s\S]*?)(?=\n##|$)/i;

// ============================================================================
// Main Extraction Functions
// ============================================================================

/**
 * Extract a summary from a task result
 */
export async function extractFromTaskResult(
  result: TaskResult,
  context?: {
    taskId?: string;
    agent?: string;
    model?: string;
    startedAt?: Date;
  }
): Promise<CreateSummaryInput> {
  // Try Ollama-based summary generation first if configured
  const { getOllamaService } = await import('../intelligence/ollama.js');
  const { loadConfig } = await import('../utils/config-loader.js');
  
  const config = loadConfig<any>('settings.yml');
  const summaryProvider = config.ai?.defaultSummaryProvider || 'pattern';

  if (summaryProvider === 'ollama' || summaryProvider === 'auto') {
    try {
      const ollama = getOllamaService();
      const ollamaSummary = await ollama.generateSummary(result, context || {});
      
      if (ollamaSummary) {
        return ollamaSummary;
      }
    } catch (error) {
      // Fall through to pattern-based extraction
      console.debug('[Extractor] Ollama summary failed, using pattern extraction');
    }
  }

  // Fallback to pattern-based extraction
  const output = result.output || '';
  const now = new Date();

  // Extract structured data
  const filesChanged = extractFileChanges(output, result.artifacts);
  const decisions = extractDecisions(output);
  const blockers = extractBlockers(output, result.error);
  const artifacts = extractArtifacts(output, result.artifacts);

  // Extract sections
  const whatChanged = extractSection(output, SUMMARY_SECTION_PATTERN) ||
    generateWhatChanged(filesChanged, artifacts);
  const whyChanged = extractSection(output, WHY_SECTION_PATTERN);
  const howChanged = extractSection(output, HOW_SECTION_PATTERN);

  // Generate title
  const title = generateTitle(whatChanged, filesChanged, artifacts);

  return {
    taskId: context?.taskId,
    agent: context?.agent || 'unknown',
    model: context?.model,
    startedAt: context?.startedAt,
    completedAt: now,
    durationMs: result.duration,
    title,
    whatChanged,
    whyChanged,
    howChanged,
    filesChanged,
    decisions,
    blockers,
    artifacts,
    tokensUsed: result.tokensUsed ? {
      input: result.tokensUsed.input,
      output: result.tokensUsed.output,
      total: result.tokensUsed.total,
    } : undefined,
    cost: result.cost ? {
      amount: result.cost.amount,
      currency: result.cost.currency,
    } : undefined,
    rawOutput: output,
  };
}

/**
 * Extract a summary from a session aggregate
 */
export function extractFromSession(
  session: SessionAggregate,
  inference?: HookInference
): CreateSummaryInput {
  const filesChanged: FileChange[] = [
    ...session.filesCreated.map(path => ({
      path,
      action: 'created' as const,
    })),
    ...session.filesModified.map(path => ({
      path,
      action: 'modified' as const,
    })),
  ];

  // Generate what changed from file list
  const whatChanged = generateWhatChanged(filesChanged, []);

  // Generate title from inference
  const title = inference?.commitMessage ||
    `${inference?.taskType || 'Work'} on ${inference?.component || 'codebase'}`;

  return {
    sessionId: session.sessionId,
    agent: 'claude-code',
    startedAt: session.startTime,
    completedAt: session.endTime,
    durationMs: session.endTime && session.startTime
      ? session.endTime.getTime() - session.startTime.getTime()
      : undefined,
    title,
    whatChanged,
    filesChanged,
    taskType: inference?.taskType,
    component: inference?.component,
    linkedIssue: inference?.linkedIssue,
    linkedPr: inference?.linkedPr,
  };
}

/**
 * Extract a summary from raw agent output
 */
export function extractFromRawOutput(
  output: string,
  context?: {
    agent?: string;
    model?: string;
    taskId?: string;
    sessionId?: string;
  }
): CreateSummaryInput {
  const filesChanged = extractFileChanges(output);
  const decisions = extractDecisions(output);
  const blockers = extractBlockers(output);
  const artifacts = extractArtifacts(output);

  // Extract sections
  const whatChanged = extractSection(output, SUMMARY_SECTION_PATTERN) || 
    generateWhatChanged(filesChanged, artifacts);
  const whyChanged = extractSection(output, WHY_SECTION_PATTERN);
  const howChanged = extractSection(output, HOW_SECTION_PATTERN);

  // Generate title
  const title = generateTitle(whatChanged, filesChanged, artifacts);

  return {
    taskId: context?.taskId,
    sessionId: context?.sessionId,
    agent: context?.agent || 'unknown',
    model: context?.model,
    title,
    whatChanged,
    whyChanged,
    howChanged,
    filesChanged,
    decisions,
    blockers,
    artifacts,
    rawOutput: output,
  };
}

// ============================================================================
// Extraction Helpers
// ============================================================================

/**
 * Extract file changes from output and artifacts
 */
function extractFileChanges(
  output: string,
  artifacts?: TaskArtifact[]
): FileChange[] {
  const changes: FileChange[] = [];
  const seen = new Set<string>();

  // From artifacts
  if (artifacts) {
    for (const artifact of artifacts) {
      if (artifact.type === 'file' && artifact.path && !seen.has(artifact.path)) {
        seen.add(artifact.path);
        changes.push({
          path: artifact.path,
          action: 'modified', // Default to modified
        });
      }
    }
  }

  // From output text
  const addFromPattern = (pattern: RegExp, action: FileChange['action']) => {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(output)) !== null) {
      const path = match[1];
      if (path && !seen.has(path) && isValidFilePath(path)) {
        seen.add(path);
        changes.push({ path, action });
      }
    }
  };

  addFromPattern(FILE_CREATED_PATTERN, 'created');
  addFromPattern(FILE_MODIFIED_PATTERN, 'modified');
  addFromPattern(FILE_DELETED_PATTERN, 'deleted');

  return changes;
}

/**
 * Extract decisions from output
 */
function extractDecisions(output: string): Decision[] {
  const decisions: Decision[] = [];

  for (const pattern of DECISION_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(output)) !== null) {
      const description = match[1].trim();
      if (description.length > 10 && description.length < 500) {
        decisions.push({ description });
      }
    }
  }

  return decisions.slice(0, 10); // Limit to 10 decisions
}

/**
 * Extract blockers from output and errors
 */
function extractBlockers(
  output: string,
  error?: TaskResult['error']
): Blocker[] {
  const blockers: Blocker[] = [];

  // From error
  if (error) {
    blockers.push({
      description: error.message,
      severity: 'error',
      resolved: false,
    });
  }

  // From output - errors
  ERROR_PATTERN.lastIndex = 0;
  let match;
  while ((match = ERROR_PATTERN.exec(output)) !== null) {
    const description = match[1].trim();
    if (description.length > 5 && description.length < 500) {
      blockers.push({
        description,
        severity: 'error',
        resolved: true, // Assume resolved if in output
      });
    }
  }

  // From output - warnings
  WARNING_PATTERN.lastIndex = 0;
  while ((match = WARNING_PATTERN.exec(output)) !== null) {
    const description = match[1].trim();
    if (description.length > 5 && description.length < 500) {
      blockers.push({
        description,
        severity: 'warning',
        resolved: true,
      });
    }
  }

  return blockers.slice(0, 10); // Limit
}

/**
 * Extract artifacts from output and task artifacts
 */
function extractArtifacts(
  output: string,
  taskArtifacts?: TaskArtifact[]
): ArtifactReference[] {
  const artifacts: ArtifactReference[] = [];
  const seen = new Set<string>();

  // From task artifacts
  if (taskArtifacts) {
    for (const artifact of taskArtifacts) {
      const key = `${artifact.type}:${artifact.url || artifact.sha || artifact.path}`;
      if (!seen.has(key)) {
        seen.add(key);
        artifacts.push({
          type: artifact.type,
          url: artifact.url,
          identifier: artifact.sha,
        });
      }
    }
  }

  // Extract PR URLs
  PR_URL_PATTERN.lastIndex = 0;
  let match;
  while ((match = PR_URL_PATTERN.exec(output)) !== null) {
    const url = match[0];
    const prNumber = match[1];
    const key = `pull_request:${prNumber}`;
    if (!seen.has(key)) {
      seen.add(key);
      artifacts.push({
        type: 'pull_request',
        url,
        identifier: prNumber,
      });
    }
  }

  return artifacts;
}

/**
 * Extract a section from markdown output
 */
function extractSection(output: string, pattern: RegExp): string | undefined {
  const match = output.match(pattern);
  if (match && match[1]) {
    return match[1].trim().slice(0, 1000); // Limit length
  }
  return undefined;
}

/**
 * Generate what changed summary from file changes
 */
function generateWhatChanged(
  files: FileChange[],
  artifacts: ArtifactReference[]
): string {
  const parts: string[] = [];

  const created = files.filter(f => f.action === 'created');
  const modified = files.filter(f => f.action === 'modified');
  const deleted = files.filter(f => f.action === 'deleted');

  if (created.length > 0) {
    parts.push(`Created ${created.length} file(s)`);
  }
  if (modified.length > 0) {
    parts.push(`Modified ${modified.length} file(s)`);
  }
  if (deleted.length > 0) {
    parts.push(`Deleted ${deleted.length} file(s)`);
  }

  const prs = artifacts.filter(a => a.type === 'pull_request');
  if (prs.length > 0) {
    parts.push(`Created ${prs.length} PR(s)`);
  }

  const commits = artifacts.filter(a => a.type === 'commit');
  if (commits.length > 0) {
    parts.push(`Made ${commits.length} commit(s)`);
  }

  return parts.join('. ') || 'No changes detected';
}

/**
 * Generate a title from summary content
 */
function generateTitle(
  whatChanged: string,
  files: FileChange[],
  artifacts: ArtifactReference[]
): string {
  // Use first file if available
  if (files.length > 0) {
    const firstFile = files[0];
    const action = firstFile.action === 'created' ? 'Add' :
      firstFile.action === 'deleted' ? 'Remove' : 'Update';
    const fileName = firstFile.path.split('/').pop() || firstFile.path;
    return `${action} ${fileName}${files.length > 1 ? ` (+${files.length - 1} more)` : ''}`;
  }

  // Use artifact if available
  if (artifacts.length > 0) {
    const pr = artifacts.find(a => a.type === 'pull_request');
    if (pr) {
      return `Create PR #${pr.identifier}`;
    }
  }

  // Fall back to what changed
  return whatChanged.slice(0, 100);
}

/**
 * Check if a string looks like a valid file path
 */
function isValidFilePath(path: string): boolean {
  // Must have an extension or be a known config file
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(path);
  const isConfig = /^\.?[a-zA-Z]+rc|config|package\.json|tsconfig/i.test(path);
  const isValidChars = /^[a-zA-Z0-9_./-]+$/.test(path);

  return isValidChars && (hasExtension || isConfig) && path.length < 200;
}
