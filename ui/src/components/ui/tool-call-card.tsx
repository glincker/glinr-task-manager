/**
 * Tool Call Card
 *
 * Displays tool execution information in chat messages.
 * Shows tool name, arguments, and output in a collapsible format.
 */

import { useState } from "react";
import {
  Terminal,
  FileCode,
  Search,
  Globe,
  Settings,
  Database,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status?: "pending" | "running" | "success" | "error";
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
    exec: "Run Command",
    bash: "Bash",
    shell: "Shell",
    read_file: "Read File",
    write_file: "Write File",
    edit_file: "Edit File",
    search_files: "Search Files",
    grep: "Search Content",
    glob: "Find Files",
    web_fetch: "Fetch URL",
    web_search: "Web Search",
    system_info: "System Info",
    env_vars: "Environment",
    git_status: "Git Status",
    git_diff: "Git Diff",
    git_log: "Git Log",
    git_commit: "Git Commit",
  };
  return (
    labels[name] ||
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// Format tool arguments for display
function formatArguments(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return "";

  // For single command/path argument, show just the value
  if (entries.length === 1) {
    const [key, value] = entries[0];
    if (
      key === "command" ||
      key === "path" ||
      key === "query" ||
      key === "url"
    ) {
      return String(value);
    }
  }

  // Show key: value pairs, truncated
  return entries
    .map(([key, value]) => {
      const strValue =
        typeof value === "string" ? value : JSON.stringify(value);
      const truncated =
        strValue.length > 50 ? strValue.slice(0, 50) + "..." : strValue;
      return `${key}: ${truncated}`;
    })
    .join(", ");
}

// Format result for preview
function formatResultPreview(result: unknown): string {
  if (result === null || result === undefined) return "";
  if (typeof result === "string") {
    return result.length > 100 ? result.slice(0, 100) + "..." : result;
  }
  const json = JSON.stringify(result, null, 2);
  return json.length > 100 ? json.slice(0, 100) + "..." : json;
}

function inferToolStatus(
  tool: ToolCall,
  hasResult: boolean,
): ToolCall["status"] {
  if (tool.status) return tool.status;
  if (!hasResult) return undefined;

  if (tool.result && typeof tool.result === "object") {
    const record = tool.result as Record<string, unknown>;
    if (record.pending === true) return "pending";
    if (record.success === false || record.error) return "error";
  }

  return "success";
}

export function ToolCallCard({ tool, className }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const Icon = TOOL_ICONS[tool.name] || TOOL_ICONS.default;
  const label = getToolLabel(tool.name);
  const argsDisplay = formatArguments(tool.arguments);
  const hasResult = tool.result !== undefined && tool.result !== null;
  const resultPreview = hasResult ? formatResultPreview(tool.result) : "";
  const inferredStatus = inferToolStatus(tool, hasResult);
  const isSuccess = inferredStatus === "success";
  const isError = inferredStatus === "error";
  const isPending =
    inferredStatus === "pending" || inferredStatus === "running";

  const handleCopy = async () => {
    const content = hasResult
      ? typeof tool.result === "string"
        ? tool.result
        : JSON.stringify(tool.result, null, 2)
      : "";
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "my-3 premium-card overflow-hidden group/card",
        isError && "border-red-500/20",
        className,
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${label} tool results`}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-foreground/[0.02] transition-colors text-left"
      >
        <div
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300",
            isError
              ? "bg-red-500/10 text-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]"
              : "bg-primary/10 text-primary shadow-[0_0_15px_-3px_var(--primary-glow)]",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-[14px] leading-tight tracking-tight">
              {label}
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              {isPending && (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse status-glow-info" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Running
                  </span>
                </>
              )}
              {isSuccess && (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 status-glow-success" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">
                    Success
                  </span>
                </>
              )}
              {isError && (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 status-glow-destructive" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                    Failed
                  </span>
                </>
              )}
            </div>
          </div>
          {argsDisplay && (
            <div className="text-[11px] text-muted-foreground/80 font-mono truncate opacity-60 group-hover/card:opacity-100 transition-opacity">
              {argsDisplay}
            </div>
          )}
        </div>

        <div className="ml-2 flex items-center gap-2">
          {tool.duration && (
            <span className="text-[10px] font-mono font-medium text-muted-foreground/40">
              {tool.duration}ms
            </span>
          )}
          {hasResult && (
            <div
              className={cn(
                "p-1 rounded-md transition-transform duration-200",
                expanded && "rotate-180",
              )}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </button>

      {/* Preview Stats / Preview (recessed style) */}
      {!expanded && hasResult && resultPreview && (
        <div className="px-4 pb-3">
          <div className="recessed-card p-2 rounded-lg">
            <div className="text-[11px] text-muted-foreground/90 font-mono line-clamp-2 leading-relaxed">
              {resultPreview}
            </div>
          </div>
        </div>
      )}

      {/* Expanded content */}
      {expanded && hasResult && (
        <div className="border-t border-border/10">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Output
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
              aria-label="Copy tool output"
            >
              {copied ? (
                <Check
                  className="h-3.5 w-3.5 text-green-400"
                  aria-hidden="true"
                />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
          <div className="px-4 pb-4">
            <pre className="text-[12px] font-mono bg-black/20 rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap break-all border border-white/5 scrollbar-glass">
              {typeof tool.result === "string"
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
