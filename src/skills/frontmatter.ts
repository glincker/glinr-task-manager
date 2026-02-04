/**
 * Skill Frontmatter Parser
 *
 * Parses YAML frontmatter from SKILL.md files.
 * Following OpenClaw's patterns for compatibility.
 */

import type {
  ParsedSkillFrontmatter,
  GlinrSkillMetadata,
  SkillInvocationPolicy,
  Skill,
  SkillEntry,
} from './types.js';

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(content: string): ParsedSkillFrontmatter {
  const frontmatter: ParsedSkillFrontmatter = {};

  // Match YAML frontmatter block
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return frontmatter;
  }

  const yamlContent = match[1];
  const lines = yamlContent.split(/\r?\n/);

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    // Parse key: value pairs (single-line only, following OpenClaw)
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return frontmatter;
}

/**
 * Get markdown content after frontmatter
 */
export function getMarkdownContent(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}

/**
 * Normalize string list from various input formats
 */
function normalizeStringList(input: unknown): string[] {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Parse boolean from string value
 */
function parseBooleanValue(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase().trim();
  if (lower === 'true' || lower === '1' || lower === 'yes') return true;
  if (lower === 'false' || lower === '0' || lower === 'no') return false;
  return undefined;
}

/**
 * Get frontmatter value as string
 */
function getFrontmatterValue(frontmatter: ParsedSkillFrontmatter, key: string): string | undefined {
  const raw = frontmatter[key];
  return typeof raw === 'string' ? raw : undefined;
}

/**
 * Parse frontmatter boolean with fallback
 */
function parseFrontmatterBool(value: string | undefined, fallback: boolean): boolean {
  const parsed = parseBooleanValue(value);
  return parsed === undefined ? fallback : parsed;
}

/**
 * Resolve GLINR-specific metadata from frontmatter
 */
export function resolveGlinrMetadata(
  frontmatter: ParsedSkillFrontmatter
): GlinrSkillMetadata | undefined {
  const raw = getFrontmatterValue(frontmatter, 'metadata');
  if (!raw) {
    return undefined;
  }

  try {
    // Parse JSON5/JSON metadata
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return undefined;
    }

    // Look for glinr-specific metadata (support legacy 'openclaw' key too)
    const metadataRaw = parsed.glinr || parsed.openclaw;
    if (!metadataRaw || typeof metadataRaw !== 'object') {
      return undefined;
    }

    const metadataObj = metadataRaw as Record<string, unknown>;
    const requiresRaw = typeof metadataObj.requires === 'object' && metadataObj.requires !== null
      ? (metadataObj.requires as Record<string, unknown>)
      : undefined;

    const osRaw = normalizeStringList(metadataObj.os);
    const toolsRaw = normalizeStringList(metadataObj.tools);

    return {
      always: typeof metadataObj.always === 'boolean' ? metadataObj.always : undefined,
      emoji: typeof metadataObj.emoji === 'string' ? metadataObj.emoji : undefined,
      homepage: typeof metadataObj.homepage === 'string' ? metadataObj.homepage : undefined,
      skillKey: typeof metadataObj.skillKey === 'string' ? metadataObj.skillKey : undefined,
      primaryEnv: typeof metadataObj.primaryEnv === 'string' ? metadataObj.primaryEnv : undefined,
      category: typeof metadataObj.category === 'string' ? metadataObj.category : undefined,
      priority: typeof metadataObj.priority === 'number' ? metadataObj.priority : undefined,
      mcpServer: typeof metadataObj.mcpServer === 'string' ? metadataObj.mcpServer : undefined,
      os: osRaw.length > 0 ? osRaw : undefined,
      tools: toolsRaw.length > 0 ? toolsRaw : undefined,
      requires: requiresRaw ? {
        bins: normalizeStringList(requiresRaw.bins),
        anyBins: normalizeStringList(requiresRaw.anyBins),
        env: normalizeStringList(requiresRaw.env),
        config: normalizeStringList(requiresRaw.config),
        mcp: normalizeStringList(requiresRaw.mcp),
      } : undefined,
    };
  } catch {
    return undefined;
  }
}

/**
 * Resolve skill invocation policy from frontmatter
 */
export function resolveSkillInvocationPolicy(
  frontmatter: ParsedSkillFrontmatter
): SkillInvocationPolicy {
  return {
    userInvocable: parseFrontmatterBool(
      getFrontmatterValue(frontmatter, 'user-invocable'),
      true
    ),
    disableModelInvocation: parseFrontmatterBool(
      getFrontmatterValue(frontmatter, 'disable-model-invocation'),
      false
    ),
  };
}

/**
 * Resolve skill key for config lookup
 */
export function resolveSkillKey(skill: Skill, entry?: SkillEntry): string {
  return entry?.metadata?.skillKey ?? skill.name;
}

/**
 * Parse a SKILL.md file into a SkillEntry
 */
export function parseSkillFile(
  content: string,
  filePath: string,
  baseDir: string,
  source: Skill['source']
): SkillEntry | null {
  const frontmatter = parseFrontmatter(content);

  // Name and description are required
  const name = getFrontmatterValue(frontmatter, 'name');
  const description = getFrontmatterValue(frontmatter, 'description');

  if (!name) {
    return null;
  }

  const skill: Skill = {
    name,
    description: description || name,
    content: getMarkdownContent(content),
    filePath,
    baseDir,
    source,
  };

  return {
    skill,
    frontmatter,
    metadata: resolveGlinrMetadata(frontmatter),
    invocation: resolveSkillInvocationPolicy(frontmatter),
  };
}
