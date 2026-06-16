import logger from "@/backend/lib/logger";
import type { IRedisService } from "./IRedisService";
import { LocalRedisAdapter } from "./LocalRedisAdapter";
import { UpstashRedisAdapter } from "./UpstashRedisAdapter";

// Module-level state replaces the static class properties
let instance: IRedisService | null = null;

/**
 * Create local Redis adapter
 */
function createLocalRedis(): IRedisService {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  logger.log(`Connecting to local Redis: ${url}`);

  return new LocalRedisAdapter(url);
}

/**
 * Create Upstash Redis adapter
 */
function createUpstashRedis(): IRedisService {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

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
  const provider = process.env.REDIS_PROVIDER;

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
  instance ??= createRedisService();
  return instance;
};

/**
 * Reset instance (useful for testing)
 */
export const resetRedisService = (): void => {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
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
