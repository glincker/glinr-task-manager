/**
 * Tool Call Card
 *
 * Displays tool execution information in chat messages.
 * Shows tool name, arguments, and output in a collapsible format.
 */

import { useState } from 'react';
import {
  Terminal,
  FileCode,
  Search,
  Globe,
  Settings,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status?: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
}

interface ToolCallCardProps {
  tool: ToolCall;
  className?: string;
}

// Map tool names to icons
const TOOL_ICONS: Record<string, typeof Terminal> = {
  exec: Terminal,
  bash: Terminal,
  shell: Terminal,
  read_file: FileCode,
  write_file: FileCode,
  edit_file: FileCode,
  search_files: Search,
  grep: Search,
  glob: Search,
  web_fetch: Globe,
  web_search: Globe,
  system_info: Settings,
  env_vars: Settings,
  git_status: FileCode,
  git_diff: FileCode,
  git_log: FileCode,
  git_commit: FileCode,
  database: Database,
  query: Database,
  default: Terminal,
};

// Get display label for tool
function getToolLabel(name: string): string {
  const labels: Record<string, string> = {
    exec: 'Run Command',
    bash: 'Bash',
    shell: 'Shell',
    read_file: 'Read File',
    write_file: 'Write File',
    edit_file: 'Edit File',
    search_files: 'Search Files',
    grep: 'Search Content',
    glob: 'Find Files',
    web_fetch: 'Fetch URL',
    web_search: 'Web Search',
    system_info: 'System Info',
    env_vars: 'Environment',
    git_status: 'Git Status',
    git_diff: 'Git Diff',
    git_log: 'Git Log',
    git_commit: 'Git Commit',
  };
  return labels[name] || name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format tool arguments for display
function formatArguments(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '';

  // For single command/path argument, show just the value
  if (entries.length === 1) {
    const [key, value] = entries[0];
    if (key === 'command' || key === 'path' || key === 'query' || key === 'url') {
      return String(value);
    }
  }

  // Show key: value pairs, truncated
  return entries
    .map(([key, value]) => {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      const truncated = strValue.length > 50 ? strValue.slice(0, 50) + '...' : strValue;
      return `${key}: ${truncated}`;
    })
    .join(', ');
}

// Format result for preview
function formatResultPreview(result: unknown): string {
  if (result === null || result === undefined) return '';
  if (typeof result === 'string') {
    return result.length > 100 ? result.slice(0, 100) + '...' : result;
  }
  const json = JSON.stringify(result, null, 2);
  return json.length > 100 ? json.slice(0, 100) + '...' : json;
}

export function ToolCallCard({ tool, className }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const Icon = TOOL_ICONS[tool.name] || TOOL_ICONS.default;
  const label = getToolLabel(tool.name);
  const argsDisplay = formatArguments(tool.arguments);
  const hasResult = tool.result !== undefined && tool.result !== null;
  const resultPreview = hasResult ? formatResultPreview(tool.result) : '';
  const isSuccess = tool.status === 'success' || (hasResult && tool.status !== 'error');
  const isError = tool.status === 'error';
  const isPending = tool.status === 'pending' || tool.status === 'running';

  const handleCopy = async () => {
    const content = hasResult
      ? typeof tool.result === 'string'
        ? tool.result
        : JSON.stringify(tool.result, null, 2)
      : '';
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'my-2 rounded-lg border border-border bg-muted/30 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
      >
        <div
          className={cn(
            'p-1.5 rounded-md',
            isError ? 'bg-red-500/20' : 'bg-primary/20'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              isError ? 'text-red-500' : 'text-primary'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{label}</span>
            {isPending && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 animate-pulse" />
                Running...
              </span>
            )}
            {isSuccess && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {isError && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
          {argsDisplay && (
            <div className="text-xs text-muted-foreground font-mono truncate">
              {argsDisplay}
            </div>
          )}
        </div>
        {hasResult && (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )
        )}
        {tool.duration && (
          <span className="text-xs text-muted-foreground shrink-0">
            {tool.duration}ms
          </span>
        )}
      </button>

      {/* Preview (when collapsed and has result) */}
      {!expanded && hasResult && resultPreview && (
        <div className="px-3 pb-2">
          <div className="text-xs text-muted-foreground font-mono bg-background/50 rounded px-2 py-1 truncate">
            {resultPreview}
          </div>
        </div>
      )}

      {/* Expanded content */}
      {expanded && hasResult && (
        <div className="border-t border-border">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Output</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="px-3 pb-3">
            <pre className="text-xs font-mono bg-background/50 rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto">
              {typeof tool.result === 'string'
                ? tool.result
                : JSON.stringify(tool.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolCallCard;
