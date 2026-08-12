import { CacheAdapterBase } from "@/backend/services/cache/__shared__/CacheAdapterBase";
import { getRedisService } from "@/backend/services/redis";

const DBSIZE_KEY = "dbsize";

function hasDbsize(redis: object): redis is { dbsize: () => Promise<number> } {
  return DBSIZE_KEY in redis && typeof redis[DBSIZE_KEY] === "function";
}

/**
 * Redis Cache Adapter
 * Wrapper around existing IRedisService to match ICacheService interface
 * Simply delegates to redisService singleton
 */
export class RedisCacheAdapter extends CacheAdapterBase {
  /**
   * Get a value from cache
   */
  override async get(key: string): Promise<string | null> {
    const redis = await getRedisService();
    return await redis.get(key);
  }

  /**
   * Set a value in cache
   */
  override async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    const redis = await getRedisService();
    await redis.set(key, value, options);
  }

  /**
   * Atomically set a value only if the key does NOT exist, with a TTL in ms.
   * Returns `"OK"` if set (first caller), `null` if key already exists.
   */
  override async setNx(key: string, value: string, pxMs: number): Promise<string | null> {
    const redis = await getRedisService();
    return await redis.setNx(key, value, pxMs);
  }

  /**
   * Increment a value in cache
   */
  override async incr(key: string): Promise<number> {
    const redis = await getRedisService();
    return await redis.incr(key);
  }

  /**
   * Set expiration time on a key
   */
  override async expire(key: string, seconds: number): Promise<void> {
    const redis = await getRedisService();
    await redis.expire(key, seconds);
  }

  /**
   * Get time to live for a key
   */
  override async ttl(key: string): Promise<number> {
    const redis = await getRedisService();
    return await redis.ttl(key);
  }

  /**
   * Delete a key
   */
  override async del(key: string): Promise<void> {
    const redis = await getRedisService();
    await redis.del(key);
  }

  /**
   * Execute a pipeline of commands (for atomic operations)
   */
  override async pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]> {
    const redis = await getRedisService();
    return await redis.pipeline(commands);
  }

  /**
   * Check if cache connection is healthy
   */
  override async ping(): Promise<boolean> {
    const redis = await getRedisService();
    return await redis.ping();
  }

  /**
   * Close the connection
   */
  override async disconnect(): Promise<void> {
    const redis = await getRedisService();
    await redis.disconnect();
  }

  /** Provider name for cache stats. */
  protected getProviderName(): string {
    return "redis";
  }

  /** Get the dbsize from Redis if available, otherwise return 0. */
  protected async getCacheSize(): Promise<number> {
    const redis = await getRedisService();
    if (hasDbsize(redis)) {
      return await redis.dbsize();
    }
    return 0;
  }
}
