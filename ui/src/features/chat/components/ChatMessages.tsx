/**
 * Chat Messages Component
 *
 * Displays the message list with markdown rendering, tool call cards,
 * and collapsible thinking blocks (like Claude's reasoning disclosure).
 */

import { useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { ToolCallCard } from '@/components/ui/tool-call-card';
import { cn } from '@/lib/utils';
import type { Message, ChatPreset, QuickAction } from '../types';
import { ThinkingBlock, FilteredJsonBlock } from './ThinkingBlock';
import { parseThinking } from '../utils/parse-thinking';

// Preset icon helper (simplified version)
function PresetIcon({ className }: { icon?: string; className?: string }) {
  return <Bot className={className} />;
}

interface ChatMessagesProps {
  messages: Message[];
  currentPreset?: ChatPreset;
  quickActions: QuickAction[];
  healthyProviders: number;
  copiedId: string | null;
  onCopy: (content: string, id: string) => void;
  onRetry: (messageId: string) => void;
  onQuickAction: (prompt: string) => void;
  onOpenProviderSetup: () => void;
}

/**
 * Parse message content to extract thinking and clean response
 */
function useProcessedMessage(content: string, isLoading: boolean) {
  return useMemo(() => {
    if (isLoading || !content) {
      return { content, thinking: null, filteredJson: [], wasProcessed: false };
    }
    return parseThinking(content);
  }, [content, isLoading]);
}

export function ChatMessages({
  messages,
  currentPreset,
  quickActions,
  healthyProviders,
  copiedId,
  onCopy,
  onRetry,
  onQuickAction,
  onOpenProviderSetup,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] p-8 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
          <div className="h-20 w-20 rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 shadow-sm">
            <PresetIcon icon={currentPreset?.icon || 'bot'} className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight text-foreground">
            {currentPreset?.name || 'Start a conversation'}
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground mb-8">
            {currentPreset?.description || 'Ask me anything about GLINR, your tasks, or get help with coding.'}
          </p>

          {healthyProviders > 0 && quickActions.length > 0 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {quickActions.slice(0, 4).map((action) => (
                <button
                  key={action.id}
                  onClick={() => onQuickAction(action.prompt)}
                  className="px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group shadow-sm"
                  aria-label={`Quick action: ${action.label}`}
                >
                  <p className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{action.label}</p>
                  <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-700 mt-2 rounded-full group-hover:bg-blue-500/50 group-hover:w-16 transition-all duration-300" />
                </button>
              ))}
            </div>
          )}

          {healthyProviders === 0 && (
            <button
              onClick={onOpenProviderSetup}
              className="group flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium shadow-sm"
              aria-label="Configure a provider to start chatting"
            >
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              Configure provider to start
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 glass rounded-2xl p-4 overflow-y-auto overflow-x-hidden space-y-4"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          copiedId={copiedId}
          onCopy={onCopy}
          onRetry={onRetry}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * Individual message item - separated for hook usage
 */
function MessageItem({
  message,
  copiedId,
  onCopy,
  onRetry,
}: {
  message: Message;
  copiedId: string | null;
  onCopy: (content: string, id: string) => void;
  onRetry: (messageId: string) => void;
}) {
  // Parse thinking and filter raw JSON for assistant messages
  const processed = useProcessedMessage(
    message.content,
    message.isLoading ?? false
  );

  return (
    <div
      className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300',
          message.role === 'user' 
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 hidden sm:flex' 
            : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500 dark:text-zinc-400'
        )}
      >
        {message.role === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-[1.25rem] px-5 py-3 group relative transition-all duration-300',
          message.role === 'user' 
            ? 'bg-blue-600 text-white shadow-sm ml-auto rounded-tr-sm' 
            : 'bg-zinc-100 dark:bg-zinc-800/80 text-foreground shadow-sm rounded-tl-sm border border-zinc-200/50 dark:border-transparent',
          message.error && 'border border-red-500/50 bg-red-50 dark:bg-red-900/10'
        )}
      >
        {message.role === 'user' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[2rem] pointer-events-none" />
        )}

        {message.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-1 px-1">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '200ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Thinking</span>
          </div>
        ) : (
          <>
            {/* Images */}
            {message.images && message.images.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {message.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Attached image ${i + 1}`}
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Thinking Block - Collapsible like Claude */}
            {message.role === 'assistant' && processed.thinking && (
              <ThinkingBlock
                thinking={processed.thinking}
                isStreaming={false}
              />
            )}

            {/* Filtered JSON Block - Debug info */}
            {message.role === 'assistant' && processed.filteredJson.length > 0 && (
              <FilteredJsonBlock jsonBlocks={processed.filteredJson} />
            )}

            {/* Tool Calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Terminal className="h-3 w-3" />
                  <span>Used {message.toolCalls.length} tool{message.toolCalls.length > 1 ? 's' : ''}</span>
                </div>
                {message.toolCalls.map((tool) => (
                  <ToolCallCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}

            {/* Message Content with Markdown - Use cleaned content for assistant */}
            <div className={cn(
              "text-[15px] leading-relaxed",
              message.role === 'user' ? "font-medium selection:bg-white/30" : "selection:bg-primary/20",
              message.role === 'user' && "text-shadow-sm"
            )}>
              {message.role === 'assistant' ? (
                <MarkdownRenderer content={processed.content} />
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>

            {/* Error state */}
            {message.error && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-destructive">{message.error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRetry(message.id)}
                  className="h-6 px-2"
                  aria-label="Retry message"
                >
                  <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
                  Retry
                </Button>
              </div>
            )}

            {/* Token usage */}
            {message.usage && (
              <div className="mt-2 pt-2 border-t border-border/10 text-[10px] text-muted-foreground/60 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-muted/30 rounded-md px-2 py-0.5 border border-border/20">
                  <span>{message.usage.totalTokens.toLocaleString()} tokens</span>
                  {message.usage.cost && message.usage.cost > 0 && (
                    <>
                      <span className="opacity-30">|</span>
                      <span>${message.usage.cost.toFixed(4)}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Copy button */}
            {message.role === 'assistant' && !message.isLoading && (
              <button
                onClick={() => onCopy(processed.content, message.id)}
                className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:scale-110 active:scale-95"
                aria-label="Copy message content"
              >
                {copiedId === message.id ? (
                  <Check className="h-3.5 w-3.5 text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
