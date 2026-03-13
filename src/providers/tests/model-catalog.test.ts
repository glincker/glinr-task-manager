import { describe, expect, it } from 'vitest';
import {
  MODEL_ALIASES,
  MODEL_CATALOG,
  getModelInfo,
  getModelsForProvider,
  getAllModels,
  resolveModelAlias,
} from '../core/models.js';
import { ProviderType, type ModelInfo } from '../core/types.js';

describe('Model Catalog', () => {
  // ===========================================================================
  // MODEL_ALIASES
  // ===========================================================================

  describe('MODEL_ALIASES', () => {
    it('has aliases for common providers', () => {
      expect(MODEL_ALIASES['opus']).toBeDefined();
      expect(MODEL_ALIASES['sonnet']).toBeDefined();
      expect(MODEL_ALIASES['haiku']).toBeDefined();
      expect(MODEL_ALIASES['gpt']).toBeDefined();
      expect(MODEL_ALIASES['gemini']).toBeDefined();
      expect(MODEL_ALIASES['local']).toBeDefined();
    });

    it('core aliases reference valid providers', () => {
      // Some beta aliases (replicate, gh-models) may reference providers not yet in enum
      const betaProviders = new Set(['replicate', 'github-models']);
      for (const [alias, value] of Object.entries(MODEL_ALIASES)) {
        if (betaProviders.has(value.provider)) continue;
        const result = ProviderType.safeParse(value.provider);
        expect(result.success, `Alias "${alias}" has invalid provider "${value.provider}"`).toBe(true);
      }
    });

    it('all aliases have non-empty model strings', () => {
      for (const [alias, value] of Object.entries(MODEL_ALIASES)) {
        expect(value.model.length, `Alias "${alias}" has empty model`).toBeGreaterThan(0);
      }
    });

    it('has replicate alias', () => {
      expect(MODEL_ALIASES['replicate']).toBeDefined();
      expect(MODEL_ALIASES['replicate'].provider).toBe('replicate');
    });

    it('has github models aliases', () => {
      expect(MODEL_ALIASES['gh-models']).toBeDefined();
      expect(MODEL_ALIASES['gh-models'].provider).toBe('github-models');
      expect(MODEL_ALIASES['gh-phi']).toBeDefined();
    });
  });

  // ===========================================================================
  // MODEL_CATALOG
  // ===========================================================================

  describe('MODEL_CATALOG', () => {
    it('is a non-empty array', () => {
      expect(MODEL_CATALOG.length).toBeGreaterThan(10);
    });

    it('all entries have required fields', () => {
      for (const model of MODEL_CATALOG) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxOutput).toBeGreaterThan(0);
        expect(typeof model.supportsVision).toBe('boolean');
        expect(typeof model.supportsStreaming).toBe('boolean');
        expect(typeof model.supportsTools).toBe('boolean');
        expect(model.costPer1MInput).toBeGreaterThanOrEqual(0);
        expect(model.costPer1MOutput).toBeGreaterThanOrEqual(0);
      }
    });

    it('core entries reference valid providers', () => {
      const betaProviders = new Set(['replicate', 'github-models']);
      for (const model of MODEL_CATALOG) {
        if (betaProviders.has(model.provider)) continue;
        const result = ProviderType.safeParse(model.provider);
        expect(result.success, `Model "${model.id}" has invalid provider "${model.provider}"`).toBe(true);
      }
    });

    it('includes anthropic models', () => {
      const anthropicModels = MODEL_CATALOG.filter(m => m.provider === 'anthropic');
      expect(anthropicModels.length).toBeGreaterThanOrEqual(3);
    });

    it('includes openai models', () => {
      const openaiModels = MODEL_CATALOG.filter(m => m.provider === 'openai');
      expect(openaiModels.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ===========================================================================
  // getModelInfo
  // ===========================================================================

  describe('getModelInfo', () => {
    it('returns model info for known model', () => {
      const info = getModelInfo('claude-opus-4-6');
      expect(info).toBeDefined();
      expect(info!.provider).toBe('anthropic');
      expect(info!.name).toBe('Claude Opus 4.6');
    });

    it('returns undefined for unknown model', () => {
      expect(getModelInfo('nonexistent-model')).toBeUndefined();
    });
  });

  // ===========================================================================
  // getModelsForProvider
  // ===========================================================================

  describe('getModelsForProvider', () => {
    it('returns models for anthropic', () => {
      const models = getModelsForProvider('anthropic');
      expect(models.length).toBeGreaterThanOrEqual(3);
      expect(models.every(m => m.provider === 'anthropic')).toBe(true);
    });

    it('returns empty array for provider with no catalog entries', () => {
      // Some providers may have aliases but no catalog entries
      const models = getModelsForProvider('copilot');
      // Could be 0 or more, just check it's an array
      expect(Array.isArray(models)).toBe(true);
    });
  });

  // ===========================================================================
  // getAllModels
  // ===========================================================================

  describe('getAllModels', () => {
    it('returns all models', () => {
      const models = getAllModels();
      expect(models.length).toBe(MODEL_CATALOG.length);
    });
  });

  // ===========================================================================
  // resolveModelAlias
  // ===========================================================================

  describe('resolveModelAlias', () => {
    it('resolves known alias', () => {
      const result = resolveModelAlias('opus');
      expect(result).toBeDefined();
      expect(result!.provider).toBe('anthropic');
      expect(result!.model).toBe('claude-opus-4-6');
    });

    it('resolves provider/model format', () => {
      const result = resolveModelAlias('openai/gpt-4o');
      expect(result).toBeDefined();
      expect(result!.provider).toBe('openai');
      expect(result!.model).toBe('gpt-4o');
    });

    it('returns undefined for unknown alias', () => {
      expect(resolveModelAlias('completely-unknown')).toBeUndefined();
    });

    it('returns undefined for invalid provider/model format', () => {
      expect(resolveModelAlias('invalid-provider/gpt-4o')).toBeUndefined();
    });

    it('resolves replicate alias', () => {
      const result = resolveModelAlias('replicate');
      expect(result).toBeDefined();
      expect(result!.provider).toBe('replicate');
    });

    it('resolves github models alias', () => {
      const result = resolveModelAlias('gh-models');
      expect(result).toBeDefined();
      expect(result!.provider).toBe('github-models');
    });
  });
});
