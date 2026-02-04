/**
 * Skills Prompt Builder
 *
 * Formats eligible skills into prompt context for the LLM.
 * Following OpenClaw's XML format for compatibility.
 */

import type { Skill, SkillEntry, SkillSnapshot, SkillsConfig, SkillEligibilityContext } from './types.js';
import { loadAllSkills, filterSkills } from './loader.js';
import { logger } from '../utils/logger.js';

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format a single skill for prompt injection
 */
function formatSkillForPrompt(skill: Skill): string {
  const name = escapeXml(skill.name);
  const description = escapeXml(skill.description);
  const location = escapeXml(skill.filePath);

  return `<skill>
<name>${name}</name>
<description>${description}</description>
<location>${location}</location>
<content>
${skill.content}
</content>
</skill>`;
}

/**
 * Format multiple skills for prompt injection
 * Following OpenClaw's XML format
 */
export function formatSkillsForPrompt(skills: Skill[]): string {
  if (skills.length === 0) {
    return '';
  }

  const formatted = skills.map(formatSkillForPrompt).join('\n\n');

  return `<available_skills>
The following skills are available. Use them to understand how to accomplish tasks:

${formatted}
</available_skills>`;
}

/**
 * Build a skill snapshot for a session
 */
export async function buildSkillSnapshot(params: {
  workspaceDir?: string;
  config?: SkillsConfig;
  entries?: SkillEntry[];
  eligibility?: SkillEligibilityContext;
  version?: number;
}): Promise<SkillSnapshot> {
  const { workspaceDir, config, entries: providedEntries, eligibility, version } = params;

  // Load entries if not provided
  const allEntries = providedEntries ?? await loadAllSkills({
    workspaceDir,
    extraDirs: config?.load?.extraDirs,
  });

  // Filter to eligible skills
  const eligible = filterSkills(allEntries, config, eligibility);

  // Filter out skills that shouldn't be in the model prompt
  const promptEntries = eligible.filter(
    (entry) => entry.invocation?.disableModelInvocation !== true
  );

  const resolvedSkills = promptEntries.map((entry) => entry.skill);

  // Build remote note if applicable
  const remoteNote = eligibility?.remote?.note?.trim();
  const prompt = [remoteNote, formatSkillsForPrompt(resolvedSkills)]
    .filter(Boolean)
    .join('\n');

  logger.info(`[Skills] Built snapshot with ${eligible.length} eligible skills (${resolvedSkills.length} for prompt)`);

  return {
    prompt,
    skills: eligible.map((entry) => ({
      name: entry.skill.name,
      primaryEnv: entry.metadata?.primaryEnv,
      category: entry.metadata?.category,
    })),
    resolvedSkills,
    version,
  };
}

/**
 * Build skills prompt for a single run
 */
export async function buildSkillsPrompt(params: {
  workspaceDir?: string;
  config?: SkillsConfig;
  entries?: SkillEntry[];
  eligibility?: SkillEligibilityContext;
}): Promise<string> {
  const snapshot = await buildSkillSnapshot(params);
  return snapshot.prompt;
}

/**
 * Resolve skills prompt from snapshot or build fresh
 */
export async function resolveSkillsPromptForRun(params: {
  skillsSnapshot?: SkillSnapshot;
  entries?: SkillEntry[];
  config?: SkillsConfig;
  workspaceDir?: string;
}): Promise<string> {
  // Use cached snapshot if available
  const snapshotPrompt = params.skillsSnapshot?.prompt?.trim();
  if (snapshotPrompt) {
    return snapshotPrompt;
  }

  // Build from entries if provided
  if (params.entries && params.entries.length > 0) {
    return buildSkillsPrompt({
      workspaceDir: params.workspaceDir,
      entries: params.entries,
      config: params.config,
    });
  }

  // No skills available
  return '';
}

/**
 * Get skill by name from snapshot
 */
export function getSkillFromSnapshot(
  snapshot: SkillSnapshot,
  name: string
): Skill | undefined {
  return snapshot.resolvedSkills?.find((s) => s.name === name);
}

/**
 * Calculate approximate token cost of skills prompt
 * Based on OpenClaw's formula: ~4 chars per token
 */
export function estimateSkillsTokenCost(skills: Skill[]): number {
  if (skills.length === 0) {
    return 0;
  }

  // Base overhead: ~195 chars
  let totalChars = 195;

  for (const skill of skills) {
    // Per skill: ~97 chars + field lengths
    totalChars += 97;
    totalChars += skill.name.length;
    totalChars += skill.description.length;
    totalChars += skill.filePath.length;
    totalChars += skill.content.length;
  }

  // Rough estimate: ~4 chars per token
  return Math.ceil(totalChars / 4);
}
