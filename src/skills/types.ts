/**
 * Skills System Types
 *
 * Following OpenClaw's proven patterns for skill management.
 * Skills are Markdown files that teach the AI about available capabilities.
 */

/**
 * Skill metadata from YAML frontmatter
 */
export interface SkillMetadata {
  /** Unique skill identifier */
  name: string;
  /** Short description shown in skill lists */
  description: string;
  /** Optional version */
  version?: string;
  /** Optional homepage URL */
  homepage?: string;
  /** Extended metadata in JSON format */
  glinr?: GlinrSkillMetadata;
}

/**
 * GLINR-specific skill metadata (inside metadata.glinr)
 */
export interface GlinrSkillMetadata {
  /** Always include this skill */
  always?: boolean;
  /** Override config key */
  skillKey?: string;
  /** Primary environment variable */
  primaryEnv?: string;
  /** UI emoji */
  emoji?: string;
  /** Homepage URL */
  homepage?: string;
  /** Platform filter (darwin, linux, win32) */
  os?: string[];
  /** Category for grouping */
  category?: string;
  /** Priority for ordering (higher = first) */
  priority?: number;
  /** Tools this skill teaches about */
  tools?: string[];
  /** MCP server this skill relates to */
  mcpServer?: string;
  /** Requirements for skill to be eligible */
  requires?: {
    /** All binaries must exist on PATH */
    bins?: string[];
    /** At least one binary must exist */
    anyBins?: string[];
    /** Environment variables must be set */
    env?: string[];
    /** Config paths must be truthy */
    config?: string[];
    /** MCP server must be connected */
    mcp?: string[];
  };
}

/**
 * Skill invocation policy
 */
export interface SkillInvocationPolicy {
  /** Can users invoke via slash command */
  userInvocable: boolean;
  /** Exclude from model prompt (user-only) */
  disableModelInvocation: boolean;
}

/**
 * Parsed skill frontmatter (raw key-value pairs)
 */
export type ParsedSkillFrontmatter = Record<string, string>;

/**
 * Loaded skill entry
 */
export interface Skill {
  /** Skill name from frontmatter */
  name: string;
  /** Description from frontmatter */
  description: string;
  /** Full skill content (Markdown) */
  content: string;
  /** Path to SKILL.md file */
  filePath: string;
  /** Directory containing the skill */
  baseDir: string;
  /** Source location type */
  source: 'workspace' | 'managed' | 'bundled' | 'plugin' | 'mcp';
}

/**
 * Full skill entry with metadata
 */
export interface SkillEntry {
  skill: Skill;
  frontmatter: ParsedSkillFrontmatter;
  metadata?: GlinrSkillMetadata;
  invocation?: SkillInvocationPolicy;
}

/**
 * Skill eligibility context (for remote nodes, etc.)
 */
export interface SkillEligibilityContext {
  /** Remote node capabilities */
  remote?: {
    platforms: string[];
    hasBin: (bin: string) => boolean;
    hasAnyBin: (bins: string[]) => boolean;
    note?: string;
  };
  /** Connected MCP servers */
  connectedMcpServers?: string[];
}

/**
 * Cached skill snapshot for a session
 */
export interface SkillSnapshot {
  /** Formatted prompt for LLM injection */
  prompt: string;
  /** List of eligible skills */
  skills: Array<{
    name: string;
    primaryEnv?: string;
    category?: string;
  }>;
  /** Full skill objects */
  resolvedSkills?: Skill[];
  /** Snapshot version for cache invalidation */
  version?: number;
}

/**
 * Skill configuration in glinr.json
 */
export interface SkillConfig {
  /** Enable/disable skill */
  enabled?: boolean;
  /** API key for primaryEnv */
  apiKey?: string;
  /** Environment variables to inject */
  env?: Record<string, string>;
  /** Custom config values */
  config?: Record<string, unknown>;
}

/**
 * Skills loading configuration
 */
export interface SkillsLoadConfig {
  /** Extra directories to load skills from */
  extraDirs?: string[];
  /** Watch for changes */
  watch?: boolean;
  /** Debounce interval in ms */
  watchDebounceMs?: number;
}

/**
 * Full skills configuration
 */
export interface SkillsConfig {
  /** Per-skill overrides */
  entries?: Record<string, SkillConfig>;
  /** Loading options */
  load?: SkillsLoadConfig;
  /** Allowlist for bundled skills */
  allowBundled?: string[];
}
