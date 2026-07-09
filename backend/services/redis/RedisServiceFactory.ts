import { getEnvironmentConfig } from "@/backend/lib/env";
import { clearGlobalSingleton, getGlobalSingleton, getGlobalSingletonIfExists } from "@/backend/lib/global-singleton";
import logger from "@/backend/lib/logger";
import { sanitizeUrlCredentials } from "@/backend/lib/utils/url";
import type { IRedisService } from "@/backend/services/redis/IRedisService";
import { LocalRedisAdapter } from "@/backend/services/redis/LocalRedisAdapter";
import { UpstashRedisAdapter } from "@/backend/services/redis/UpstashRedisAdapter";

const REDIS_KEY = Symbol.for("siraj.redis");

/**
 * Create local Redis adapter
 */
function createLocalRedis(): IRedisService {
  const url = getEnvironmentConfig().redisUrl || "redis://localhost:6379";

  const sanitizedUrl = sanitizeUrlCredentials(url);
  logger.log(`Connecting to local Redis: ${sanitizedUrl}`);

  return new LocalRedisAdapter(url);
}

/**
 * Create Upstash Redis adapter
 */
function createUpstashRedis(): IRedisService {
  const { upstashRedisUrl: url, upstashRedisToken: token } = getEnvironmentConfig();

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
 * Create Redis service based on provider type
 */
function createRedisService(): IRedisService {
  const provider = getEnvironmentConfig().redisProvider;

  logger.log(`🔧 Initializing Redis with provider: ${provider}`);

  switch (provider) {
    case "local":
      return createLocalRedis();

    case "upstash":
      return createUpstashRedis();

    default:
      logger.warn(`Unknown Redis provider, falling back to local`);
      return createLocalRedis();
  }
}

/**
 * Get Redis service instance (lazy-loaded singleton)
 */
export const getRedisService = (): IRedisService => {
  return getGlobalSingleton(REDIS_KEY, createRedisService);
};

/**
 * Reset instance (useful for testing)
 */
export const resetRedisService = (): void => {
  const instance = getGlobalSingletonIfExists<IRedisService>(REDIS_KEY);
  if (instance) {
    instance.disconnect();
  }
  clearGlobalSingleton(REDIS_KEY);
};

/**
 * Health check for Redis connection
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const redis = getRedisService();
    return await redis.ping();
  } catch (error) {
    logger.error("Redis health check failed:", error);
    return false;
  }
};

/**
 * Export singleton instance (lazy-loaded)
 * Only initializes when actually accessed via proxy forwarding
 */
export const redisService = new Proxy({} as IRedisService, {
  get(_target, prop) {
    const service = getRedisService();
    return service[prop as keyof typeof service];
  },
});
