import type { KeyValueCache, KeyValueCacheSetOptions } from "@apollo/utils.keyvaluecache";
import { cacheService } from "./CacheServiceFactory";

/**
 * Apollo KeyValueCache Adapter
 * Wraps our existing cache service to work with Apollo Server's KeyValueCache interface
 * This enables Automatic Persisted Queries (APQ) to use our Redis/PostgreSQL cache
 */
export class ApolloCacheAdapter implements KeyValueCache {
  /**
   * Get a value from cache
   * Apollo expects `undefined` for missing keys, our cache returns `null`
   */
  async get(key: string): Promise<string | undefined> {
    const value = await cacheService.get(key);
    return value ?? undefined;
  }

  /**
   * Set a value in cache
   * Converts Apollo's TTL options to our cache service format
   */
  async set(key: string, value: string, options?: KeyValueCacheSetOptions): Promise<void> {
    // Convert Apollo's ttl option to our cache service's ex option
    const cacheOptions = options?.ttl ? { ex: options.ttl } : undefined;
    await cacheService.set(key, value, cacheOptions);
  }

  /**
   * Delete a key from cache
   * Apollo uses `delete`, our cache service uses `del`
   */
  async delete(key: string): Promise<boolean | undefined> {
    await cacheService.del(key);
    return true;
  }
}
