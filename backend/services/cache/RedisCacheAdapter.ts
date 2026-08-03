import logger from "@/backend/lib/logger";
import { getEntityCacheStats } from "@/backend/services/cache/EntityCacheService";
import type { ICacheService } from "@/backend/services/cache/ICacheService";
import { getRedisService } from "@/backend/services/redis";
import type { CacheStats } from "@/backend/services/shared/CacheInterface";

/**
 * Redis Cache Adapter
 * Wrapper around existing IRedisService to match ICacheService interface
 * Simply delegates to redisService singleton
 */
export class RedisCacheAdapter implements ICacheService {
  /**
   * Get a value from cache
   */
  async get(key: string): Promise<string | null> {
    const redis = await getRedisService();
    return await redis.get(key);
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    const redis = await getRedisService();
    await redis.set(key, value, options);
  }

  /**
   * Atomically set a value only if the key does NOT exist, with a TTL in ms.
   * Returns `"OK"` if set (first caller), `null` if key already exists.
   */
  async setNx(key: string, value: string, pxMs: number): Promise<string | null> {
    const redis = await getRedisService();
    return await redis.setNx(key, value, pxMs);
  }

  /**
   * Increment a value in cache
   */
  async incr(key: string): Promise<number> {
    const redis = await getRedisService();
    return await redis.incr(key);
  }

  /**
   * Set expiration time on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    const redis = await getRedisService();
    await redis.expire(key, seconds);
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    const redis = await getRedisService();
    return await redis.ttl(key);
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    const redis = await getRedisService();
    await redis.del(key);
  }

  /**
   * Execute a pipeline of commands (for atomic operations)
   */
  async pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]> {
    const redis = await getRedisService();
    return await redis.pipeline(commands);
  }

  /**
   * Check if cache connection is healthy
   */
  async ping(): Promise<boolean> {
    const redis = await getRedisService();
    return await redis.ping();
  }

  /**
   * Close the connection
   */
  async disconnect(): Promise<void> {
    const redis = await getRedisService();
    await redis.disconnect();
  }

  /**
   * Get cache statistics and metrics
   */
  async stats(): Promise<CacheStats> {
    try {
      const redis = await getRedisService();
      let size = 0;
      let providerName = "redis";
      if ("dbsize" in redis && typeof (redis as { dbsize?: () => Promise<number> }).dbsize === "function") {
        size = await (redis as { dbsize: () => Promise<number> }).dbsize();
      }
      if ("providerName" in redis && typeof (redis as { providerName?: () => string }).providerName === "function") {
        providerName = (redis as { providerName: () => string }).providerName();
      }
      return {
        provider: providerName,
        size,
        hitsByPrefix: getEntityCacheStats(),
      };
    } catch (error) {
      logger.error("Redis cache stats error:", error);
      return {
        provider: "redis",
        size: 0,
        hitsByPrefix: getEntityCacheStats(),
      };
    }
  }
}
