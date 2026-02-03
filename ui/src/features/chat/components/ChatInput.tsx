/**
 * Chat Input Component
 *
 * Text input with image upload and voice recording.
 */

import { useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Mic,
  MicOff,
  ImagePlus,
  X,
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
    <div className="mt-4 space-y-2">
      {/* Pending Images Preview */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 flex-wrap px-1">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={img}
                alt="Pending"
                className="h-16 w-16 object-cover rounded-xl"
              />
              <button
                onClick={() => onImageRemove(i)}
                className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center shadow-sm"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="glass rounded-2xl p-2 flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onImageSelect}
        />

        {/* Image upload button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending || disabled}
        >
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Voice recording button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-10 w-10 shrink-0 rounded-xl', isRecording && 'text-red-500 animate-pulse')}
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isPending || disabled}
        >
          {isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3"
          disabled={isPending || disabled}
        />

        {/* Send button */}
        <Button
          onClick={onSend}
          disabled={!value.trim() || isPending || disabled}
          className="h-10 px-4 rounded-xl"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
