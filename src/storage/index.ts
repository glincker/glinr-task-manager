import { LibSQLAdapter } from './libsql.js';
import type { StorageAdapter } from './adapter.js';
import { loadConfig } from '../utils/config-loader.js';

interface SettingsYaml {
  storage?: {
    tier: 'local' | 'memory';
    dbPath?: string;
  };
}

let storage: StorageAdapter | null = null;

/**
 * Initialize storage based on configuration
 */
export async function initStorage(): Promise<StorageAdapter> {
  const settings = loadConfig<SettingsYaml>('settings.yml');
  const tier = process.env.STORAGE_TIER || settings.storage?.tier || 'memory';

  if (tier === 'local') {
    const dbPath = process.env.DB_PATH || settings.storage?.dbPath;
    storage = new LibSQLAdapter({ dbPath });
    console.log(`[Storage] Initializing LibSQL storage at ${dbPath || 'default path'}`);
  } else {
    console.log('[Storage] Initializing in-memory storage (LibSQL in-memory)');
    storage = new LibSQLAdapter({ dbPath: ':memory:' });
  }

  await storage.connect();
  return storage;
}

/**
 * Get the global storage instance
 */
export function getStorage(): StorageAdapter {
  if (!storage) {
    throw new Error('Storage not initialized. Call initStorage() first.');
  }
  return storage;
}

export * from './adapter.js';
export * from './schema.js';
