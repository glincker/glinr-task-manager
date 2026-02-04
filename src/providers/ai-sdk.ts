/**
 * GLINR AI Provider System
 *
 * Built on Vercel AI SDK for production-ready multi-provider support.
 * Supports: Anthropic, OpenAI, Google, Ollama, and more.
 *
 * @see https://sdk.vercel.ai/docs
 */

import { generateText, streamText, tool as createTool, type LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createAzure } from '@ai-sdk/azure';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ai-sdk-ollama';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Pre-compiled regex patterns for performance (avoid recompilation on each call)
const TOOL_CALL_REGEX = /```tool\s*\n?([\s\S]*?)\n?```/g;

// Message type for AI SDK
type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// === Types ===

export const ProviderType = z.enum([
  'anthropic',
  'openai',
  'azure',
  'google',
  'ollama',
  'openrouter',
  'groq',
  'xai',
  'mistral',
  'cohere',
  'perplexity',
  'deepseek',
  'together',
  'cerebras',
  'fireworks',
  'copilot', // GitHub Copilot proxy (experimental)
]);
export type ProviderType = z.infer<typeof ProviderType>;

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  resourceName?: string; // Azure resource name
  deploymentName?: string; // Azure deployment name
  apiVersion?: string; // Azure API version
  defaultModel?: string; // Default model for this provider
  enabled: boolean;
}

// Provider stability status
export type ProviderStatus = 'stable' | 'beta' | 'experimental';

// Provider metadata with stability status
export const PROVIDER_STATUS: Record<ProviderType, ProviderStatus> = {
  anthropic: 'stable',
  openai: 'stable',
  azure: 'stable',
  google: 'stable',
  ollama: 'stable',
  openrouter: 'stable',
  groq: 'stable',
  xai: 'beta', // Grok is newer
  mistral: 'stable',
  cohere: 'beta',
  perplexity: 'beta', // Search-focused, unique behavior
  deepseek: 'beta', // R1 is new
  together: 'beta',
  cerebras: 'experimental', // Hardware-specific
  fireworks: 'beta',
  copilot: 'experimental', // GitHub Copilot proxy - requires local proxy server
};

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  contextWindow: number;
  maxOutput: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsTools: boolean; // Whether the model supports native tool/function calling
  costPer1MInput: number;
  costPer1MOutput: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string; // Can be alias like "opus" or full like "anthropic/claude-opus-4-5"
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  provider: ProviderType;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'tool-calls' | 'error' | 'approval-required';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  duration: number;
}

// === Model Aliases ===

export const MODEL_ALIASES: Record<string, { provider: ProviderType; model: string }> = {
  // Anthropic
  opus: { provider: 'anthropic', model: 'claude-opus-4-5-20251101' },
  sonnet: { provider: 'anthropic', model: 'claude-sonnet-4-5-20251014' },
  haiku: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },

  // OpenAI
  gpt: { provider: 'openai', model: 'gpt-4.1' },
  'gpt-mini': { provider: 'openai', model: 'gpt-4.1-mini' },
  o1: { provider: 'openai', model: 'o1' },
  'o1-mini': { provider: 'openai', model: 'o1-mini' },
  'o3-mini': { provider: 'openai', model: 'o3-mini' },

  // Azure OpenAI (deployment names - user configurable)
  azure: { provider: 'azure', model: 'gpt-4' },
  'azure-gpt': { provider: 'azure', model: 'gpt-4' },

  // Google
  gemini: { provider: 'google', model: 'gemini-2.5-pro-preview-05-06' },
  'gemini-flash': { provider: 'google', model: 'gemini-2.5-flash-preview-05-20' },
  'gemini-thinking': { provider: 'google', model: 'gemini-2.5-flash-thinking-exp-01-21' },

  // Groq (fast inference)
  groq: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  'groq-fast': { provider: 'groq', model: 'llama-3.1-8b-instant' },
  'groq-mixtral': { provider: 'groq', model: 'mixtral-8x7b-32768' },

  // Ollama (local)
  local: { provider: 'ollama', model: 'llama3.2' },
  llama: { provider: 'ollama', model: 'llama3.2' },
  'deepseek-local': { provider: 'ollama', model: 'deepseek-r1:7b' },
  qwen: { provider: 'ollama', model: 'qwen3:14b' },
  'mistral-local': { provider: 'ollama', model: 'mistral:7b' },

  // xAI (Grok)
  grok: { provider: 'xai', model: 'grok-2' },
  'grok-3': { provider: 'xai', model: 'grok-3' },

  // Mistral
  mistral: { provider: 'mistral', model: 'mistral-large-latest' },
  'mistral-medium': { provider: 'mistral', model: 'mistral-medium-latest' },
  codestral: { provider: 'mistral', model: 'codestral-latest' },

  // Cohere
  command: { provider: 'cohere', model: 'command-r-plus' },
  'command-r': { provider: 'cohere', model: 'command-r' },

  // Perplexity
  perplexity: { provider: 'perplexity', model: 'llama-3.1-sonar-huge-128k-online' },
  'pplx-fast': { provider: 'perplexity', model: 'llama-3.1-sonar-small-128k-online' },

  // DeepSeek
  deepseek: { provider: 'deepseek', model: 'deepseek-chat' },
  'deepseek-coder': { provider: 'deepseek', model: 'deepseek-coder' },
  'deepseek-r1': { provider: 'deepseek', model: 'deepseek-reasoner' },

  // Together AI
  together: { provider: 'together', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
  'together-qwen': { provider: 'together', model: 'Qwen/Qwen2.5-72B-Instruct-Turbo' },

  // Cerebras
  cerebras: { provider: 'cerebras', model: 'llama3.1-70b' },

  // Fireworks
  fireworks: { provider: 'fireworks', model: 'accounts/fireworks/models/llama-v3p1-70b-instruct' },

  // GitHub Copilot (via proxy)
  copilot: { provider: 'copilot', model: 'gpt-4o' },
  'copilot-fast': { provider: 'copilot', model: 'gpt-4o-mini' },
};

// === Model Catalog ===

export const MODEL_CATALOG: ModelInfo[] = [
  // Anthropic - All support native function calling
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 32000,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 15,
    costPer1MOutput: 75,
  },
  {
    id: 'claude-sonnet-4-5-20251014',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 16000,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 3,
    costPer1MOutput: 15,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 8192,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 0.25,
    costPer1MOutput: 1.25,
  },

  // OpenAI - GPT-4+ supports function calling
  {
    id: 'gpt-4.5-turbo',
    name: 'GPT-4.5 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxOutput: 16384,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 2.5,
    costPer1MOutput: 10,
  },
  {
    id: 'gpt-4.5-mini',
    name: 'GPT-4.5 Mini',
    provider: 'openai',
    contextWindow: 128000,
    maxOutput: 16384,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
  },
  {
    id: 'o1',
    name: 'o1',
    provider: 'openai',
    contextWindow: 200000,
    maxOutput: 100000,
    supportsVision: false,
    supportsStreaming: false,
    supportsTools: true,
    costPer1MInput: 15,
    costPer1MOutput: 60,
  },

  // Google - Gemini supports function calling
  {
    id: 'gemini-2.5-pro-preview-05-06',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    contextWindow: 2000000,
    maxOutput: 65536,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 1.25,
    costPer1MOutput: 5,
  },
  {
    id: 'gemini-2.5-flash-preview-05-20',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    contextWindow: 1000000,
    maxOutput: 8192,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 0.075,
    costPer1MOutput: 0.30,
  },

  // Groq - Llama models via Groq support function calling
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    contextWindow: 128000,
    maxOutput: 32768,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 0.59,
    costPer1MOutput: 0.79,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'groq',
    contextWindow: 128000,
    maxOutput: 8192,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 0.05,
    costPer1MOutput: 0.08,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    contextWindow: 32768,
    maxOutput: 8192,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 0.24,
    costPer1MOutput: 0.24,
  },

  // Azure OpenAI - Using deployment names and model names
  // Note: Azure costs may vary by region and agreement
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Azure)',
    provider: 'azure',
    contextWindow: 128000,
    maxOutput: 16384,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 2.50,
    costPer1MOutput: 10.00,
  },
  {
    id: 'gpt4o', // Common deployment name
    name: 'GPT-4o (Azure)',
    provider: 'azure',
    contextWindow: 128000,
    maxOutput: 16384,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 2.50,
    costPer1MOutput: 10.00,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Azure)',
    provider: 'azure',
    contextWindow: 128000,
    maxOutput: 16384,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
  },
  {
    id: 'gpt4o-mini', // Common deployment name
    name: 'GPT-4o Mini (Azure)',
    provider: 'azure',
    contextWindow: 128000,
    maxOutput: 16384,
    supportsVision: true,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 (Azure)',
    provider: 'azure',
    contextWindow: 128000,
    maxOutput: 8192,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: true,
    costPer1MInput: 30.00,
    costPer1MOutput: 60.00,
  },

  // Ollama (local) - Most models don't reliably support native tool calling
  {
    id: 'llama3.2',
    name: 'Llama 3.2 (Local)',
    provider: 'ollama',
    contextWindow: 131072,
    maxOutput: 8192,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: false, // Local models don't reliably support native function calling
    costPer1MInput: 0,
    costPer1MOutput: 0,
  },
  {
    id: 'deepseek-r1:7b',
    name: 'DeepSeek R1 7B (Local)',
    provider: 'ollama',
    contextWindow: 32768,
    maxOutput: 8192,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: false,
    costPer1MInput: 0,
    costPer1MOutput: 0,
  },
  {
    id: 'qwen3:14b',
    name: 'Qwen 3 14B (Local)',
    provider: 'ollama',
    contextWindow: 32768,
    maxOutput: 8192,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: false,
    costPer1MInput: 0,
    costPer1MOutput: 0,
  },
  {
    id: 'mistral:7b',
    name: 'Mistral 7B (Local)',
    provider: 'ollama',
    contextWindow: 32768,
    maxOutput: 8192,
    supportsVision: false,
    supportsStreaming: true,
    supportsTools: false,
    costPer1MInput: 0,
    costPer1MOutput: 0,
  },
];

// === Provider Factory ===

interface ProviderInstances {
  anthropic?: ReturnType<typeof createAnthropic>;
  openai?: ReturnType<typeof createOpenAI>;
  azure?: ReturnType<typeof createAzure>;
  google?: ReturnType<typeof createGoogleGenerativeAI>;
  ollama?: ReturnType<typeof createOllama>;
  groq?: ReturnType<typeof createOpenAI>; // Groq uses OpenAI-compatible API
  xai?: ReturnType<typeof createOpenAI>; // xAI uses OpenAI-compatible API
  mistral?: ReturnType<typeof createOpenAI>; // Mistral uses OpenAI-compatible API
  cohere?: ReturnType<typeof createOpenAI>; // Cohere uses OpenAI-compatible API
  perplexity?: ReturnType<typeof createOpenAI>; // Perplexity uses OpenAI-compatible API
  deepseek?: ReturnType<typeof createOpenAI>; // DeepSeek uses OpenAI-compatible API
  together?: ReturnType<typeof createOpenAI>; // Together uses OpenAI-compatible API
  cerebras?: ReturnType<typeof createOpenAI>; // Cerebras uses OpenAI-compatible API
  fireworks?: ReturnType<typeof createOpenAI>; // Fireworks uses OpenAI-compatible API
  openrouter?: ReturnType<typeof createOpenAI>; // OpenRouter uses OpenAI-compatible API
  copilot?: ReturnType<typeof createOpenAI>; // GitHub Copilot proxy uses OpenAI-compatible API
}

// Provider priority for auto-selection (prefer cloud providers over local)
const PROVIDER_PRIORITY: ProviderType[] = [
  'anthropic',  // Claude - best for tools/reasoning
  'openai',     // GPT-4 - excellent all-around
  'azure',      // Azure OpenAI - enterprise
  'google',     // Gemini - good multimodal
  'groq',       // Fast inference
  'xai',        // Grok
  'mistral',    // Mistral
  'deepseek',   // DeepSeek R1
  'together',   // Together AI
  'fireworks',  // Fireworks
  'cerebras',   // Cerebras
  'openrouter', // OpenRouter (many models)
  'cohere',     // Cohere
  'perplexity', // Perplexity (search-focused)
  'copilot',    // GitHub Copilot proxy
  'ollama',     // Local - lowest priority (often doesn't support tools)
];

class AIProviderManager {
  private providers: ProviderInstances = {};
  private configs: Map<ProviderType, ProviderConfig> = new Map();
  private defaultProvider: ProviderType = 'ollama';

  constructor() {
    // Initialize with environment variables
    this.initFromEnv();
    // Auto-select best provider as default
    this.autoSelectDefaultProvider();
  }

  private initFromEnv(): void {
    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.configure('anthropic', {
        type: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        enabled: true,
      });
    }

    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.configure('openai', {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        enabled: true,
      });
    }

    // Google
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY) {
      this.configure('google', {
        type: 'google',
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
        enabled: true,
      });
    }

    // Azure OpenAI (supports both standard and Foundry modes)
    if (process.env.AZURE_OPENAI_API_KEY) {
      // Check if using Foundry (custom base URL) or standard (resource name)
      const baseUrl = process.env.AZURE_OPENAI_BASE_URL || process.env.AZURE_OPENAI_ENDPOINT;
      const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;

      if (baseUrl || resourceName) {
        this.configure('azure', {
          type: 'azure',
          apiKey: process.env.AZURE_OPENAI_API_KEY,
          baseUrl: baseUrl,
          resourceName: resourceName,
          deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
          apiVersion: process.env.AZURE_OPENAI_API_VERSION,
          enabled: true,
        });
      }
    }

    // Groq (fast inference)
    if (process.env.GROQ_API_KEY) {
      this.configure('groq', {
        type: 'groq',
        apiKey: process.env.GROQ_API_KEY,
        enabled: true,
      });
    }

    // xAI (Grok)
    if (process.env.XAI_API_KEY) {
      this.configure('xai', {
        type: 'xai',
        apiKey: process.env.XAI_API_KEY,
        enabled: true,
      });
    }

    // Mistral
    if (process.env.MISTRAL_API_KEY) {
      this.configure('mistral', {
        type: 'mistral',
        apiKey: process.env.MISTRAL_API_KEY,
        enabled: true,
      });
    }

    // Cohere
    if (process.env.COHERE_API_KEY) {
      this.configure('cohere', {
        type: 'cohere',
        apiKey: process.env.COHERE_API_KEY,
        enabled: true,
      });
    }

    // Perplexity
    if (process.env.PERPLEXITY_API_KEY) {
      this.configure('perplexity', {
        type: 'perplexity',
        apiKey: process.env.PERPLEXITY_API_KEY,
        enabled: true,
      });
    }

    // DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      this.configure('deepseek', {
        type: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY,
        enabled: true,
      });
    }

    // Together AI
    if (process.env.TOGETHER_API_KEY) {
      this.configure('together', {
        type: 'together',
        apiKey: process.env.TOGETHER_API_KEY,
        enabled: true,
      });
    }

    // Cerebras
    if (process.env.CEREBRAS_API_KEY) {
      this.configure('cerebras', {
        type: 'cerebras',
        apiKey: process.env.CEREBRAS_API_KEY,
        enabled: true,
      });
    }

    // Fireworks
    if (process.env.FIREWORKS_API_KEY) {
      this.configure('fireworks', {
        type: 'fireworks',
        apiKey: process.env.FIREWORKS_API_KEY,
        enabled: true,
      });
    }

    // OpenRouter (100+ models via one API)
    if (process.env.OPENROUTER_API_KEY) {
      this.configure('openrouter', {
        type: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        enabled: true,
      });
    }

    // Ollama (always enabled for local usage)
    this.configure('ollama', {
      type: 'ollama',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      enabled: true,
    });

    // GitHub Copilot proxy (experimental - requires local copilot-api server)
    // See: https://github.com/ericc-ch/copilot-api
    if (process.env.COPILOT_API_URL) {
      this.configure('copilot', {
        type: 'copilot',
        baseUrl: process.env.COPILOT_API_URL,
        enabled: true,
      });
    }
  }

  configure(type: ProviderType, config: ProviderConfig): void {
    this.configs.set(type, config);

    switch (type) {
      case 'anthropic':
        if (config.apiKey) {
          this.providers.anthropic = createAnthropic({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
          });
        }
        break;

      case 'openai':
        if (config.apiKey) {
          this.providers.openai = createOpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
          });
        }
        break;

      case 'google':
        if (config.apiKey) {
          this.providers.google = createGoogleGenerativeAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
          });
        }
        break;

      case 'azure':
        if (config.apiKey) {
          // Azure OpenAI supports multiple endpoint formats:
          // 1. Resource name → SDK builds: https://${resourceName}.openai.azure.com
          // 2. Direct endpoint → https://{resource}.openai.azure.com or regional cognitive services
          //
          // Some Azure setups use regional Cognitive Services endpoints like:
          // https://eastus.api.cognitive.microsoft.com (valid for Azure OpenAI)

          const apiVersion = config.apiVersion || '2024-10-21';
          logger.info(`[AIProvider] Azure using API version: ${apiVersion}`);

          if (config.resourceName) {
            // Preferred: Use resource name, SDK constructs the URL
            this.providers.azure = createAzure({
              apiKey: config.apiKey,
              resourceName: config.resourceName,
              apiVersion,
            });
            logger.info(`[AIProvider] Azure configured with resource: ${config.resourceName}`);
          } else if (config.baseUrl) {
            // Use provided endpoint URL directly
            // Both .openai.azure.com and .cognitive.microsoft.com formats are valid
            const endpoint = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash

            this.providers.azure = createAzure({
              apiKey: config.apiKey,
              baseURL: endpoint,
              apiVersion,
              // Azure OpenAI requires deployment-based URLs: /deployments/${modelId}/...
              // Without this, SDK uses /v1/... format which doesn't work with Azure
              useDeploymentBasedUrls: true,
            });
            logger.info(`[AIProvider] Azure configured with endpoint: ${endpoint}`);
          } else {
            logger.warn('[AIProvider] Azure API key provided but no endpoint or resource name');
          }

          // Log deployment info if available
          if (config.defaultModel) {
            logger.info(`[AIProvider] Azure default deployment: ${config.defaultModel}`);
          }
        }
        break;

      case 'groq':
        if (config.apiKey) {
          this.providers.groq = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
          });
        }
        break;

      case 'ollama':
        this.providers.ollama = createOllama({
          baseURL: config.baseUrl || 'http://localhost:11434',
        });
        break;

      case 'xai':
        if (config.apiKey) {
          this.providers.xai = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.x.ai/v1',
          });
        }
        break;

      case 'mistral':
        if (config.apiKey) {
          this.providers.mistral = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.mistral.ai/v1',
          });
        }
        break;

      case 'cohere':
        if (config.apiKey) {
          this.providers.cohere = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.cohere.ai/v1',
          });
        }
        break;

      case 'perplexity':
        if (config.apiKey) {
          this.providers.perplexity = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.perplexity.ai',
          });
        }
        break;

      case 'deepseek':
        if (config.apiKey) {
          this.providers.deepseek = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.deepseek.com/v1',
          });
        }
        break;

      case 'together':
        if (config.apiKey) {
          this.providers.together = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.together.xyz/v1',
          });
        }
        break;

      case 'cerebras':
        if (config.apiKey) {
          this.providers.cerebras = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.cerebras.ai/v1',
          });
        }
        break;

      case 'fireworks':
        if (config.apiKey) {
          this.providers.fireworks = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://api.fireworks.ai/inference/v1',
          });
        }
        break;

      case 'openrouter':
        if (config.apiKey) {
          this.providers.openrouter = createOpenAI({
            apiKey: config.apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
          });
        }
        break;

      case 'copilot':
        // GitHub Copilot proxy - uses user's Copilot subscription via local proxy
        // No API key needed - proxy handles auth via GitHub token
        if (config.baseUrl) {
          this.providers.copilot = createOpenAI({
            apiKey: 'copilot', // Placeholder - proxy doesn't need real key
            baseURL: config.baseUrl,
          });
        }
        break;
    }

    logger.info(`[AIProvider] Configured ${type}`);
  }

  setDefaultProvider(type: ProviderType): void {
    this.defaultProvider = type;
  }

  getDefaultProvider(): ProviderType {
    return this.defaultProvider;
  }

  /**
   * Auto-select the best configured provider as default.
   * Prioritizes cloud providers (that support tools) over Ollama.
   */
  autoSelectDefaultProvider(): void {
    for (const provider of PROVIDER_PRIORITY) {
      const config = this.configs.get(provider);
      if (config?.enabled) {
        // For providers that need API keys, verify they have one
        if (provider !== 'ollama' && provider !== 'copilot') {
          if (!config.apiKey && !config.baseUrl) continue;
        }
        this.defaultProvider = provider;
        logger.info(`[AIProvider] Auto-selected default provider: ${provider}`);
        return;
      }
    }
    // Fallback to ollama if nothing else is configured
    this.defaultProvider = 'ollama';
    logger.info('[AIProvider] Using ollama as default (no cloud providers configured)');
  }

  isConfigured(type: ProviderType): boolean {
    const config = this.configs.get(type);
    return config?.enabled ?? false;
  }

  getConfiguredProviders(): ProviderType[] {
    return Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled)
      .map(([type]) => type);
  }

  /**
   * Load saved provider configurations from storage
   * Call this after storage is initialized
   */
  async loadSavedConfigs(
    loader: () => Promise<Array<{
      type: string;
      apiKey?: string;
      baseUrl?: string;
      resourceName?: string;
      deploymentName?: string;
      apiVersion?: string;
      defaultModel?: string;
      enabled?: boolean;
    }>>
  ): Promise<number> {
    try {
      const savedConfigs = await loader();
      let loaded = 0;

      for (const saved of savedConfigs) {
        // Skip if already configured from env with higher priority
        const existing = this.configs.get(saved.type as ProviderType);
        if (existing?.apiKey && saved.type !== 'ollama') {
          logger.info(`[AI] Skipping saved config for ${saved.type} (already configured from env)`);
          continue;
        }

        // Configure the provider
        this.configure(saved.type as ProviderType, {
          type: saved.type as ProviderType,
          apiKey: saved.apiKey,
          baseUrl: saved.baseUrl,
          resourceName: saved.resourceName,
          deploymentName: saved.deploymentName,
          apiVersion: saved.apiVersion,
          defaultModel: saved.defaultModel,
          enabled: saved.enabled ?? true,
        });

        logger.info(`[AI] Loaded saved config for ${saved.type}`);
        loaded++;
      }

      // Re-evaluate default provider after loading saved configs
      if (loaded > 0) {
        this.autoSelectDefaultProvider();
      }

      return loaded;
    } catch (error) {
      logger.error('[AI] Failed to load saved configs:', error instanceof Error ? error : undefined);
      return 0;
    }
  }

  resolveModel(modelOrAlias: string): { provider: ProviderType; model: string } {
    // Check if it's a full provider/model path
    if (modelOrAlias.includes('/')) {
      const [provider, model] = modelOrAlias.split('/');
      return { provider: provider as ProviderType, model };
    }

    // Check aliases
    const alias = MODEL_ALIASES[modelOrAlias.toLowerCase()];
    if (alias) {
      // For Azure, use the configured deployment name instead of the default alias model
      if (alias.provider === 'azure') {
        const azureConfig = this.configs.get('azure');
        if (azureConfig?.defaultModel) {
          return { provider: 'azure', model: azureConfig.defaultModel };
        }
      }
      return alias;
    }

    // Try to find in catalog
    const catalogModel = MODEL_CATALOG.find((m) => m.id === modelOrAlias);
    if (catalogModel) {
      return { provider: catalogModel.provider, model: catalogModel.id };
    }

    // Default to the auto-selected default provider
    // Use the provider's default model if configured, otherwise use the given model name
    const defaultConfig = this.configs.get(this.defaultProvider);
    const defaultModel = defaultConfig?.defaultModel || modelOrAlias;
    return { provider: this.defaultProvider, model: defaultModel };
  }

  getModel(provider: ProviderType, modelId: string): LanguageModel {
    switch (provider) {
      case 'anthropic':
        if (!this.providers.anthropic) {
          throw new Error('Anthropic not configured. Set ANTHROPIC_API_KEY.');
        }
        return this.providers.anthropic(modelId) as unknown as LanguageModel;

      case 'openai':
        if (!this.providers.openai) {
          throw new Error('OpenAI not configured. Set OPENAI_API_KEY.');
        }
        return this.providers.openai(modelId) as unknown as LanguageModel;

      case 'google':
        if (!this.providers.google) {
          throw new Error('Google AI not configured. Set GOOGLE_API_KEY.');
        }
        return this.providers.google(modelId) as unknown as LanguageModel;

      case 'azure':
        if (!this.providers.azure) {
          throw new Error('Azure OpenAI not configured. Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_RESOURCE_NAME.');
        }
        // Use .chat() for Azure - the default responses API isn't supported on all Azure endpoints
        return this.providers.azure.chat(modelId) as unknown as LanguageModel;

      case 'groq':
        if (!this.providers.groq) {
          throw new Error('Groq not configured. Set GROQ_API_KEY.');
        }
        return this.providers.groq(modelId) as unknown as LanguageModel;

      case 'ollama':
        if (!this.providers.ollama) {
          throw new Error('Ollama not configured.');
        }
        return this.providers.ollama(modelId) as unknown as LanguageModel;

      case 'xai':
        if (!this.providers.xai) {
          throw new Error('xAI not configured. Set XAI_API_KEY.');
        }
        return this.providers.xai(modelId) as unknown as LanguageModel;

      case 'mistral':
        if (!this.providers.mistral) {
          throw new Error('Mistral not configured. Set MISTRAL_API_KEY.');
        }
        return this.providers.mistral(modelId) as unknown as LanguageModel;

      case 'cohere':
        if (!this.providers.cohere) {
          throw new Error('Cohere not configured. Set COHERE_API_KEY.');
        }
        return this.providers.cohere(modelId) as unknown as LanguageModel;

      case 'perplexity':
        if (!this.providers.perplexity) {
          throw new Error('Perplexity not configured. Set PERPLEXITY_API_KEY.');
        }
        return this.providers.perplexity(modelId) as unknown as LanguageModel;

      case 'deepseek':
        if (!this.providers.deepseek) {
          throw new Error('DeepSeek not configured. Set DEEPSEEK_API_KEY.');
        }
        return this.providers.deepseek(modelId) as unknown as LanguageModel;

      case 'together':
        if (!this.providers.together) {
          throw new Error('Together AI not configured. Set TOGETHER_API_KEY.');
        }
        return this.providers.together(modelId) as unknown as LanguageModel;

      case 'cerebras':
        if (!this.providers.cerebras) {
          throw new Error('Cerebras not configured. Set CEREBRAS_API_KEY.');
        }
        return this.providers.cerebras(modelId) as unknown as LanguageModel;

      case 'fireworks':
        if (!this.providers.fireworks) {
          throw new Error('Fireworks not configured. Set FIREWORKS_API_KEY.');
        }
        return this.providers.fireworks(modelId) as unknown as LanguageModel;

      case 'openrouter':
        if (!this.providers.openrouter) {
          throw new Error('OpenRouter not configured. Set OPENROUTER_API_KEY.');
        }
        return this.providers.openrouter(modelId) as unknown as LanguageModel;

      case 'copilot':
        if (!this.providers.copilot) {
          throw new Error('GitHub Copilot proxy not configured. Set COPILOT_API_URL.');
        }
        return this.providers.copilot(modelId) as unknown as LanguageModel;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  getModelInfo(modelId: string): ModelInfo | undefined {
    return MODEL_CATALOG.find((m) => m.id === modelId);
  }

  getModelsForProvider(provider: ProviderType): ModelInfo[] {
    return MODEL_CATALOG.filter((m) => m.provider === provider);
  }

  getAllModels(): ModelInfo[] {
    return [...MODEL_CATALOG];
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    // Resolve model
    const modelRef = request.model
      ? this.resolveModel(request.model)
      : { provider: this.defaultProvider, model: 'llama3.2' };

    const model = this.getModel(modelRef.provider, modelRef.model);

    // Convert messages to AI SDK format
    const messages: AIMessage[] = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    try {
      const result = await generateText({
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      });

      const duration = Date.now() - startTime;
      const modelInfo = this.getModelInfo(modelRef.model);

      // Calculate cost - AI SDK v6 uses usage.totalTokens and similar
      const promptTokens = (result.usage as { promptTokens?: number })?.promptTokens ??
                           (result.usage as { inputTokens?: number })?.inputTokens ?? 0;
      const completionTokens = (result.usage as { completionTokens?: number })?.completionTokens ??
                               (result.usage as { outputTokens?: number })?.outputTokens ?? 0;
      const cost = modelInfo
        ? (promptTokens / 1_000_000) * modelInfo.costPer1MInput +
          (completionTokens / 1_000_000) * modelInfo.costPer1MOutput
        : 0;

      return {
        id: randomUUID(),
        provider: modelRef.provider,
        model: modelRef.model,
        content: result.text,
        finishReason: result.finishReason === 'stop' ? 'stop' : 'length',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost,
        },
        duration,
      };
    } catch (error) {
      logger.error(`[AIProvider] Chat error:`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  // Streaming configuration for performance (configurable via env vars)
  private static readonly CHUNK_BATCH_SIZE = parseInt(process.env.STREAM_CHUNK_BATCH_SIZE || '64', 10);
  private static readonly CHUNK_BATCH_TIME_MS = parseInt(process.env.STREAM_CHUNK_BATCH_TIME_MS || '30', 10);

  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    // Resolve model
    const modelRef = request.model
      ? this.resolveModel(request.model)
      : { provider: this.defaultProvider, model: 'llama3.2' };

    const model = this.getModel(modelRef.provider, modelRef.model);

    // Convert messages
    const messages: AIMessage[] = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    try {
      const result = streamText({
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      });

      // Collect text with batched chunk emission for better performance
      const textParts: string[] = [];
      let chunkBuffer = '';
      let lastFlushTime = Date.now();

      for await (const chunk of result.textStream) {
        textParts.push(chunk);
        chunkBuffer += chunk;

        const now = Date.now();
        const shouldFlush =
          chunkBuffer.length >= AIProviderManager.CHUNK_BATCH_SIZE ||
          now - lastFlushTime >= AIProviderManager.CHUNK_BATCH_TIME_MS;

        if (shouldFlush && chunkBuffer) {
          onChunk(chunkBuffer); // Non-blocking callback
          chunkBuffer = '';
          lastFlushTime = now;
        }
      }

      // Flush any remaining buffer
      if (chunkBuffer) {
        onChunk(chunkBuffer);
      }

      const fullText = textParts.join(''); // O(n) join instead of O(n²) concatenation

      // Get usage (already available from stream result)
      const usage = await result.usage;
      const duration = Date.now() - startTime;
      const modelInfo = this.getModelInfo(modelRef.model);

      const promptTokens = (usage as { promptTokens?: number })?.promptTokens ??
                           (usage as { inputTokens?: number })?.inputTokens ?? 0;
      const completionTokens = (usage as { completionTokens?: number })?.completionTokens ??
                               (usage as { outputTokens?: number })?.outputTokens ?? 0;
      const cost = modelInfo
        ? (promptTokens / 1_000_000) * modelInfo.costPer1MInput +
          (completionTokens / 1_000_000) * modelInfo.costPer1MOutput
        : 0;

      return {
        id: randomUUID(),
        provider: modelRef.provider,
        model: modelRef.model,
        content: fullText,
        finishReason: 'stop',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost,
        },
        duration,
      };
    } catch (error) {
      logger.error(`[AIProvider] Stream error:`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Chat with tool calling support
   * Handles tool detection and execution manually for better control
   */
  async chatWithTools(request: ChatWithToolsRequest): Promise<ChatWithToolsResponse> {
    const startTime = Date.now();

    // Resolve model
    const modelRef = request.model
      ? this.resolveModel(request.model)
      : { provider: this.defaultProvider, model: 'llama3.2' };

    const model = this.getModel(modelRef.provider, modelRef.model);

    // Build tool instructions for the system prompt
    let systemPrompt = request.systemPrompt || '';
    const toolResults: ChatWithToolsResponse['toolResults'] = [];
    const detectedToolCalls: ToolCall[] = [];

    if (request.tools && request.tools.length > 0) {
      const toolDescriptions = request.tools.map((t) => {
        const params = t.parameters;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shape = (params as any)?._def?.shape || (params as any)?.shape || {};
        const paramList = Object.entries(shape)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map(([key, val]: [string, any]) => `  - ${key}: ${val?._def?.description || 'string'}`)
          .join('\n');
        return `**${t.name}**: ${t.description}\nParameters:\n${paramList}`;
      }).join('\n\n');

      systemPrompt += `\n\n## Available Tools\n\nYou can call the following tools by responding with a JSON block in this exact format:\n\`\`\`tool\n{"tool": "toolName", "args": {"param1": "value1"}}\n\`\`\`\n\n${toolDescriptions}\n\nWhen you need to use a tool, include the tool call in your response. After the tool executes, continue with your response.`;
    }

    // Convert messages to AI SDK format
    const messages: AIMessage[] = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (systemPrompt) {
      messages.unshift({ role: 'system', content: systemPrompt });
    }

    try {
      const result = await generateText({
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      });

      let finalContent = result.text;

      // Parse tool calls from the response (using pre-compiled regex)
      TOOL_CALL_REGEX.lastIndex = 0; // Reset regex state
      let match;

      while ((match = TOOL_CALL_REGEX.exec(result.text)) !== null) {
        try {
          const toolCall = JSON.parse(match[1]);
          if (toolCall.tool && request.executeTools) {
            const toolCallId = randomUUID();
            detectedToolCalls.push({
              id: toolCallId,
              name: toolCall.tool,
              arguments: toolCall.args || {},
            });

            // Execute the tool
            const toolResult = await request.executeTools(toolCall.tool, toolCall.args || {});
            toolResults.push({
              toolCallId,
              toolName: toolCall.tool,
              result: toolResult,
            });

            // Replace the tool call block with the result
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resultMessage = (toolResult as any)?.message || JSON.stringify(toolResult);
            finalContent = finalContent.replace(match[0], `\n✅ **${toolCall.tool}**: ${resultMessage}\n`);
          }
        } catch {
          // Invalid JSON, skip
        }
      }

      const duration = Date.now() - startTime;
      const modelInfo = this.getModelInfo(modelRef.model);

      const promptTokens = (result.usage as { promptTokens?: number })?.promptTokens ??
                           (result.usage as { inputTokens?: number })?.inputTokens ?? 0;
      const completionTokens = (result.usage as { completionTokens?: number })?.completionTokens ??
                               (result.usage as { outputTokens?: number })?.outputTokens ?? 0;
      const cost = modelInfo
        ? (promptTokens / 1_000_000) * modelInfo.costPer1MInput +
          (completionTokens / 1_000_000) * modelInfo.costPer1MOutput
        : 0;

      return {
        id: randomUUID(),
        provider: modelRef.provider,
        model: modelRef.model,
        content: finalContent,
        finishReason: detectedToolCalls.length > 0 ? 'tool-calls' : (result.finishReason === 'stop' ? 'stop' : 'length'),
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost,
        },
        duration,
        toolCalls: detectedToolCalls.length > 0 ? detectedToolCalls : undefined,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
      };
    } catch (error) {
      logger.error(`[AIProvider] Chat with tools error:`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Check if a model supports native tool calling
   */
  modelSupportsTools(modelOrAlias?: string): { supported: boolean; model: string; provider: ProviderType; recommendation?: string } {
    const modelRef = modelOrAlias
      ? this.resolveModel(modelOrAlias)
      : { provider: this.defaultProvider, model: 'llama3.2' };

    // Azure OpenAI: All GPT-4, GPT-4o, and GPT-3.5-turbo models support function calling
    // We check provider first since Azure deployment names won't be in MODEL_CATALOG
    if (modelRef.provider === 'azure') {
      logger.debug(`[AIProvider] Azure model detected, assuming tool support`, {
        component: 'AIProvider',
        model: modelRef.model,
        provider: modelRef.provider,
      });
      return {
        supported: true,
        model: modelRef.model,
        provider: modelRef.provider,
      };
    }

    const modelInfo = this.getModelInfo(modelRef.model);
    const supportsTools = modelInfo?.supportsTools ?? false;

    // Build recommendation for unsupported models
    let recommendation: string | undefined;
    if (!supportsTools) {
      // Find similar models that support tools
      const alternatives = MODEL_CATALOG.filter(m => m.supportsTools && m.provider !== 'ollama').slice(0, 3);
      if (alternatives.length > 0) {
        recommendation = `This model doesn't support tools. Try: ${alternatives.map(a => a.name).join(', ')}`;
      }
    }

    return {
      supported: supportsTools,
      model: modelRef.model,
      provider: modelRef.provider,
      recommendation,
    };
  }

  /**
   * Chat with native tool calling using Vercel AI SDK
   * This uses the native tool() function for proper multi-step execution
   *
   * NOTE: If the model doesn't support native tool calling, tools will be
   * skipped and a warning will be included in the response.
   */
  // @ts-ignore - Types defined at end of file
  async chatWithNativeTools(request: any): Promise<any> {
    const startTime = Date.now();

    // Resolve model
    const modelRef = request.model
      ? this.resolveModel(request.model)
      : { provider: this.defaultProvider, model: 'llama3.2' };

    const model = this.getModel(modelRef.provider, modelRef.model);

    // Check if model supports native tool calling
    const toolSupport = this.modelSupportsTools(request.model);
    const shouldUseTools = toolSupport.supported && (request.tools?.length ?? 0) > 0;

    // Log warning if tools are requested but not supported
    if ((request.tools?.length ?? 0) > 0 && !toolSupport.supported) {
      logger.warn(`[AIProvider] Model ${modelRef.model} doesn't support native tool calling. Tools disabled.`, {
        component: 'AIProvider',
        model: modelRef.model,
        provider: modelRef.provider,
      });
    }

    // Convert messages to AI SDK format
    // @ts-ignore - msg type from request
    const messages: AIMessage[] = request.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    // Track tool calls and results
    const toolCallHistory: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];
    const toolResultHistory: Array<{ toolCallId: string; toolName: string; result: unknown; approvalRequired?: boolean; approvalId?: string }> = [];

    // Convert tool definitions to AI SDK format with execute handlers
    // Only build tools if the model supports them
    const tools: Record<string, ReturnType<typeof createTool>> = {};

    if (shouldUseTools) {
      for (const toolDef of request.tools || []) {
        // AI SDK v5+ uses inputSchema instead of parameters
        (tools as any)[toolDef.name] = createTool({
        description: toolDef.description,
        inputSchema: toolDef.parameters,
        execute: async (args: any) => {
          const toolCallId = randomUUID();

          // Record the tool call
          toolCallHistory.push({
            id: toolCallId,
            name: toolDef.name,
            arguments: args as Record<string, unknown>,
          });

          // Execute through the provided handler (which goes through security)
          if (request.onToolCall) {
            try {
              const result = await request.onToolCall(toolDef.name, args, toolCallId);

              // Handle approval required case
              if (result.approvalRequired) {
                toolResultHistory.push({
                  toolCallId,
                  toolName: toolDef.name,
                  result: {
                    pending: true,
                    approvalId: result.approvalId,
                    message: `Awaiting approval for ${toolDef.name}`
                  },
                  approvalRequired: true,
                  approvalId: result.approvalId,
                });
                return {
                  pending: true,
                  message: `Tool ${toolDef.name} requires approval. Approval ID: ${result.approvalId}`
                };
              }

              // Record successful result
              toolResultHistory.push({
                toolCallId,
                toolName: toolDef.name,
                result: result.result,
              });

              return result.result;
            } catch (error) {
              const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Tool execution failed',
              };
              toolResultHistory.push({
                toolCallId,
                toolName: toolDef.name,
                result: errorResult,
              });
              return errorResult;
            }
          }

          // No handler provided, return placeholder
          return { error: 'No tool execution handler provided' };
        },
      });
      }
    } // end if (shouldUseTools)

    try {
      const result = await generateText({
        model,
        messages,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
        maxSteps: request.maxToolRoundtrips ?? 5,
      } as any);

      const duration = Date.now() - startTime;
      const modelInfo = this.getModelInfo(modelRef.model);

      // Calculate usage
      const promptTokens = (result.usage as { promptTokens?: number })?.promptTokens ??
                           (result.usage as { inputTokens?: number })?.inputTokens ?? 0;
      const completionTokens = (result.usage as { completionTokens?: number })?.completionTokens ??
                               (result.usage as { outputTokens?: number })?.outputTokens ?? 0;
      const cost = modelInfo
        ? (promptTokens / 1_000_000) * modelInfo.costPer1MInput +
          (completionTokens / 1_000_000) * modelInfo.costPer1MOutput
        : 0;

      // Check if any tool calls require approval
      const pendingApprovals = toolResultHistory.filter(r => r.approvalRequired);

      return {
        id: randomUUID(),
        provider: modelRef.provider,
        model: modelRef.model,
        content: result.text,
        finishReason: pendingApprovals.length > 0
          ? 'approval-required'
          : toolCallHistory.length > 0
            ? 'tool-calls'
            : (result.finishReason === 'stop' ? 'stop' : 'length'),
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost,
        },
        duration,
        toolCalls: toolCallHistory.length > 0 ? toolCallHistory : undefined,
        toolResults: toolResultHistory.length > 0 ? toolResultHistory : undefined,
        pendingApprovals: pendingApprovals.length > 0 ? pendingApprovals : undefined,
        steps: result.steps?.length ?? 1,
        // Tool support info for UI warnings
        toolSupport: {
          requested: (request.tools?.length ?? 0) > 0,
          supported: toolSupport.supported,
          used: shouldUseTools,
          recommendation: toolSupport.recommendation,
        },
      };
    } catch (error) {
      logger.error(`[AIProvider] Native tool calling error:`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Stream chat with native tool calling
   */
  // @ts-ignore - Types defined at end of file
  async streamWithNativeTools(
    request: any,
    onChunk: (chunk: string) => void,
    onToolCall?: (toolName: string, args: unknown) => void,
    onToolResult?: (toolName: string, result: unknown) => void,
  ): Promise<any> {
    const startTime = Date.now();

    // Resolve model
    const modelRef = request.model
      ? this.resolveModel(request.model)
      : { provider: this.defaultProvider, model: 'llama3.2' };

    const model = this.getModel(modelRef.provider, modelRef.model);

    // Convert messages
    // @ts-ignore - msg type from request
    const messages: AIMessage[] = request.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    // Track tool calls
    const toolCallHistory: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];
    const toolResultHistory: Array<{ toolCallId: string; toolName: string; result: unknown; approvalRequired?: boolean; approvalId?: string }> = [];

    // Build tools with execute handlers
    const tools: Record<string, ReturnType<typeof createTool>> = {};

    for (const toolDef of request.tools || []) {
      // AI SDK v5+ uses inputSchema instead of parameters
      (tools as any)[toolDef.name] = createTool({
        description: toolDef.description,
        inputSchema: toolDef.parameters,
        execute: async (args: any) => {
          const toolCallId = randomUUID();

          toolCallHistory.push({
            id: toolCallId,
            name: toolDef.name,
            arguments: args as Record<string, unknown>,
          });

          // Notify about tool call
          onToolCall?.(toolDef.name, args);

          if (request.onToolCall) {
            try {
              const result = await request.onToolCall(toolDef.name, args, toolCallId);

              if (result.approvalRequired) {
                toolResultHistory.push({
                  toolCallId,
                  toolName: toolDef.name,
                  result: { pending: true, approvalId: result.approvalId },
                  approvalRequired: true,
                  approvalId: result.approvalId,
                });
                onToolResult?.(toolDef.name, { pending: true, approvalRequired: true });
                return { pending: true, message: `Awaiting approval` };
              }

              toolResultHistory.push({
                toolCallId,
                toolName: toolDef.name,
                result: result.result,
              });

              onToolResult?.(toolDef.name, result.result);
              return result.result;
            } catch (error) {
              const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed'
              };
              toolResultHistory.push({
                toolCallId,
                toolName: toolDef.name,
                result: errorResult,
              });
              onToolResult?.(toolDef.name, errorResult);
              return errorResult;
            }
          }

          return { error: 'No handler' };
        },
      });
    }

    try {
      const result = streamText({
        model,
        messages,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
        maxSteps: request.maxToolRoundtrips ?? 5,
      } as any);

      let fullText = '';

      for await (const chunk of result.textStream) {
        fullText += chunk;
        onChunk(chunk);
      }

      const usage = await result.usage;
      const duration = Date.now() - startTime;
      const modelInfo = this.getModelInfo(modelRef.model);

      const promptTokens = (usage as { promptTokens?: number })?.promptTokens ??
                           (usage as { inputTokens?: number })?.inputTokens ?? 0;
      const completionTokens = (usage as { completionTokens?: number })?.completionTokens ??
                               (usage as { outputTokens?: number })?.outputTokens ?? 0;
      const cost = modelInfo
        ? (promptTokens / 1_000_000) * modelInfo.costPer1MInput +
          (completionTokens / 1_000_000) * modelInfo.costPer1MOutput
        : 0;

      const pendingApprovals = toolResultHistory.filter(r => r.approvalRequired);

      return {
        id: randomUUID(),
        provider: modelRef.provider,
        model: modelRef.model,
        content: fullText,
        finishReason: pendingApprovals.length > 0
          ? 'approval-required'
          : toolCallHistory.length > 0
            ? 'tool-calls'
            : 'stop',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost,
        },
        duration,
        toolCalls: toolCallHistory.length > 0 ? toolCallHistory : undefined,
        toolResults: toolResultHistory.length > 0 ? toolResultHistory : undefined,
        pendingApprovals: pendingApprovals.length > 0 ? pendingApprovals : undefined,
        steps: 1,
      };
    } catch (error) {
      logger.error(`[AIProvider] Stream with tools error:`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async healthCheck(provider?: ProviderType): Promise<{
    provider: ProviderType;
    healthy: boolean;
    message: string;
    latencyMs?: number;
  }[]> {
    const results: {
      provider: ProviderType;
      healthy: boolean;
      message: string;
      latencyMs?: number;
    }[] = [];

    const providers = provider
      ? [provider]
      : this.getConfiguredProviders();

    for (const p of providers) {
      const start = Date.now();

      try {
        if (p === 'ollama') {
          // Check Ollama server
          const config = this.configs.get('ollama');
          const baseUrl = config?.baseUrl || 'http://localhost:11434';
          const response = await fetch(`${baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            results.push({
              provider: p,
              healthy: true,
              message: 'Ollama server is running',
              latencyMs: Date.now() - start,
            });
          } else {
            results.push({
              provider: p,
              healthy: false,
              message: `Ollama returned ${response.status}`,
              latencyMs: Date.now() - start,
            });
          }
        } else if (p === 'groq') {
          // Check Groq API
          const config = this.configs.get('groq');
          if (config?.apiKey) {
            try {
              const response = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { Authorization: `Bearer ${config.apiKey}` },
                signal: AbortSignal.timeout(5000),
              });
              results.push({
                provider: p,
                healthy: response.ok,
                message: response.ok ? 'Groq API is accessible' : `Groq returned ${response.status}`,
                latencyMs: Date.now() - start,
              });
            } catch {
              results.push({
                provider: p,
                healthy: false,
                message: 'Groq API unreachable',
                latencyMs: Date.now() - start,
              });
            }
          } else {
            results.push({
              provider: p,
              healthy: false,
              message: 'Groq not configured',
            });
          }
        } else if (p === 'azure') {
          // Azure OpenAI - check if configured (supports both baseUrl and resourceName modes)
          const config = this.configs.get('azure');
          const hasValidConfig = !!(config?.apiKey && (config?.baseUrl || config?.resourceName));
          results.push({
            provider: p,
            healthy: hasValidConfig,
            message: hasValidConfig
              ? `Azure OpenAI configured${config?.baseUrl ? ` (${config.baseUrl})` : config?.resourceName ? ` (${config.resourceName})` : ''}`
              : 'Azure OpenAI not configured',
            latencyMs: Date.now() - start,
          });
        } else {
          // For cloud providers, we assume they're healthy if configured
          results.push({
            provider: p,
            healthy: this.isConfigured(p),
            message: this.isConfigured(p)
              ? `${p} is configured`
              : `${p} not configured`,
          });
        }
      } catch (error) {
        results.push({
          provider: p,
          healthy: false,
          message: error instanceof Error ? error.message : 'Health check failed',
          latencyMs: Date.now() - start,
        });
      }
    }

    return results;
  }
}

// === Singleton Export ===

export const aiProvider = new AIProviderManager();

// === Helper Functions ===

/**
 * Quick chat function
 */
// === Tool Calling Types ===

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodType<unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatWithToolsResponse extends ChatResponse {
  toolCalls?: ToolCall[];
  toolResults?: Array<{
    toolCallId: string;
    toolName: string;
    result: unknown;
  }>;
}

export interface ChatWithToolsRequest extends ChatRequest {
  tools?: ToolDefinition[];
  executeTools?: (toolName: string, args: unknown) => Promise<unknown>;
  maxToolRoundtrips?: number;
}

// === Native Tool Calling Types ===

export interface NativeToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodType<unknown>;
}

export interface NativeToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface NativeToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
  approvalRequired?: boolean;
  approvalId?: string;
}

export interface ToolExecutionResult {
  result: unknown;
  approvalRequired?: boolean;
  approvalId?: string;
}

export interface ChatWithNativeToolsRequest extends ChatRequest {
  tools?: NativeToolDefinition[];
  onToolCall?: (toolName: string, args: unknown, toolCallId: string) => Promise<ToolExecutionResult>;
  maxToolRoundtrips?: number;
}

export interface ChatWithNativeToolsResponse extends ChatResponse {
  toolCalls?: NativeToolCall[];
  toolResults?: NativeToolResult[];
  pendingApprovals?: NativeToolResult[];
  steps?: number;
}

export async function chat(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
  }
): Promise<string> {
  const response = await aiProvider.chat({
    messages: [
      {
        id: randomUUID(),
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      },
    ],
    model: options?.model,
    systemPrompt: options?.systemPrompt,
    temperature: options?.temperature,
  });

  return response.content;
}

/**
 * Stream chat function
 */
export async function chatStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  options?: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
  }
): Promise<string> {
  const response = await aiProvider.chatStream(
    {
      messages: [
        {
          id: randomUUID(),
          role: 'user',
          content: prompt,
          timestamp: new Date().toISOString(),
        },
      ],
      model: options?.model,
      systemPrompt: options?.systemPrompt,
      temperature: options?.temperature,
    },
    onChunk
  );

  return response.content;
}
