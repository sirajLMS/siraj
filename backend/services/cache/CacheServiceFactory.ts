import { getEnvironmentConfig } from "@/backend/lib/env";
import { invalidateEnvConfigCache, resolveEnvConfig } from "@/backend/lib/env-config-resolver";
import { clearGlobalSingleton, getGlobalSingleton } from "@/backend/lib/global-singleton";
import logger from "@/backend/lib/logger";
import type { ICacheService } from "@/backend/services/cache/ICacheService";
import { PostgresCacheAdapter } from "@/backend/services/cache/PostgresCacheAdapter";

const CACHE_STATE_KEY = Symbol.for("siraj.cacheState");

type CacheState = {
  instance: ICacheService | null;
  initializationPromise: Promise<ICacheService> | null;
};

function getCacheState(): CacheState {
  return getGlobalSingleton(CACHE_STATE_KEY, () => ({
    instance: null,
    initializationPromise: null,
  }));
}

/**
 * Resolve the active cache provider using the DB-first / env-fallback strategy.
 *
 * Resolution order:
 *  1. `resolveEnvConfig("CACHE_PROVIDER")` — consults the DB override in
 *     `system_settings` under `env::CACHE_PROVIDER`, then falls back to the
 *     env var. If the resolved value is `"redis"` or `"postgres"`, use it.
 *  2. Any other non-empty string → logger.warn and fall back to the env-validated
 *     default from `getEnvironmentConfig().cacheProvider`.
 *  3. `undefined` (no DB override, no env override) → fall back to the env-validated
 *     default from `getEnvironmentConfig().cacheProvider` (typically `"redis"`).
 */
async function getCacheProvider(): Promise<"redis" | "postgres"> {
  const resolved = await resolveEnvConfig("CACHE_PROVIDER");

  if (resolved === "redis" || resolved === "postgres") {
    return resolved;
  }

  if (resolved !== undefined) {
    logger.warn(`Unknown cache provider from env-config override: ${resolved}. Falling back to env-validated default.`);
  }

  return getEnvironmentConfig().cacheProvider;
}

/**
 * Create PostgreSQL cache adapter
 */
function createPostgresCache(): ICacheService {
  logger.log("Connecting to PostgreSQL cache (UNLOGGED table)");
  return new PostgresCacheAdapter();
}

/**
 * Create Redis cache adapter (lazy import to avoid loading Redis when using PostgreSQL)
 */
async function createRedisCache(): Promise<ICacheService> {
  logger.log("Connecting to Redis cache");
  // Use dynamic import to avoid importing Redis module when using PostgreSQL
  const { RedisCacheAdapter } = await import("@/backend/services/cache/RedisCacheAdapter");
  return new RedisCacheAdapter();
}

/**
 * Create cache service based on provider type
 */
async function createCacheService(): Promise<ICacheService> {
  const provider = await getCacheProvider();

  logger.log(`🔧 Initializing Cache with provider: ${provider}`);

  switch (provider) {
    case "postgres":
      return createPostgresCache();

    case "redis":
      return await createRedisCache();

    default:
      logger.warn(`Unknown cache provider: ${provider}, falling back to redis`);
      return await createRedisCache();
  }
}

/**
 * Get cache service instance (singleton)
 */
export const getCacheService = async (): Promise<ICacheService> => {
  const state = getCacheState();

  if (state.instance) {
    return state.instance;
  }

  state.initializationPromise ??= (async () => {
    try {
      const service = await createCacheService();
      state.instance = service;
      return state.instance;
    } catch (error) {
      state.initializationPromise = null;
      logger.error("Failed to initialize cache service", error);
      throw error;
    }
  })();

  return state.initializationPromise;
};

/**
 * Reset instance (useful for testing)
 */
export const resetCacheService = (): void => {
  const state = getCacheState();
  if (state.instance) {
    state.instance.disconnect();
    state.instance = null;
  }
  state.initializationPromise = null;
  clearGlobalSingleton(CACHE_STATE_KEY);
  // Invalidate the env-config cache entry for CACHE_PROVIDER so that an
  // override update forces a fresh provider resolution on the next init.
  invalidateEnvConfigCache("CACHE_PROVIDER");
};

/**
 * Health check for cache connection
 */
export const checkCacheHealth = async (): Promise<boolean> => {
  try {
    const cache = await getCacheService();
    return await cache.ping();
  } catch (error) {
    logger.error("Cache health check failed:", error);
    return false;
  }
};

/**
 * Export singleton cache service instance
 * This provides a direct instance for synchronous usage where methods
 * will automatically wait for the underlying service to initialize.
 */
export const cacheService = {
  get: async (key: string) => {
    const service = await getCacheService();
    return service.get(key);
  },
  set: async (key: string, value: string, options?: { ex?: number; px?: number }) => {
    const service = await getCacheService();
    return service.set(key, value, options);
  },
  del: async (key: string) => {
    const service = await getCacheService();
    return service.del(key);
  },
  expire: async (key: string, seconds: number) => {
    const service = await getCacheService();
    return service.expire(key, seconds);
  },
  ttl: async (key: string) => {
    const service = await getCacheService();
    return service.ttl(key);
  },
  incr: async (key: string) => {
    const service = await getCacheService();
    return service.incr(key);
  },
  pipeline: async (commands: Array<{ command: string; args: (string | number)[] }>) => {
    const service = await getCacheService();
    return service.pipeline(commands);
  },
  ping: async () => {
    const service = await getCacheService();
    return service.ping();
  },
  disconnect: async () => {
    const service = await getCacheService();
    return service.disconnect();
  },
  stats: async () => {
    const service = await getCacheService();
    return service.stats();
  },
};
