import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { 
  initStorage, 
  getStorage, 
  getDb, 
  getClient, 
  saveProviderConfig, 
  loadProviderConfig, 
  loadAllProviderConfigs, 
  deleteProviderConfig,
  type SavedProviderConfig
} from './index.js';

describe('Storage Index', () => {
  beforeAll(async () => {
    process.env.STORAGE_TIER = 'memory';
    await initStorage();
  });

  it('should return persistent storage instance', async () => {
    const storage = await initStorage();
    expect(storage).toBeDefined();
    expect(getStorage()).toBe(storage);
  });

  it('should provide drizzle db and client', () => {
    expect(getDb()).toBeDefined();
    expect(getClient()).toBeDefined();
  });

  describe('AI Provider Configs', () => {
    const testConfig: SavedProviderConfig = {
      type: 'openai-test',
      apiKey: 'sk-123',
      baseUrl: 'https://api.openai.com/v1',
      enabled: true,
      defaultModel: 'gpt-4'
    };

    it('should save and load a provider config', async () => {
      await saveProviderConfig(testConfig);
      
      const loaded = await loadProviderConfig('openai-test');
      expect(loaded).toEqual(testConfig);
    });

    it('should handle non-existent configs', async () => {
      const loaded = await loadProviderConfig('non-existent');
      expect(loaded).toBeNull();
    });

    it('should load all provider configs', async () => {
      const anotherConfig: SavedProviderConfig = {
        type: 'anthropic-test',
        apiKey: 'sk-456',
        enabled: false
      };
      
      await saveProviderConfig(testConfig);
      await saveProviderConfig(anotherConfig);
      
      const all = await loadAllProviderConfigs();
      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all.find(c => c.type === 'openai-test')).toBeDefined();
      expect(all.find(c => c.type === 'anthropic-test')).toBeDefined();
    });

    it('should delete a provider config', async () => {
      await saveProviderConfig(testConfig);
      await deleteProviderConfig('openai-test');
      
      const loaded = await loadProviderConfig('openai-test');
      expect(loaded).toBeNull();
    });

    it('should handle JSON parse errors gracefully', async () => {
      const client = getClient();
      // Manually insert invalid JSON
      await client.execute({
        sql: `INSERT INTO settings (key, value, category) VALUES (?, ?, 'ai_providers')`,
        args: ['provider_bad-json', '{ invalid json }']
      });

      const loaded = await loadProviderConfig('bad-json');
      expect(loaded).toBeNull();

      const all = await loadAllProviderConfigs();
      expect(all.find(c => c.type === 'bad-json')).toBeUndefined();
    });
  });
});
