/**
 * Skills Loader
 *
 * Loads skills from multiple directories with precedence:
 * workspace > managed > bundled > extra
 *
 * Following OpenClaw's proven patterns.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseSkillFile } from './frontmatter.js';
import type { Skill, SkillEntry, SkillEligibilityContext, SkillsConfig } from './types.js';
import { logger } from '../utils/logger.js';

const fsp = fs.promises;

// Default directories
const CONFIG_DIR = path.join(os.homedir(), '.glinr');
const MANAGED_SKILLS_DIR = path.join(CONFIG_DIR, 'skills');

/**
 * Check if a binary exists on PATH
 */
function hasBinary(bin: string): boolean {
  const paths = (process.env.PATH || '').split(path.delimiter);
  const extensions = process.platform === 'win32' ? ['', '.exe', '.cmd', '.bat'] : [''];

  for (const dir of paths) {
    for (const ext of extensions) {
      const fullPath = path.join(dir, bin + ext);
      try {
        fs.accessSync(fullPath, fs.constants.X_OK);
        return true;
      } catch {
        // Continue checking
      }
    }
  }
  return false;
}

/**
 * Check if skill should be included based on requirements
 */
export function shouldIncludeSkill(params: {
  entry: SkillEntry;
  config?: SkillsConfig;
  eligibility?: SkillEligibilityContext;
}): boolean {
  const { entry, config, eligibility } = params;
  const metadata = entry.metadata;

  // Check if explicitly disabled in config
  const skillKey = metadata?.skillKey ?? entry.skill.name;
  const skillConfig = config?.entries?.[skillKey];
  if (skillConfig?.enabled === false) {
    return false;
  }

  // If always flag is set, include regardless of other gates
  if (metadata?.always) {
    return true;
  }

  // Check OS requirement
  if (metadata?.os && metadata.os.length > 0) {
    const currentPlatform = process.platform;
    if (!metadata.os.includes(currentPlatform)) {
      // Check remote platforms if available
      const remotePlatforms = eligibility?.remote?.platforms || [];
      const hasMatchingRemote = metadata.os.some((os) => remotePlatforms.includes(os));
      if (!hasMatchingRemote) {
        return false;
      }
    }
  }

  // Check binary requirements
  const requires = metadata?.requires;
  if (requires) {
    // All bins must exist
    if (requires.bins && requires.bins.length > 0) {
      const checkBin = eligibility?.remote?.hasBin || hasBinary;
      for (const bin of requires.bins) {
        if (!checkBin(bin)) {
          return false;
        }
      }
    }

    // At least one bin must exist
    if (requires.anyBins && requires.anyBins.length > 0) {
      const checkAnyBin = eligibility?.remote?.hasAnyBin ||
        ((bins: string[]) => bins.some((b) => hasBinary(b)));
      if (!checkAnyBin(requires.anyBins)) {
        return false;
      }
    }

    // Environment variables must exist (or be in config)
    if (requires.env && requires.env.length > 0) {
      for (const envVar of requires.env) {
        if (!process.env[envVar] && !skillConfig?.env?.[envVar] && !skillConfig?.apiKey) {
          return false;
        }
      }
    }

    // MCP servers must be connected
    if (requires.mcp && requires.mcp.length > 0) {
      const connectedMcp = eligibility?.connectedMcpServers || [];
      for (const mcpServer of requires.mcp) {
        if (!connectedMcp.includes(mcpServer)) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Load skills from a single directory
 */
async function loadSkillsFromDir(
  dir: string,
  source: Skill['source']
): Promise<SkillEntry[]> {
  const entries: SkillEntry[] = [];

  try {
    const stat = await fsp.stat(dir);
    if (!stat.isDirectory()) {
      return entries;
    }
  } catch {
    return entries;
  }

  try {
    const items = await fsp.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory()) {
        continue;
      }

      const skillDir = path.join(dir, item.name);
      const skillFile = path.join(skillDir, 'SKILL.md');

      try {
        const content = await fsp.readFile(skillFile, 'utf-8');
        const entry = parseSkillFile(content, skillFile, skillDir, source);
        if (entry) {
          entries.push(entry);
        }
      } catch {
        // Skill file doesn't exist or is invalid
      }
    }
  } catch (error) {
    logger.warn(`[Skills] Failed to read directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return entries;
}

/**
 * Load all skills from multiple directories with precedence
 */
export async function loadAllSkills(params: {
  workspaceDir?: string;
  managedSkillsDir?: string;
  bundledSkillsDir?: string;
  extraDirs?: string[];
}): Promise<SkillEntry[]> {
  const {
    workspaceDir,
    managedSkillsDir = MANAGED_SKILLS_DIR,
    bundledSkillsDir,
    extraDirs = [],
  } = params;

  // Load from all sources
  const bundledSkills = bundledSkillsDir
    ? await loadSkillsFromDir(bundledSkillsDir, 'bundled')
    : [];

  const extraSkills: SkillEntry[] = [];
  for (const dir of extraDirs) {
    const resolved = dir.startsWith('~')
      ? path.join(os.homedir(), dir.slice(1))
      : dir;
    const skills = await loadSkillsFromDir(resolved, 'plugin');
    extraSkills.push(...skills);
  }

  const managedSkills = await loadSkillsFromDir(managedSkillsDir, 'managed');

  const workspaceSkills = workspaceDir
    ? await loadSkillsFromDir(path.join(workspaceDir, 'skills'), 'workspace')
    : [];

  // Merge with precedence: workspace > managed > bundled > extra
  const merged = new Map<string, SkillEntry>();

  for (const entry of extraSkills) {
    merged.set(entry.skill.name, entry);
  }
  for (const entry of bundledSkills) {
    merged.set(entry.skill.name, entry);
  }
  for (const entry of managedSkills) {
    merged.set(entry.skill.name, entry);
  }
  for (const entry of workspaceSkills) {
    merged.set(entry.skill.name, entry);
  }

  return Array.from(merged.values());
}

/**
 * Filter skills based on config and eligibility
 */
export function filterSkills(
  entries: SkillEntry[],
  config?: SkillsConfig,
  eligibility?: SkillEligibilityContext
): SkillEntry[] {
  return entries.filter((entry) => shouldIncludeSkill({ entry, config, eligibility }));
}

/**
 * Ensure managed skills directory exists
 */
export async function ensureManagedSkillsDir(): Promise<string> {
  try {
    await fsp.mkdir(MANAGED_SKILLS_DIR, { recursive: true });
  } catch {
    // Directory may already exist
  }
  return MANAGED_SKILLS_DIR;
}

/**
 * Get the default skills directory for the current project
 */
export function getProjectSkillsDir(projectRoot: string): string {
  return path.join(projectRoot, 'skills');
}

/**
 * Sync skills from one workspace to another (for sandboxing)
 */
export async function syncSkills(params: {
  sourceDir: string;
  targetDir: string;
  config?: SkillsConfig;
}): Promise<void> {
  const { sourceDir, targetDir, config } = params;

  if (sourceDir === targetDir) {
    return;
  }

  const targetSkillsDir = path.join(targetDir, 'skills');

  const entries = await loadAllSkills({
    workspaceDir: sourceDir,
    extraDirs: config?.load?.extraDirs,
  });

  // Clean target and recreate
  await fsp.rm(targetSkillsDir, { recursive: true, force: true });
  await fsp.mkdir(targetSkillsDir, { recursive: true });

  // Copy each skill
  for (const entry of entries) {
    const dest = path.join(targetSkillsDir, entry.skill.name);
    try {
      await fsp.cp(entry.skill.baseDir, dest, {
        recursive: true,
        force: true,
      });
    } catch (error) {
      logger.warn(`[Skills] Failed to copy ${entry.skill.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
