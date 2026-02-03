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
  Loader2,
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
      <div className="flex-1 glass rounded-2xl p-6 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <PresetIcon icon={currentPreset?.icon || 'bot'} className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">
            {currentPreset?.name || 'Start a conversation'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {currentPreset?.description || 'Ask me anything about GLINR, your tasks, or get help with coding.'}
          </p>

          {healthyProviders > 0 && quickActions.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {quickActions.slice(0, 4).map((action) => (
                <button
                  key={action.id}
                  onClick={() => onQuickAction(action.prompt)}
                  className="px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-sm transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {healthyProviders === 0 && (
            <button
              onClick={onOpenProviderSetup}
              className="text-primary hover:underline text-sm"
            >
              Configure a provider to start
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 glass rounded-2xl p-4 overflow-y-auto space-y-4">
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
          'h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
          message.role === 'user' ? 'bg-primary/20' : 'bg-purple-500/20'
        )}
      >
        {message.role === 'user' ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-purple-400" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 group relative',
          message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50',
          message.error && 'border border-destructive/50'
        )}
      >
        {message.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
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
                    alt="Attached"
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
            {message.role === 'assistant' ? (
              <MarkdownRenderer content={processed.content} />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}

            {/* Error state */}
            {message.error && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-destructive">{message.error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRetry(message.id)}
                  className="h-6 px-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}

            {/* Token usage */}
            {message.usage && (
              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-muted-foreground flex items-center gap-3">
                <span>{message.usage.totalTokens.toLocaleString()} tokens</span>
                {message.usage.cost && message.usage.cost > 0 && (
                  <span>${message.usage.cost.toFixed(4)}</span>
                )}
              </div>
            )}

            {/* Copy button */}
            {message.role === 'assistant' && !message.isLoading && (
              <button
                onClick={() => onCopy(processed.content, message.id)}
                className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 transition-all"
              >
                {copiedId === message.id ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
