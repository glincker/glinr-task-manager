/**
 * Built-in Tools
 *
 * Export all built-in tools and registration function.
 */

import { getToolRegistry } from '../registry.js';
import type { ToolDefinition } from '../types.js';

// Core tools
import { execTool } from './exec.js';
import { webFetchTool } from './web-fetch.js';
import { readFileTool, writeFileTool, searchFilesTool, grepTool } from './file-ops.js';

// Git tools
import {
  gitStatusTool,
  gitDiffTool,
  gitLogTool,
  gitCommitTool,
  gitBranchTool,
  gitStashTool,
  gitRemoteTool,
} from './git.js';

// System tools
import {
  envTool,
  systemInfoTool,
  processListTool,
  pathInfoTool,
  whichTool,
} from './system.js';

// Session tools
import { sessionStatusTool } from './session-status.js';

// Export individual tools
export { execTool } from './exec.js';
export { webFetchTool } from './web-fetch.js';
export { readFileTool, writeFileTool, searchFilesTool, grepTool } from './file-ops.js';
export {
  gitStatusTool,
  gitDiffTool,
  gitLogTool,
  gitCommitTool,
  gitBranchTool,
  gitStashTool,
  gitRemoteTool,
} from './git.js';
export {
  envTool,
  systemInfoTool,
  processListTool,
  pathInfoTool,
  whichTool,
} from './system.js';
export { sessionStatusTool, getSessionModel, setSessionModel, clearSessionModel } from './session-status.js';

// Export types for external use
export type { ExecResult } from './exec.js';
export type { WebFetchResult } from './web-fetch.js';
export type { ReadFileResult, WriteFileResult, SearchFilesResult, GrepResult, GrepMatch } from './file-ops.js';
export type { GitResult } from './git.js';
export type {
  EnvResult,
  SystemInfoResult,
  ProcessListResult,
  PathInfoResult,
  WhichResult,
} from './system.js';
export type { SessionStatusResult } from './session-status.js';

// All built-in tools (typed as generic ToolDefinition array)
export const builtinTools: ToolDefinition<any, any>[] = [
  // Core tools (6)
  execTool,
  webFetchTool,
  readFileTool,
  writeFileTool,
  searchFilesTool,
  grepTool,
  // Git tools (7)
  gitStatusTool,
  gitDiffTool,
  gitLogTool,
  gitCommitTool,
  gitBranchTool,
  gitStashTool,
  gitRemoteTool,
  // System tools (5)
  envTool,
  systemInfoTool,
  processListTool,
  pathInfoTool,
  whichTool,
  // Session tools (1)
  sessionStatusTool,
];

/**
 * Register all built-in tools
 */
export function registerBuiltinTools(): void {
  const registry = getToolRegistry();
  for (const tool of builtinTools) {
    registry.register(tool);
  }
}
