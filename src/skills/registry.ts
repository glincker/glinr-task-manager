/**
 * Skills Registry
 *
 * Central registry for managing skills and their snapshots.
 * Supports MCP server discovery for dynamic capability extension.
 */

import type {
  Skill,
  SkillEntry,
  SkillSnapshot,
  SkillsConfig,
  SkillEligibilityContext,
} from './types.js';
import { loadAllSkills, filterSkills } from './loader.js';
import { buildSkillSnapshot, formatSkillsForPrompt, estimateSkillsTokenCost } from './prompt-builder.js';
import { logger } from '../utils/logger.js';

/**
 * MCP Server capability info
 */
export interface MCPServerInfo {
  name: string;
  connected: boolean;
  tools: Array<{
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
  }>;
  resources?: Array<{
    uri: string;
    name: string;
    description?: string;
  }>;
}

/**
 * Skills Registry - manages loaded skills and snapshots
 */
export class SkillsRegistry {
  private entries: Map<string, SkillEntry> = new Map();
  private snapshot: SkillSnapshot | null = null;
  private snapshotVersion = 0;
  private config: SkillsConfig = {};
  private workspaceDir: string | null = null;
  private mcpServers: Map<string, MCPServerInfo> = new Map();

  /**
   * Initialize the registry with a workspace
   */
  async initialize(params: {
    workspaceDir?: string;
    config?: SkillsConfig;
  }): Promise<void> {
    this.workspaceDir = params.workspaceDir || null;
    this.config = params.config || {};
    await this.reload();
  }

  /**
   * Reload all skills from disk
   */
  async reload(): Promise<void> {
    const allEntries = await loadAllSkills({
      workspaceDir: this.workspaceDir || undefined,
      extraDirs: this.config.load?.extraDirs,
    });

    this.entries.clear();
    for (const entry of allEntries) {
      this.entries.set(entry.skill.name, entry);
    }

    // Invalidate snapshot
    this.snapshotVersion++;
    this.snapshot = null;

    logger.info(`[SkillsRegistry] Loaded ${this.entries.size} skills`);
  }

  /**
   * Register an MCP server and its capabilities
   */
  registerMCPServer(info: MCPServerInfo): void {
    this.mcpServers.set(info.name, info);

    // Create a dynamic skill for this MCP server
    const mcpSkill: SkillEntry = {
      skill: {
        name: `mcp-${info.name}`,
        description: `MCP server: ${info.name} - ${info.tools.length} tools available`,
        content: this.generateMCPSkillContent(info),
        filePath: `mcp://${info.name}`,
        baseDir: `mcp://${info.name}`,
        source: 'mcp',
      },
      frontmatter: {
        name: `mcp-${info.name}`,
        description: `MCP server capabilities for ${info.name}`,
      },
      metadata: {
        category: 'mcp',
        mcpServer: info.name,
        tools: info.tools.map((t) => t.name),
      },
      invocation: {
        userInvocable: true,
        disableModelInvocation: false,
      },
    };

    this.entries.set(mcpSkill.skill.name, mcpSkill);

    // Invalidate snapshot
    this.snapshotVersion++;
    this.snapshot = null;

    logger.info(`[SkillsRegistry] Registered MCP server: ${info.name} with ${info.tools.length} tools`);
  }

  /**
   * Unregister an MCP server
   */
  unregisterMCPServer(name: string): void {
    this.mcpServers.delete(name);
    this.entries.delete(`mcp-${name}`);

    // Invalidate snapshot
    this.snapshotVersion++;
    this.snapshot = null;
  }

  /**
   * Generate skill content from MCP server info
   */
  private generateMCPSkillContent(info: MCPServerInfo): string {
    const toolDocs = info.tools.map((tool) => {
      const params = tool.inputSchema
        ? `\nParameters: ${JSON.stringify(tool.inputSchema, null, 2)}`
        : '';
      return `### ${tool.name}\n${tool.description}${params}`;
    }).join('\n\n');

    const resourceDocs = info.resources && info.resources.length > 0
      ? `\n## Resources\n\n${info.resources.map((r) => `- **${r.name}** (${r.uri}): ${r.description || 'No description'}`).join('\n')}`
      : '';

    return `# MCP Server: ${info.name}

This server provides the following capabilities via MCP (Model Context Protocol).

## Available Tools

${toolDocs}
${resourceDocs}

## Usage

Call these tools using the MCP protocol. The tools will be executed by the MCP server.
`;
  }

  /**
   * Get all entries (raw, unfiltered)
   */
  getAllEntries(): SkillEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get eligible entries based on current context
   */
  getEligibleEntries(eligibility?: SkillEligibilityContext): SkillEntry[] {
    const contextWithMcp: SkillEligibilityContext = {
      ...eligibility,
      connectedMcpServers: Array.from(this.mcpServers.keys()),
    };
    return filterSkills(this.getAllEntries(), this.config, contextWithMcp);
  }

  /**
   * Get a skill by name
   */
  getSkill(name: string): SkillEntry | undefined {
    return this.entries.get(name);
  }

  /**
   * Get connected MCP servers
   */
  getMCPServers(): MCPServerInfo[] {
    return Array.from(this.mcpServers.values());
  }

  /**
   * Get or build skills snapshot for the current session
   */
  async getSnapshot(eligibility?: SkillEligibilityContext): Promise<SkillSnapshot> {
    // Return cached snapshot if still valid
    if (this.snapshot && this.snapshot.version === this.snapshotVersion) {
      return this.snapshot;
    }

    // Build fresh snapshot
    const contextWithMcp: SkillEligibilityContext = {
      ...eligibility,
      connectedMcpServers: Array.from(this.mcpServers.keys()),
    };

    this.snapshot = await buildSkillSnapshot({
      workspaceDir: this.workspaceDir || undefined,
      config: this.config,
      entries: this.getAllEntries(),
      eligibility: contextWithMcp,
      version: this.snapshotVersion,
    });

    return this.snapshot;
  }

  /**
   * Get skills prompt for injection into system message
   */
  async getSkillsPrompt(eligibility?: SkillEligibilityContext): Promise<string> {
    const snapshot = await this.getSnapshot(eligibility);
    return snapshot.prompt;
  }

  /**
   * Estimate token cost of current skills
   */
  async estimateTokenCost(eligibility?: SkillEligibilityContext): Promise<number> {
    const eligible = this.getEligibleEntries(eligibility);
    const skills = eligible
      .filter((e) => e.invocation?.disableModelInvocation !== true)
      .map((e) => e.skill);
    return estimateSkillsTokenCost(skills);
  }

  /**
   * Update configuration
   */
  setConfig(config: SkillsConfig): void {
    this.config = config;
    // Invalidate snapshot on config change
    this.snapshotVersion++;
    this.snapshot = null;
  }

  /**
   * Get list of loaded skill names
   */
  getLoadedSkillNames(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get registry stats
   */
  getStats(): {
    totalSkills: number;
    bySource: Record<string, number>;
    mcpServers: number;
    estimatedTokens: number;
  } {
    const bySource: Record<string, number> = {};
    for (const entry of this.entries.values()) {
      const source = entry.skill.source;
      bySource[source] = (bySource[source] || 0) + 1;
    }

    const eligible = this.getEligibleEntries();
    const skills = eligible
      .filter((e) => e.invocation?.disableModelInvocation !== true)
      .map((e) => e.skill);

    return {
      totalSkills: this.entries.size,
      bySource,
      mcpServers: this.mcpServers.size,
      estimatedTokens: estimateSkillsTokenCost(skills),
    };
  }
}

// Singleton instance
let registryInstance: SkillsRegistry | null = null;

/**
 * Get the global skills registry instance
 */
export function getSkillsRegistry(): SkillsRegistry {
  if (!registryInstance) {
    registryInstance = new SkillsRegistry();
  }
  return registryInstance;
}

/**
 * Initialize the global skills registry
 */
export async function initializeSkillsRegistry(params: {
  workspaceDir?: string;
  config?: SkillsConfig;
}): Promise<SkillsRegistry> {
  const registry = getSkillsRegistry();
  await registry.initialize(params);
  return registry;
}
