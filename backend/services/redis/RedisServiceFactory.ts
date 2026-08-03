import { getEnvironmentConfig } from "@/backend/lib/env";
import { invalidateEnvConfigCache, resolveEnvConfig, resolveEnvConfigMany } from "@/backend/lib/env-config-resolver";
import { clearGlobalSingleton, getGlobalSingleton } from "@/backend/lib/global-singleton";
import logger from "@/backend/lib/logger";
import { sanitizeUrlCredentials } from "@/backend/lib/utils/url";
import type { IRedisService, RedisProvider } from "@/backend/services/redis/IRedisService";
import { LocalRedisAdapter } from "@/backend/services/redis/LocalRedisAdapter";
import { UpstashRedisAdapter } from "@/backend/services/redis/UpstashRedisAdapter";

const REDIS_STATE_KEY = Symbol.for("siraj.redisState");

type RedisState = {
  instance: IRedisService | null;
  initializationPromise: Promise<IRedisService> | null;
};

function getRedisState(): RedisState {
  return getGlobalSingleton(REDIS_STATE_KEY, () => ({
    instance: null,
    initializationPromise: null,
  }));
}

/**
 * Resolve the active Redis provider using the DB-first / env-fallback strategy.
 *
 * Resolution order:
 *  1. `resolveEnvConfig("REDIS_PROVIDER")` — consults the DB override in
 *     `system_settings` under `env::REDIS_PROVIDER`, then falls back to the
 *     env var. If the resolved value is `"local"` or `"upstash"`, use it.
 *  2. Any other non-empty string → `logger.warn` and fall back to the
 *     env-validated default from `getEnvironmentConfig().redisProvider`.
 *  3. `undefined` (no DB override, no env override) → fall back to the
 *     env-validated default from `getEnvironmentConfig().redisProvider`.
 */
async function getRedisProvider(): Promise<RedisProvider> {
  const resolved = await resolveEnvConfig("REDIS_PROVIDER");

  if (resolved === "local" || resolved === "upstash") {
    return resolved;
  }

  if (resolved !== undefined) {
    logger.warn(`Unknown REDIS_PROVIDER override: ${resolved}, falling back to env default`);
  }

  return getEnvironmentConfig().redisProvider;
}

/**
 * Create local Redis adapter.
 *
 * The Redis URL is resolved DB-first via `resolveEnvConfig("REDIS_URL")`,
 * falling back to the env-validated `getEnvironmentConfig().redisUrl`
 * (and finally `"redis://localhost:6379"`) when no override is present.
 */
async function createLocalRedis(): Promise<IRedisService> {
  const resolvedUrl = await resolveEnvConfig("REDIS_URL");
  const url = resolvedUrl ?? getEnvironmentConfig().redisUrl ?? "redis://localhost:6379";

  const sanitizedUrl = sanitizeUrlCredentials(url);
  logger.log(`Connecting to local Redis: ${sanitizedUrl}`);

  return new LocalRedisAdapter(url);
}

/**
 * Create Upstash Redis adapter.
 *
 * The REST URL and token are resolved DB-first via a single batched
 * `resolveEnvConfigMany` call against `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN`. When the resolver returns `undefined` for
 * either, the env-validated values from `getEnvironmentConfig()` are used.
 */
async function createUpstashRedis(): Promise<IRedisService> {
  const resolved = await resolveEnvConfigMany(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);
  const url = resolved.UPSTASH_REDIS_REST_URL ?? getEnvironmentConfig().upstashRedisUrl;
  const token = resolved.UPSTASH_REDIS_REST_TOKEN ?? getEnvironmentConfig().upstashRedisToken;

  if (!url || !token) {
    throw new Error(
      "Upstash Redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. " +
        "Get these from https://console.upstash.com/"
    );
  }

  logger.log("Connecting to Upstash Redis (serverless)");

  return new UpstashRedisAdapter(url, token);
}

/**
 * Create Redis service based on provider type.
 *
 * Provider selection consults the DB override first (via `getRedisProvider`),
 * and adapter construction awaits the per-adapter env-config resolution so
 * that overridden `REDIS_URL` / `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
 * values take effect on the next init.
 */
async function createRedisService(): Promise<IRedisService> {
  const provider = await getRedisProvider();

  logger.log(`🔧 Initializing Redis with provider: ${provider}`);

  switch (provider) {
    case "local":
      return await createLocalRedis();

    case "upstash":
      return await createUpstashRedis();

    default:
      logger.warn(`Unknown Redis provider, falling back to local`);
      return await createLocalRedis();
  }
}

/**
 * Get Redis service instance (singleton).
 *
 * Returns a `Promise<IRedisService>` because the underlying provider and
 * connection settings are resolved DB-first via the async env-config
 * resolver. Concurrent callers share a single in-flight
 * `initializationPromise`; once initialized, the cached `instance` is
 * returned synchronously to subsequent callers.
 */
export const getRedisService = async (): Promise<IRedisService> => {
  const state = getRedisState();

  if (state.instance) {
    return state.instance;
  }

  state.initializationPromise ??= (async () => {
    try {
      const service = await createRedisService();
      state.instance = service;
      return state.instance;
    } catch (error) {
      state.initializationPromise = null;
      logger.error("Failed to initialize Redis service", error);
      throw error;
    }
  })();

  return state.initializationPromise;
};

/**
 * Reset instance (useful for testing, and after a Settings override update).
 *
 * Disconnects and clears the cached singleton AND invalidates the env-config
 * cache entries for every Redis-related key so that the next `getRedisService()`
 * call performs a fresh provider / connection resolution against the DB.
 */
export const resetRedisService = (): void => {
  const state = getRedisState();
  if (state.instance) {
    // `disconnect()` is async but we intentionally do not await it here so
    // that test teardown remains synchronous (matching the prior shape).
    // The `.catch(...)` swallows rejections from the fire-and-forget promise.
    Promise.resolve(state.instance.disconnect()).catch(error => {
      logger.warn(`Error disconnecting Redis during reset: ${String(error)}`);
    });
    state.instance = null;
  }
  state.initializationPromise = null;
  clearGlobalSingleton(REDIS_STATE_KEY);

  invalidateEnvConfigCache("REDIS_PROVIDER");
  invalidateEnvConfigCache("REDIS_URL");
  invalidateEnvConfigCache("UPSTASH_REDIS_REST_URL");
  invalidateEnvConfigCache("UPSTASH_REDIS_REST_TOKEN");
};

/**
 * Health check for Redis connection
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const redis = await getRedisService();
    return await redis.ping();
  } catch (error) {
    logger.error("Redis health check failed:", error);
    return false;
  }
};

/**
 * Exported singleton-style redis service. Each method awaits
 * `getRedisService()` before forwarding to the lazily-initialized adapter,
 * mirroring the `cacheService` wrapper shape in `CacheServiceFactory.ts`.
 * Callers that previously used `redisService.foo(...)` synchronously must
 * now `await redisService.foo(...)` — the methods are all async.
 */
export const redisService: IRedisService = {
  get: async (key: string) => {
    const service = await getRedisService();
    return service.get(key);
  },
  set: async (key: string, value: string, options?: { ex?: number; px?: number }) => {
    const service = await getRedisService();
    return service.set(key, value, options);
  },
  setNx: async (key: string, value: string, pxMs: number) => {
    const service = await getRedisService();
    return service.setNx(key, value, pxMs);
  },
  del: async (key: string) => {
    const service = await getRedisService();
    return service.del(key);
  },
  expire: async (key: string, seconds: number) => {
    const service = await getRedisService();
    return service.expire(key, seconds);
  },
  ttl: async (key: string) => {
    const service = await getRedisService();
    return service.ttl(key);
  },
  incr: async (key: string) => {
    const service = await getRedisService();
    return service.incr(key);
  },
  pipeline: async (commands: Array<{ command: string; args: (string | number)[] }>) => {
    const service = await getRedisService();
    return service.pipeline(commands);
  },
  ping: async () => {
    const service = await getRedisService();
    return service.ping();
  },
  disconnect: async () => {
    const service = await getRedisService();
    return service.disconnect();
  },
  stats: async () => {
    const service = await getRedisService();
    return service.stats();
  },
};
