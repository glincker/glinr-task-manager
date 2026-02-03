/**
 * Chat Module
 *
 * Intelligent chat with GLINR context, conversation history,
 * memory management, and specialized presets.
 */

export * from './system-prompts.js';
export * from './conversations.js';
export * from './memory.js';

// Re-export for convenience
export {
  GLINR_CONTEXT,
  CHAT_PRESETS,
  QUICK_ACTIONS,
  buildSystemPrompt,
  type ChatPreset,
  type ChatContext,
  type QuickAction,
  type RuntimeInfo,
} from './system-prompts.js';

export {
  initConversationTables,
  createConversation,
  getConversation,
  listConversations,
  updateConversationTitle,
  deleteConversation,
  addMessage,
  getConversationMessages,
  getRecentConversationsWithPreview,
  type Conversation,
  type ConversationMessage,
} from './conversations.js';

export {
  DEFAULT_MEMORY_CONFIG,
  estimateTokens,
  estimateMessagesTokens,
  getContextWindow,
  needsCompaction,
  summarizeMessages,
  compactMessages,
  getMemoryStats,
  type MemoryConfig,
  type CompactionResult,
  type MemoryStats,
} from './memory.js';

export {
  CHAT_SKILLS,
  MODEL_TIERS,
  detectIntent,
  selectModel,
  buildSkillPrompt,
  type ChatSkill,
  type SkillCapability,
  type IntentPattern,
  type SkillMatch,
  type ModelTier,
} from './skills.js';

export {
  CHAT_TOOLS,
  executeTool,
  getToolDefinitions,
  type ToolResult,
  type CreateProjectInput,
  type CreateTicketInput,
  type CreateSprintInput,
  type ConfigureProviderInput,
} from './tools.js';

// API Key Detection (smart key extraction from chat messages)
export {
  detectApiKeys,
  mightContainApiKey,
  getApiKeyHandlingPrompt,
  createConfigureToolCall,
  logDetection,
  type DetectedApiKey,
  type ApiKeyDetectionResult,
} from './api-key-detector.js';

// Tool execution handler for chat
export {
  createChatToolHandler,
  getToolCategories,
  getChatTools,
  getDefaultChatTools,
  getAllChatTools,
  type ChatToolHandler,
  type ChatToolHandlerOptions,
} from './tool-handler.js';

// Session management (model overrides)
export {
  getSessionModel,
  setSessionModel,
  clearSessionModel,
} from './execution/tools/session-status.js';
