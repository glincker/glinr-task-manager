#!/usr/bin/env node
/**
 * GLINR MCP Server
 *
 * Model Context Protocol server for Claude Code integration.
 * Allows Claude Code to report task progress to GLINR with minimal token usage.
 *
 * Usage:
 *   npx @glincker/task-manager-mcp
 *   OR
 *   node dist/mcp/server.js
 *
 * Claude Code settings.json:
 * {
 *   "mcpServers": {
 *     "glinr": {
 *       "command": "npx",
 *       "args": ["@glincker/task-manager-mcp"]
 *     }
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

// MCP Server configuration
const GLINR_API_URL = process.env.GLINR_API_URL || 'http://localhost:3000';

// In-memory session state (MCP server is per-session)
interface SessionState {
  sessionId: string;
  startTime: Date;
  filesModified: string[];
  filesCreated: string[];
  tokenUsage: {
    input: number;
    output: number;
  };
  currentTask?: {
    id: string;
    title: string;
    startedAt: Date;
  };
}

const sessionState: SessionState = {
  sessionId: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  startTime: new Date(),
  filesModified: [],
  filesCreated: [],
  tokenUsage: {
    input: 0,
    output: 0,
  },
};

// Create MCP server
const server = new Server(
  {
    name: 'glinr-task-manager',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {
        listChanged: true,
      },
    },
  }
);

// Define available tools
const TOOLS = [
  {
    name: 'glinr__log_task',
    description: 'Log current task progress to GLINR for tracking. Use this when starting work on a task or making significant progress.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: {
          type: 'string',
          description: 'Optional task ID if tracking an existing task',
        },
        title: {
          type: 'string',
          description: 'Short title describing the current work',
        },
        summary: {
          type: 'string',
          description: 'Brief summary of what you are doing or have done',
        },
        filesChanged: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of files you have modified or created',
        },
      },
      required: ['title', 'summary'],
    },
  },
  {
    name: 'glinr__complete_task',
    description: 'Mark a task as complete with a final summary. Use this when you finish working on a task.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: {
          type: 'string',
          description: 'The task ID to complete',
        },
        summary: {
          type: 'string',
          description: 'Final summary of what was accomplished',
        },
        prUrl: {
          type: 'string',
          description: 'URL of the pull request if one was created',
        },
        filesChanged: {
          type: 'array',
          items: { type: 'string' },
          description: 'Final list of all files modified or created',
        },
      },
      required: ['summary'],
    },
  },
  {
    name: 'glinr__report_usage',
    description: 'Report token usage for cost tracking. GLINR uses this to track AI costs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        inputTokens: {
          type: 'number',
          description: 'Number of input tokens used',
        },
        outputTokens: {
          type: 'number',
          description: 'Number of output tokens used',
        },
        model: {
          type: 'string',
          description: 'Model name (e.g., claude-opus-4-5-20251101)',
        },
      },
      required: ['inputTokens', 'outputTokens', 'model'],
    },
  },
  {
    name: 'glinr__get_context',
    description: 'Get relevant context from past tasks. Use this to find information about previous work on similar tasks.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant past tasks',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 5)',
        },
      },
      required: ['query'],
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'glinr__log_task':
        return await handleLogTask(args as unknown as LogTaskArgs);

      case 'glinr__complete_task':
        return await handleCompleteTask(args as unknown as CompleteTaskArgs);

      case 'glinr__report_usage':
        return await handleReportUsage(args as unknown as ReportUsageArgs);

      case 'glinr__get_context':
        return await handleGetContext(args as unknown as GetContextArgs);

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Tool argument types
interface LogTaskArgs {
  taskId?: string;
  title: string;
  summary: string;
  filesChanged?: string[];
}

interface CompleteTaskArgs {
  taskId?: string;
  summary: string;
  prUrl?: string;
  filesChanged?: string[];
}

interface ReportUsageArgs {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

interface GetContextArgs {
  query: string;
  limit?: number;
}

// Tool handlers
async function handleLogTask(args: LogTaskArgs): Promise<CallToolResult> {
  // Update session state
  if (args.filesChanged) {
    for (const file of args.filesChanged) {
      if (!sessionState.filesModified.includes(file)) {
        sessionState.filesModified.push(file);
      }
    }
  }

  // Store current task
  sessionState.currentTask = {
    id: args.taskId || sessionState.sessionId,
    title: args.title,
    startedAt: new Date(),
  };

  // Try to report to GLINR API
  try {
    const response = await fetch(`${GLINR_API_URL}/api/hook/tool-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'PostToolUse',
        tool: 'glinr__log_task',
        session_id: sessionState.sessionId,
        timestamp: new Date().toISOString(),
        input: args,
      }),
    });

    if (!response.ok) {
      console.error('[MCP] Failed to report to GLINR:', response.statusText);
    }
  } catch (error) {
    // Silently fail - don't block the agent
    console.error('[MCP] Failed to connect to GLINR:', error);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Task logged: ${args.title}\nSession: ${sessionState.sessionId}\nFiles tracked: ${sessionState.filesModified.length}`,
      },
    ],
  };
}

async function handleCompleteTask(args: CompleteTaskArgs): Promise<CallToolResult> {
  // Update session state
  if (args.filesChanged) {
    for (const file of args.filesChanged) {
      if (!sessionState.filesModified.includes(file)) {
        sessionState.filesModified.push(file);
      }
    }
  }

  const taskId = args.taskId || sessionState.currentTask?.id || sessionState.sessionId;

  // Try to report to GLINR API
  try {
    const response = await fetch(`${GLINR_API_URL}/api/hook/session-end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'Stop',
        reason: 'completed',
        session_id: sessionState.sessionId,
        timestamp: new Date().toISOString(),
        summary: args.summary,
        files_changed: sessionState.filesModified,
        duration_ms: Date.now() - sessionState.startTime.getTime(),
      }),
    });

    if (!response.ok) {
      console.error('[MCP] Failed to report completion to GLINR:', response.statusText);
    }
  } catch (error) {
    console.error('[MCP] Failed to connect to GLINR:', error);
  }

  // Clear current task
  sessionState.currentTask = undefined;

  const prInfo = args.prUrl ? `\nPR: ${args.prUrl}` : '';
  return {
    content: [
      {
        type: 'text',
        text: `Task completed: ${taskId}\nSummary: ${args.summary}\nFiles modified: ${sessionState.filesModified.length}${prInfo}`,
      },
    ],
  };
}

async function handleReportUsage(args: ReportUsageArgs): Promise<CallToolResult> {
  // Accumulate token usage
  sessionState.tokenUsage.input += args.inputTokens;
  sessionState.tokenUsage.output += args.outputTokens;

  // Calculate approximate cost (simplified pricing)
  const cost = calculateCost(args.inputTokens, args.outputTokens, args.model);

  return {
    content: [
      {
        type: 'text',
        text: `Usage recorded:\nInput: ${args.inputTokens} tokens\nOutput: ${args.outputTokens} tokens\nModel: ${args.model}\nEstimated cost: $${cost.toFixed(4)}\n\nSession totals:\nInput: ${sessionState.tokenUsage.input} tokens\nOutput: ${sessionState.tokenUsage.output} tokens`,
      },
    ],
  };
}

async function handleGetContext(args: GetContextArgs): Promise<CallToolResult> {
  const limit = args.limit || 5;

  // Try to fetch context from GLINR API
  try {
    const response = await fetch(
      `${GLINR_API_URL}/api/tasks?limit=${limit}&search=${encodeURIComponent(args.query)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { tasks?: Array<{ title: string; description?: string; status: string }> };
      const tasks = data.tasks || [];

      if (tasks.length === 0) {
        return {
          content: [{ type: 'text', text: 'No relevant past tasks found.' }],
        };
      }

      const taskSummaries = tasks
        .map((t: { title: string; description?: string; status: string }) =>
          `- ${t.title} (${t.status}): ${t.description || 'No description'}`
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${tasks.length} relevant task(s):\n\n${taskSummaries}`,
          },
        ],
      };
    }
  } catch (error) {
    console.error('[MCP] Failed to fetch context from GLINR:', error);
  }

  // Fallback if API unavailable
  return {
    content: [
      {
        type: 'text',
        text: 'Could not fetch context from GLINR. The server may be unavailable.',
      },
    ],
  };
}

// Cost calculation (simplified)
function calculateCost(input: number, output: number, model: string): number {
  // Pricing per 1M tokens (simplified)
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-opus-4-5-20251101': { input: 15, output: 75 },
    'claude-sonnet-4-20250514': { input: 3, output: 15 },
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
    'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
    default: { input: 3, output: 15 },
  };

  const rates = pricing[model] || pricing.default;
  return (input * rates.input + output * rates.output) / 1_000_000;
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup to stderr (stdout is for MCP protocol)
  console.error('[GLINR MCP] Server started');
  console.error(`[GLINR MCP] Session ID: ${sessionState.sessionId}`);
  console.error(`[GLINR MCP] API URL: ${GLINR_API_URL}`);
}

main().catch((error) => {
  console.error('[GLINR MCP] Fatal error:', error);
  process.exit(1);
});
