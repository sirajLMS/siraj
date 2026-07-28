import type { ICacheService } from "@/backend/services/cache/ICacheService";
import { getRedisService } from "@/backend/services/redis";

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
}
