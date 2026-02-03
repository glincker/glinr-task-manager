/**
 * Chat View
 *
 * Main chat interface with tool calling support and approval workflow.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, Zap, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/core/api/client';
import {
  ChatHeader,
  ChatMessages,
  ChatInput,
  ChatHistory,
  ProviderSetupDialog,
} from '../components';
import {
  ToolApprovalDialog,
  type PendingApproval,
} from '@/components/shared/ToolApprovalDialog';
import type { Message, Conversation, MemoryStats } from '../types';

export function ChatView() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Constants for localStorage keys
  const STORAGE_KEYS = {
    model: 'glinr-chat-model',
    preset: 'glinr-chat-preset',
  } as const;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Load saved model from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.model) || '';
    }
    return '';
  });
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.preset) || 'glinr-assistant';
    }
    return 'glinr-assistant';
  });
  const [showProviderSetup, setShowProviderSetup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [conversationId, setConversationIdState] = useState<string | null>(null);
  // Tool-related state
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  const urlConversationIdRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // URL sync for conversation persistence
  const setConversationId = useCallback((id: string | null) => {
    setConversationIdState(id);
    urlConversationIdRef.current = id;
    if (id) {
      setSearchParams({ c: id }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [setSearchParams]);

  // ============================================================================
  // Queries
  // ============================================================================

  const { data: modelsData } = useQuery({
    queryKey: ['chat', 'models'],
    queryFn: () => api.chat.models(),
    staleTime: 60000, // Cache for 1 minute
  });

  const { data: providersData, refetch: refetchProviders } = useQuery({
    queryKey: ['chat', 'providers'],
    queryFn: () => api.chat.providers(),
    refetchInterval: 30000,
    staleTime: 25000, // Prevent duplicate fetches within 25s
  });

  const { data: presetsData } = useQuery({
    queryKey: ['chat', 'presets'],
    queryFn: () => api.chat.presets(),
    staleTime: 60000,
  });

  const { data: quickActionsData } = useQuery({
    queryKey: ['chat', 'quickActions'],
    queryFn: () => api.chat.quickActions(),
    staleTime: 60000,
  });

  const { data: recentConversations, refetch: refetchConversations } = useQuery({
    queryKey: ['chat', 'conversations', 'recent'],
    queryFn: () => api.chat.conversations.recent(10),
    staleTime: 10000,
  });

  const { data: memoryStats } = useQuery({
    queryKey: ['chat', 'memory', conversationId],
    queryFn: () => api.chat.conversations.getMemoryStats(conversationId!, selectedModel),
    enabled: !!conversationId,
    refetchInterval: 60000,
    staleTime: 55000,
  });

  // ============================================================================
  // Mutations
  // ============================================================================

  const configureProvider = useMutation({
    mutationFn: ({ type, apiKey }: { type: string; apiKey: string }) =>
      api.chat.configure(type, { apiKey, enabled: true }),
    onSuccess: () => {
      toast.success('Provider configured successfully');
      refetchProviders();
      queryClient.invalidateQueries({ queryKey: ['chat', 'providers'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to configure provider');
    },
  });

  const createConversation = useMutation({
    mutationFn: (data: { title?: string; presetId?: string }) =>
      api.chat.conversations.create(data),
    onSuccess: (data) => {
      setConversationId(data.conversation.id);
      refetchConversations();
    },
  });

  const sendConversationMessage = useMutation({
    mutationFn: ({ conversationId, content, model }: { conversationId: string; content: string; model?: string }) =>
      api.chat.conversations.sendMessage(conversationId, { content, model }),
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: response.assistantMessage.id,
        role: 'assistant',
        content: response.assistantMessage.content,
        timestamp: response.assistantMessage.createdAt,
        usage: response.usage,
      };
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [...filtered, assistantMessage];
      });
      refetchConversations();
      queryClient.invalidateQueries({ queryKey: ['chat', 'memory'] });
      if (response.compaction) {
        toast.info(
          `Memory compacted: ${response.compaction.originalCount} → ${response.compaction.compactedCount} messages`,
          { duration: 4000 }
        );
      }
    },
    onError: (error) => {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        const lastMessage = filtered[filtered.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
          return [
            ...filtered.slice(0, -1),
            { ...lastMessage, error: error instanceof Error ? error.message : 'Failed to send message' },
          ];
        }
        return filtered;
      });
      toast.error('Failed to send message');
    },
  });

  // Send message with native tool calling
  const sendMessageWithTools = useMutation({
    mutationFn: ({ conversationId, content, model }: { conversationId: string; content: string; model?: string }) =>
      api.chat.conversations.sendMessageWithTools(conversationId, { content, model, enableTools: true }),
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: response.assistantMessage.id,
        role: 'assistant',
        content: response.assistantMessage.content,
        timestamp: response.assistantMessage.createdAt,
        usage: response.usage,
        toolCalls: response.toolCalls,
      };
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [...filtered, assistantMessage];
      });
      refetchConversations();
      queryClient.invalidateQueries({ queryKey: ['chat', 'memory'] });

      // Handle pending approvals
      if (response.pendingApprovals && response.pendingApprovals.length > 0) {
        setPendingApprovals((prev) => {
          const newApprovals = response.pendingApprovals!.filter(
            (a) => !prev.some((p) => p.id === a.id)
          );
          return [...prev, ...newApprovals];
        });
      }

      if (response.compaction) {
        toast.info(
          `Memory compacted: ${response.compaction.originalCount} → ${response.compaction.compactedCount} messages`,
          { duration: 4000 }
        );
      }

      if (response.toolCalls && response.toolCalls.length > 0) {
        toast.success(`Used ${response.toolCalls.length} tool(s)`, { duration: 3000 });
      }

      // Show warning if tools were requested but not supported
      if (response.toolSupport?.requested && !response.toolSupport.supported) {
        toast.warning(
          response.toolSupport.recommendation ||
            `Model doesn't support tools. Using normal conversation mode.`,
          { duration: 6000 }
        );
      }
    },
    onError: (error) => {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        const lastMessage = filtered[filtered.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
          return [
            ...filtered.slice(0, -1),
            { ...lastMessage, error: error instanceof Error ? error.message : 'Failed to send message' },
          ];
        }
        return filtered;
      });
      toast.error('Failed to send message');
    },
  });

  // Handle tool approval decisions
  const approveToolMutation = useMutation({
    mutationFn: ({ approvalId, decision }: { approvalId: string; decision: 'allow-once' | 'allow-always' | 'deny' }) =>
      api.chat.tools.approve({
        conversationId: conversationId!,
        approvalId,
        decision,
      }),
    onSuccess: (response, { approvalId, decision }) => {
      setPendingApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      if (decision === 'deny') {
        toast.info('Tool execution denied');
      } else {
        toast.success(decision === 'allow-always' ? 'Tool allowed (always)' : 'Tool executed');
        if (response.result) {
          const resultMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: typeof response.result === 'string'
              ? response.result
              : `Tool completed:\n\`\`\`json\n${JSON.stringify(response.result, null, 2)}\n\`\`\``,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, resultMessage]);
        }
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to process approval');
    },
  });

  // Stable callback for tool decisions
  const handleToolDecision = useCallback((approvalId: string, decision: 'allow-once' | 'allow-always' | 'deny') => {
    approveToolMutation.mutate({ approvalId, decision });
  }, [approveToolMutation]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Load conversation from URL or auto-load last conversation
  useEffect(() => {
    const urlConversationId = searchParams.get('c');
    if (urlConversationId && urlConversationId !== urlConversationIdRef.current) {
      urlConversationIdRef.current = urlConversationId;
      loadConversation(urlConversationId);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load last conversation if no URL param and conversations are available
  useEffect(() => {
    const urlConversationId = searchParams.get('c');
    if (!urlConversationId && !conversationId && recentConversations?.conversations?.length) {
      const lastConversation = recentConversations.conversations[0];
      if (lastConversation?.id) {
        loadConversation(lastConversation.id);
      }
    }
  }, [recentConversations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart model selection with localStorage persistence
  useEffect(() => {
    if (!providersData?.providers || !modelsData?.aliases) return;

    const aliases = modelsData.aliases;
    const providers = providersData.providers;
    const healthyProviders = providers.filter((p) => p.healthy);

    // Helper to check if a model alias has a healthy provider
    const isModelHealthy = (modelAlias: string) => {
      const alias = aliases.find((a) => a.alias === modelAlias);
      if (!alias) return false;
      return healthyProviders.some((p) => p.type === alias.provider);
    };

    // If we have a saved model and it's healthy, keep it
    if (selectedModel && isModelHealthy(selectedModel)) {
      return;
    }

    // Try to find a healthy model to select
    if (healthyProviders.length > 0) {
      // Priority order for auto-selection
      const aliasMap: Record<string, string> = {
        anthropic: 'sonnet',
        openai: 'gpt',
        google: 'gemini',
        azure: 'azure',
        groq: 'groq',
        xai: 'grok',
        ollama: 'local',
      };

      // Find first healthy provider and get its preferred alias
      const firstHealthy = healthyProviders[0];
      const newModel = aliasMap[firstHealthy.type] || 'local';
      setSelectedModel(newModel);
    }
  }, [providersData, modelsData, selectedModel]);

  // Persist model selection to localStorage
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    localStorage.setItem(STORAGE_KEYS.model, model);
  }, [STORAGE_KEYS.model]);

  // Persist preset selection to localStorage
  const handlePresetChange = useCallback((preset: string) => {
    setSelectedPreset(preset);
    localStorage.setItem(STORAGE_KEYS.preset, preset);
  }, [STORAGE_KEYS.preset]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const loadConversation = async (id: string) => {
    try {
      const data = await api.chat.conversations.get(id);
      setConversationIdState(id);
      urlConversationIdRef.current = id;
      setSelectedPreset(data.conversation.presetId);
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
          usage: m.tokenUsage
            ? {
                promptTokens: m.tokenUsage.prompt,
                completionTokens: m.tokenUsage.completion,
                totalTokens: m.tokenUsage.total,
                cost: m.cost,
              }
            : undefined,
        }))
      );
      setShowHistory(false);
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  const handleSend = async () => {
    const isPendingAny = sendConversationMessage.isPending || sendMessageWithTools.isPending;
    if (!input.trim() || isPendingAny) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
    };

    const loadingMessage: Message = {
      id: 'loading',
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    const messageContent = input.trim();
    setInput('');
    setPendingImages([]);

    // Choose mutation based on toolsEnabled
    const sendMutation = toolsEnabled ? sendMessageWithTools : sendConversationMessage;

    if (conversationId) {
      sendMutation.mutate({
        conversationId,
        content: messageContent,
        model: selectedModel || undefined,
      });
    } else {
      const result = await createConversation.mutateAsync({
        presetId: selectedPreset,
      });
      sendMutation.mutate({
        conversationId: result.conversation.id,
        content: messageContent,
        model: selectedModel || undefined,
      });
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setPendingApprovals([]);
    toast.success('Started new chat');
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1 || !conversationId) return;

    // Find the message to retry - if it's an assistant message with error, get the user message before it
    const message = messages[messageIndex];
    let userMessage: Message | undefined;

    if (message.role === 'assistant' && message.error) {
      // Find the preceding user message
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userMessage = messages[i];
          break;
        }
      }
    } else if (message.role === 'user' && message.error) {
      userMessage = message;
    }

    if (!userMessage) {
      toast.error('Could not find message to retry');
      return;
    }

    // Remove the errored messages and add loading state
    const loadingMessage: Message = {
      id: 'loading',
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      // Keep messages up to and including the user message, then add loading
      const userIndex = prev.findIndex((m) => m.id === userMessage!.id);
      return [...prev.slice(0, userIndex + 1), loadingMessage];
    });

    // Re-send the message
    const sendMutation = toolsEnabled ? sendMessageWithTools : sendConversationMessage;
    sendMutation.mutate({
      conversationId,
      content: userMessage.content,
      model: selectedModel || undefined,
    });

    toast.info('Retrying message...');
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPendingImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageRemove = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.onstop = () => {
        toast.info('Voice recording captured (transcription coming soon)');
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSaveApiKey = async (type: string, apiKey: string) => {
    await configureProvider.mutateAsync({ type, apiKey });
  };

  const handleToggleTools = () => {
    const newValue = !toolsEnabled;
    setToolsEnabled(newValue);
    toast.info(newValue ? 'Tools enabled' : 'Tools disabled');
  };

  // ============================================================================
  // Derived State
  // ============================================================================

  const aliases = modelsData?.aliases || [];
  const providers = providersData?.providers || [];
  const healthyProviders = providers.filter((p) => p.healthy);
  const presets = presetsData?.presets || [];
  const quickActions = quickActionsData?.actions || [];
  const conversations = (recentConversations?.conversations || []) as Conversation[];
  const currentPreset = presets.find((p) => p.id === selectedPreset);
  const isPending = sendConversationMessage.isPending || sendMessageWithTools.isPending;
  const currentApproval = pendingApprovals[0];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <ChatHeader
        currentPreset={currentPreset}
        presets={presets}
        selectedPreset={selectedPreset}
        selectedModel={selectedModel}
        aliases={aliases}
        providers={providers}
        healthyProviders={healthyProviders}
        memoryStats={memoryStats as MemoryStats | undefined}
        conversationId={conversationId}
        onPresetChange={handlePresetChange}
        onModelChange={handleModelChange}
        onNewChat={handleNewChat}
        onOpenHistory={() => setShowHistory(true)}
        onOpenProviderSetup={() => setShowProviderSetup(true)}
        onClearChat={handleNewChat}
      />

      {/* Tools indicator */}
      <div className="flex items-center justify-end px-2 mb-2">
        <button
          onClick={handleToggleTools}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
            toolsEnabled
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Wrench className="h-3 w-3" />
          <span>Tools {toolsEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* No Provider Banner */}
      {healthyProviders.length === 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-200">No AI providers connected</p>
            <p className="text-sm text-amber-300/80 mt-1">
              Connect at least one provider to start chatting.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/30 hover:bg-amber-500/10"
            onClick={() => setShowProviderSetup(true)}
          >
            <Zap className="h-4 w-4 mr-1" />
            Setup
          </Button>
        </div>
      )}

      {/* Messages */}
      <ChatMessages
        messages={messages}
        currentPreset={currentPreset}
        quickActions={quickActions}
        healthyProviders={healthyProviders.length}
        copiedId={copiedId}
        onCopy={handleCopy}
        onRetry={handleRetry}
        onQuickAction={handleQuickAction}
        onOpenProviderSetup={() => setShowProviderSetup(true)}
      />

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        isPending={isPending}
        disabled={healthyProviders.length === 0}
        placeholder={
          healthyProviders.length > 0
            ? toolsEnabled
              ? 'Message with tools enabled...'
              : 'Type a message...'
            : 'Configure a provider to start chatting...'
        }
        pendingImages={pendingImages}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      {/* History Sheet */}
      <ChatHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewChat={handleNewChat}
      />

      {/* Provider Setup Dialog */}
      <ProviderSetupDialog
        open={showProviderSetup}
        onOpenChange={setShowProviderSetup}
        providers={providers}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Tool Approval Dialog */}
      {currentApproval && (
        <ToolApprovalDialog
          approval={currentApproval}
          onDecision={handleToolDecision}
          isLoading={approveToolMutation.isPending}
        />
      )}
    </div>
  );
}
