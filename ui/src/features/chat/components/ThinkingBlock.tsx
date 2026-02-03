/**
 * Thinking Block Component
 *
 * Collapsible disclosure for AI thinking/reasoning.
 * Based on AI SDK's Reasoning component pattern:
 * - Auto-opens during streaming
 * - Closes when complete
 * - Visual differentiation from regular content
 *
 * @see https://ai-sdk.dev/elements/components/reasoning
 */

import { useState, useEffect } from 'react';
import { Brain, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingBlockProps {
  /** The thinking/reasoning content */
  thinking: string;
  /** Whether the AI is currently streaming this thinking block */
  isStreaming?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Override the default open state */
  defaultOpen?: boolean;
}

export function ThinkingBlock({
  thinking,
  isStreaming = false,
  className,
  defaultOpen,
}: ThinkingBlockProps) {
  // Auto-open during streaming, auto-close when done
  const [isOpen, setIsOpen] = useState(defaultOpen ?? isStreaming);

  // Auto-open when streaming starts, close when it ends
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (!thinking) return null;

  // Calculate stats for display
  const wordCount = thinking.split(/\s+/).length;

  return (
    <div className={cn('mb-3', className)}>
      {/* Trigger Button - Like Claude's thinking disclosure */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-xl',
          // Light mode: darker purple background, Dark mode: lighter purple background
          'bg-purple-100 dark:bg-purple-500/15',
          'hover:bg-purple-200 dark:hover:bg-purple-500/25',
          'border border-purple-300 dark:border-purple-500/30',
          'transition-all duration-200 group text-left',
          isStreaming && 'animate-pulse border-purple-400 dark:border-purple-500/50'
        )}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Collapse thinking' : 'Expand thinking'}
      >
        {/* Brain Icon with streaming indicator */}
        <div className="relative">
          <Brain
            className={cn(
              'h-4 w-4 text-purple-600 dark:text-purple-400 transition-transform duration-200',
              isOpen && 'scale-110',
              isStreaming && 'animate-pulse'
            )}
          />
          {isStreaming && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-ping" />
          )}
        </div>

        {/* Label */}
        <span className="text-xs font-medium text-purple-700 dark:text-purple-300 flex-1">
          {isStreaming ? (
            <span className="flex items-center gap-1.5">
              Thinking
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </span>
          ) : isOpen ? (
            'Thinking'
          ) : (
            'View thinking'
          )}
        </span>

        {/* Stats */}
        {!isStreaming && (
          <span className="text-[10px] text-purple-500 dark:text-purple-400/70 mr-1 tabular-nums">
            {wordCount} words
          </span>
        )}

        {/* Chevron */}
        <div
          className={cn(
            'transition-transform duration-200',
            isOpen && 'rotate-90'
          )}
        >
          <ChevronRight className="h-3 w-3 text-purple-500 dark:text-purple-400" />
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              'px-3 py-2 rounded-xl',
              'bg-purple-50 dark:bg-purple-500/10',
              'border border-purple-200 dark:border-purple-500/20',
              'max-h-100 overflow-y-auto scrollbar-glass'
            )}
          >
            <pre className="whitespace-pre-wrap font-mono text-[11px] text-purple-800 dark:text-purple-200/80 leading-relaxed">
              {thinking}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Filtered JSON Block
 *
 * Shows filtered raw JSON in a warning block (for debugging).
 * Hidden by default, expandable for power users.
 */
interface FilteredJsonBlockProps {
  jsonBlocks: string[];
  className?: string;
}

export function FilteredJsonBlock({ jsonBlocks, className }: FilteredJsonBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!jsonBlocks || jsonBlocks.length === 0) return null;

  return (
    <div className={cn('mb-3', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-amber-100 dark:bg-amber-500/15',
          'hover:bg-amber-200 dark:hover:bg-amber-500/25',
          'border border-amber-300 dark:border-amber-500/30',
          'transition-colors text-left text-[10px]'
        )}
      >
        <span className="text-amber-700 dark:text-amber-400">
          {jsonBlocks.length} raw output{jsonBlocks.length > 1 ? 's' : ''} filtered
        </span>
        <ChevronRight
          className={cn(
            'h-3 w-3 text-amber-600 dark:text-amber-400/70 transition-transform',
            isOpen && 'rotate-90'
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-200',
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            {jsonBlocks.map((json, i) => (
              <pre key={i} className="text-[10px] text-amber-800 dark:text-amber-300/80 font-mono whitespace-pre-wrap">
                {json}
              </pre>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
