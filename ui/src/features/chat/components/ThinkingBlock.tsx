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
      {/* Trigger Button - Clean, neutral design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-300 group text-left',
          'bg-zinc-50 dark:bg-zinc-900',
          'hover:bg-zinc-100 dark:hover:bg-zinc-800',
          'border border-zinc-200 dark:border-zinc-800',
          'shadow-sm hover:shadow-md hover:-translate-y-0.5',
          isStreaming && 'ring-1 ring-blue-500/20 border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10'
        )}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Collapse thinking' : 'Expand thinking'}
      >
        {/* Brain Icon with streaming indicator */}
        <div className={cn(
          "relative flex items-center justify-center h-8 w-8 rounded-xl shadow-inner transition-colors",
          isStreaming 
            ? "bg-blue-100 dark:bg-blue-500/20" 
            : "bg-zinc-100 dark:bg-zinc-800"
        )}>
          <Brain
            className={cn(
              'h-4 w-4 transition-all duration-500',
              isStreaming 
                ? "text-blue-600 dark:text-blue-400 animate-pulse" 
                : "text-zinc-500 dark:text-zinc-400",
              isOpen && !isStreaming ? 'text-zinc-700 dark:text-zinc-300' : '',
              isOpen ? 'scale-110 rotate-[15deg]' : 'scale-100'
            )}
          />
          {isStreaming && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-ping shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          )}
        </div>

        {/* Label */}
        <div className="flex-1 flex flex-col">
          <span className={cn(
            "text-[13px] font-semibold tracking-tight transition-colors",
            isStreaming 
              ? "text-blue-700 dark:text-blue-300" 
              : "text-zinc-700 dark:text-zinc-300"
          )}>
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
              'View reasoning'
            )}
          </span>
          {!isStreaming && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500">
              {wordCount} words analyzed
            </span>
          )}
        </div>

        {/* Chevron */}
        <div
          className={cn(
            'h-6 w-6 flex items-center justify-center rounded-lg transition-all duration-300',
            isOpen ? 'rotate-90 bg-zinc-100 dark:bg-zinc-800' : 'bg-transparent'
          )}
        >
          <ChevronRight className={cn("h-3.5 w-3.5", isOpen ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400")} />
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={cn(
          'grid transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)',
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              'px-5 py-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30',
              'max-h-[32rem] overflow-y-auto scrollbar-thin'
            )}
          >
            <pre className="whitespace-pre-wrap font-mono text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Collapse raw output' : 'Expand raw output'}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-amber-100 dark:bg-amber-500/15',
          'hover:bg-amber-200 dark:hover:bg-amber-500/25',
          'border border-amber-300 dark:border-amber-500/30',
          'transition-colors text-left text-xs'
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
              <pre key={i} className="text-xs text-amber-800 dark:text-amber-300/80 font-mono whitespace-pre-wrap">
                {json}
              </pre>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
