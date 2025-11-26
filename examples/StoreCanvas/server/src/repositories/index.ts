import { getConfig } from '../config';
import { logger } from '../logging/logger';
import { buildInMemoryRepositories } from './memory';
import { RepositoryProvider } from './interfaces';
import { buildMongoRepositories } from './mongodb';

let cachedProvider: RepositoryProvider | null = null;
let initializing: Promise<RepositoryProvider> | null = null;

export const initRepositoryProvider = async (opts?: { forceInMemory?: boolean }) => {
  if (cachedProvider) return cachedProvider;
  if (initializing) return initializing;

  initializing = (async () => {
    const config = getConfig();

    if (opts?.forceInMemory) {
      cachedProvider = buildInMemoryRepositories();
      return cachedProvider;
    }

    switch (config.DB_PROVIDER) {
      case 'mongodb':
        try {
          cachedProvider = await buildMongoRepositories();
        } catch (err) {
          logger.warn({ err }, 'Failed to initialize MongoDB repositories, falling back to in-memory');
          cachedProvider = buildInMemoryRepositories();
        }
        break;
      case 'postgres':
      case 'supabase':
        cachedProvider = buildInMemoryRepositories();
        break;
      default:
        cachedProvider = buildInMemoryRepositories();
    }
    return cachedProvider;
  })();

  return initializing;
};

export const getRepositoryProvider = (): RepositoryProvider => {
  if (!cachedProvider) {
    throw new Error('Repository provider not initialized. Call initRepositoryProvider first.');
  }
  return cachedProvider;
};

export const resetRepositoryProvider = () => {
  cachedProvider = null;
  initializing = null;
};
