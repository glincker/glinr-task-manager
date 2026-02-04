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

// Cron tools
import {
  cronCreateTool,
  cronListTool,
  cronTriggerTool,
  cronPauseTool,
  cronArchiveTool,
  cronDeleteTool,
  cronHistoryTool,
  cronTools,
} from './cron-tool.js';

// Browser tools
import {
  browserNavigateTool,
  browserSnapshotTool,
  browserClickTool,
  browserTypeTool,
  browserSearchTool,
  browserScreenshotTool,
  browserPagesTool,
  browserCloseTool,
  browserTools,
} from './browser.js';

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

// Cron tools exports
export {
  cronCreateTool,
  cronListTool,
  cronTriggerTool,
  cronPauseTool,
  cronArchiveTool,
  cronDeleteTool,
  cronHistoryTool,
  cronTools,
} from './cron-tool.js';
export type {
  CronCreateParams,
  CronCreateResult,
  CronListParams,
  CronListResult,
  CronTriggerParams,
  CronTriggerResult,
  CronPauseParams,
  CronPauseResult,
  CronArchiveParams,
  CronArchiveResult,
  CronDeleteParams,
  CronDeleteResult,
  CronHistoryParams,
  CronHistoryResult,
} from './cron-tool.js';

// Browser tools exports
export {
  browserNavigateTool,
  browserSnapshotTool,
  browserClickTool,
  browserTypeTool,
  browserSearchTool,
  browserScreenshotTool,
  browserPagesTool,
  browserCloseTool,
  browserTools,
} from './browser.js';

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
export type {
  BrowserNavigateResult,
  BrowserSnapshotResult,
  BrowserClickResult,
  BrowserTypeResult,
  BrowserSearchResult,
  BrowserScreenshotResult,
  BrowserPagesResult,
  BrowserCloseResult,
} from './browser.js';

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
  // Cron tools (6)
  ...cronTools,
  // Browser tools (8)
  ...browserTools,
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
