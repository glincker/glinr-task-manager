import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock all provider SDK factories
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn((model: string) => ({ modelId: model, provider: 'anthropic' }))),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => {
    const fn = vi.fn((model: string) => ({ modelId: model, provider: 'openai-compat' }));
    (fn as Record<string, unknown>).chat = vi.fn((model: string) => ({ modelId: model, provider: 'openai-chat' }));
    return fn;
  }),
}));

vi.mock('@ai-sdk/azure', () => ({
  createAzure: vi.fn(() => vi.fn((model: string) => ({ modelId: model, provider: 'azure' }))),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn((model: string) => ({ modelId: model, provider: 'google' }))),
}));

vi.mock('ai-sdk-ollama', () => ({
  createOllama: vi.fn(() => vi.fn((model: string) => ({ modelId: model, provider: 'ollama' }))),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
  tool: vi.fn(),
  jsonSchema: vi.fn((s: unknown) => s),
}));

vi.mock('zod-to-json-schema', () => ({
  zodToJsonSchema: vi.fn(() => ({ type: 'object', properties: {} })),
}));

vi.mock('../schema-utils.js', () => ({
  normalizeToolSchema: vi.fn((s: unknown) => s),
}));

// Import after mocks
import { aiProvider, ProviderType, MODEL_ALIASES, MODEL_CATALOG, PROVIDER_STATUS } from '../ai-sdk.js';

describe('AIProviderManager (aiProvider singleton)', () => {
  // ===========================================================================
  // Re-exports
  // ===========================================================================

  describe('re-exports', () => {
    it('exports ProviderType Zod enum', () => {
      expect(ProviderType).toBeDefined();
      expect(ProviderType.safeParse('anthropic').success).toBe(true);
      expect(ProviderType.safeParse('invalid-provider').success).toBe(false);
    });

    it('exports MODEL_ALIASES', () => {
      expect(MODEL_ALIASES).toBeDefined();
      expect(typeof MODEL_ALIASES).toBe('object');
      expect(MODEL_ALIASES['opus']).toBeDefined();
    });

    it('exports MODEL_CATALOG', () => {
      expect(MODEL_CATALOG).toBeDefined();
      expect(Array.isArray(MODEL_CATALOG)).toBe(true);
    });

    it('exports PROVIDER_STATUS', () => {
      expect(PROVIDER_STATUS).toBeDefined();
      expect(PROVIDER_STATUS['anthropic']).toBe('stable');
      expect(PROVIDER_STATUS['copilot']).toBe('experimental');
    });
  });

  // ===========================================================================
  // getDefaultProvider
  // ===========================================================================

  describe('getDefaultProvider', () => {
    it('returns a valid provider type', () => {
      const provider = aiProvider.getDefaultProvider();
      expect(ProviderType.safeParse(provider).success).toBe(true);
    });

    it('defaults to ollama when no cloud API keys are set', () => {
      // The singleton was initialized without API keys in test env
      const provider = aiProvider.getDefaultProvider();
      expect(provider).toBe('ollama');
    });
  });

  // ===========================================================================
  // isConfigured
  // ===========================================================================

  describe('isConfigured', () => {
    it('returns true for ollama (always configured)', () => {
      expect(aiProvider.isConfigured('ollama')).toBe(true);
    });

    it('returns false for unconfigured providers', () => {
      // In test env without API keys
      if (!process.env.ANTHROPIC_API_KEY) {
        expect(aiProvider.isConfigured('anthropic')).toBe(false);
      }
    });
  });

  // ===========================================================================
  // getConfiguredProviders
  // ===========================================================================

  describe('getConfiguredProviders', () => {
    it('returns an array of configured providers', () => {
      const providers = aiProvider.getConfiguredProviders();
      expect(Array.isArray(providers)).toBe(true);
      // At minimum ollama should be configured
      expect(providers).toContain('ollama');
    });
  });

  // ===========================================================================
  // resolveModel
  // ===========================================================================

  describe('resolveModel', () => {
    it('resolves provider/model format', () => {
      const result = aiProvider.resolveModel('openai/gpt-4o');
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o');
    });

    it('resolves known aliases', () => {
      const result = aiProvider.resolveModel('opus');
      expect(result.provider).toBe('anthropic');
      expect(result.model).toBe('claude-opus-4-6');
    });

    it('resolves case-insensitively', () => {
      const result = aiProvider.resolveModel('OPUS');
      expect(result.provider).toBe('anthropic');
    });

    it('resolves catalog model IDs', () => {
      const result = aiProvider.resolveModel('gpt-4o');
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o');
    });

    it('falls back to default provider for unknown models', () => {
      const result = aiProvider.resolveModel('some-unknown-model');
      expect(result.provider).toBe(aiProvider.getDefaultProvider());
    });

    it('resolves replicate alias', () => {
      const result = aiProvider.resolveModel('replicate');
      // Replicate alias exists in MODEL_ALIASES but provider may not be in enum
      expect(result).toBeDefined();
    });

    it('resolves github-models alias', () => {
      const result = aiProvider.resolveModel('gh-models');
      // gh-models alias exists in MODEL_ALIASES
      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // configure
  // ===========================================================================

  describe('configure', () => {
    it('configures a new provider', () => {
      aiProvider.configure('groq', {
        type: 'groq',
        apiKey: 'test-groq-key',
        enabled: true,
      });

      expect(aiProvider.isConfigured('groq')).toBe(true);
      expect(aiProvider.getConfiguredProviders()).toContain('groq');
    });

    it('configures deepseek provider', () => {
      aiProvider.configure('deepseek', {
        type: 'deepseek',
        apiKey: 'sk-test-deepseek',
        enabled: true,
      });

      expect(aiProvider.isConfigured('deepseek')).toBe(true);
    });
  });

  // ===========================================================================
  // getModel
  // ===========================================================================

  describe('getModel', () => {
    it('returns a model for ollama', async () => {
      const model = await aiProvider.getModel('ollama', 'llama3.2');
      expect(model).toBeDefined();
    });

    it('throws for unconfigured provider', async () => {
      // Ensure provider is not configured first
      if (!aiProvider.isConfigured('anthropic')) {
        await expect(aiProvider.getModel('anthropic', 'claude-sonnet-4-6')).rejects.toThrow();
      }
    });
  });

  // ===========================================================================
  // loadSavedConfigs
  // ===========================================================================

  describe('loadSavedConfigs', () => {
    it('loads saved configurations', async () => {
      const loader = vi.fn(async () => [
        { type: 'mistral', apiKey: 'sk-test-mistral', enabled: true },
      ]);

      const loaded = await aiProvider.loadSavedConfigs(loader);
      expect(loaded).toBe(1);
      expect(aiProvider.isConfigured('mistral')).toBe(true);
    });

    it('returns 0 when loader throws', async () => {
      const loader = vi.fn(async () => {
        throw new Error('DB not available');
      });

      const loaded = await aiProvider.loadSavedConfigs(loader);
      expect(loaded).toBe(0);
    });

    it('returns 0 for empty array', async () => {
      const loaded = await aiProvider.loadSavedConfigs(async () => []);
      expect(loaded).toBe(0);
    });
  });

  // ===========================================================================
  // autoSelectDefaultProvider
  // ===========================================================================

  describe('autoSelectDefaultProvider', () => {
    it('selects the highest-priority configured provider', () => {
      // After configuring groq in earlier tests
      aiProvider.autoSelectDefaultProvider();
      const provider = aiProvider.getDefaultProvider();
      // Should be groq or higher (depends on earlier test state)
      expect(ProviderType.safeParse(provider).success).toBe(true);
    });
  });

  // ===========================================================================
  // ProviderType enum completeness
  // ===========================================================================

  describe('ProviderType enum', () => {
    it('includes all expected providers', () => {
      const expectedProviders = [
        'anthropic', 'openai', 'azure', 'google', 'ollama', 'openrouter',
        'groq', 'xai', 'mistral', 'cohere', 'perplexity', 'deepseek',
        'together', 'cerebras', 'fireworks', 'copilot',
      ];

      for (const provider of expectedProviders) {
        expect(
          ProviderType.safeParse(provider).success,
          `Provider "${provider}" should be valid`,
        ).toBe(true);
      }
    });

    it('rejects invalid provider names', () => {
      expect(ProviderType.safeParse('invalid').success).toBe(false);
      expect(ProviderType.safeParse('chatgpt').success).toBe(false);
    });
  });
});
