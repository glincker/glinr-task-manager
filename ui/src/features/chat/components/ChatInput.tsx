/**
 * Chat Input Component
 *
 * Text input with image upload, voice recording, and mode toggle.
 */

import { useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Mic,
  MicOff,
  ImagePlus,
  X,
  Bot,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
  disabled: boolean;
  placeholder?: string;
  // Image handling
  pendingImages: string[];
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: (index: number) => void;
  // Voice recording
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  // Mode toggle
  agentMode?: boolean;
  onToggleAgentMode?: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isPending,
  disabled,
  placeholder = 'Type a message...',
  pendingImages,
  onImageSelect,
  onImageRemove,
  isRecording,
  onStartRecording,
  onStopRecording,
  agentMode = false,
  onToggleAgentMode,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="mt-2 space-y-2">

      {/* Pending Images Preview */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 flex-wrap px-1">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img}
                alt={`Pending upload ${i + 1}`}
                className="h-16 w-16 object-cover rounded-xl ring-2 ring-border/50 group-hover:ring-primary/50 transition-all"
              />
              <button
                onClick={() => onImageRemove(i)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-3 w-3 text-white" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        className={cn(
          'relative rounded-[1.5rem] px-2 py-1.5 flex items-end gap-2 transition-all duration-200',
          'bg-zinc-100 dark:bg-zinc-900 border border-transparent',
          'focus-within:border-zinc-200 dark:focus-within:border-zinc-700 focus-within:bg-white dark:focus-within:bg-black',
          agentMode
            ? 'ring-1 ring-sky-500/20'
            : 'shadow-sm'
        )}
      >

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onImageSelect}
        />

        {/* Left side action buttons */}
        <div className="flex items-center gap-1 relative z-10 pb-0.5 pl-1">
          {/* Agent/Chat mode toggle */}
          {onToggleAgentMode && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 shrink-0 rounded-full transition-all',
                agentMode
                  ? 'bg-sky-500/10 text-sky-500 hover:bg-sky-500/15'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
              )}
              onClick={onToggleAgentMode}
              disabled={isPending || disabled}
              aria-label={agentMode ? 'Agent mode (tools enabled)' : 'Chat mode (click for tools)'}
              aria-pressed={agentMode}
            >
              {agentMode ? (
                <Bot className="h-5 w-5" aria-hidden="true" />
              ) : (
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          )}

          {/* Image upload button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || disabled}
            aria-label="Add image"
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Voice recording button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 shrink-0 rounded-full',
              isRecording
                ? 'text-red-500 bg-red-100 dark:bg-red-900/20 animate-pulse'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
            )}
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isPending || disabled}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            aria-pressed={isRecording}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Mic className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={agentMode ? 'Give me a task to work on...' : placeholder}
          aria-label={agentMode ? 'Give me a task to work on' : placeholder}
          className={cn(
            'min-h-[2.5rem] max-h-32 resize-none border-0 bg-transparent text-sm',
            'focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 px-2 relative z-10 leading-relaxed',
            agentMode && 'placeholder:text-sky-500/50'
          )}
          disabled={isPending || disabled}
        />

        {/* Send button */}
        <Button
          onClick={onSend}
          disabled={!value.trim() || isPending || disabled}
          size="icon"
          aria-label="Send message"
          className={cn(
            'h-8 w-8 shrink-0 rounded-full relative z-10 transition-all mb-1 mr-1',
            'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
            'disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 disabled:shadow-none',
            agentMode && 'bg-sky-500 hover:bg-sky-600'
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
