import { logger } from "@/backend/lib/logger";
import { getEntityCacheStats } from "@/backend/services/cache/entity-cache-stats";
import type { ICacheService } from "@/backend/services/cache/ICacheService";
import type { CacheStats } from "@/backend/services/shared/CacheInterface";

/**
 * Abstract base class for cache adapters implementing {@link ICacheService}.
 *
 * Eliminates the cross-file duplication between {@code PostgresCacheAdapter}
 * and {@code RedisCacheAdapter} by providing:
 * <ul>
 *   <li>The complete {@code stats()} implementation (template method pattern)</li>
 *   <li>A shared fallback-stats builder for error paths</li>
 *   <li>Abstract method declarations for every adapter-specific operation</li>
 * </ul>
 *
 * Subclasses only need to implement the adapter-specific primitives
 * ({@link #getProviderName}, {@link #getCacheSize}, {@link #get}, {@link #set},
 * {@link #setNx}, {@link #incr}, {@link #expire}, {@link #ttl}, {@link #del},
 * {@link #pipeline}, {@link #ping}, {@link #disconnect}).
 */
export abstract class CacheAdapterBase implements ICacheService {
  // ─── Template Methods ────────────────────────────────────────────────────

  /**
   * Build a cache-stats object for the error/fallback path.
   *
   * Every adapter's {@code stats()} catch-block returns the same structure:
   * the provider name, zero size, and the live entity-cache hit/miss map.
   * Centralising this avoids a repeated object literal across both adapters.
   */
  protected buildFallbackStats(): CacheStats {
    return {
      provider: this.getProviderName(),
      size: 0,
      hitsByPrefix: getEntityCacheStats(),
    };
  }

  /**
   * Get cache statistics and metrics.
   *
   * This is a template method — it delegates the provider-specific size
   * calculation to {@link #getCacheSize} and wraps the whole call in
   * error handling shared by both adapters.
   */
  async stats(): Promise<CacheStats> {
    try {
      const size = await this.getCacheSize();
      return {
        provider: this.getProviderName(),
        size,
        hitsByPrefix: getEntityCacheStats(),
      };
    } catch (error) {
      logger.error(`${this.getProviderName()} cache stats error:`, error);
      return this.buildFallbackStats();
    }
  }

  // ─── Abstract Primitives ───────────────────────────────────────────────

  /** The stable provider name used in {@link CacheStats}. */
  protected abstract getProviderName(): string;

  /** Compute the current cache size (number of entries). */
  protected abstract getCacheSize(): Promise<number>;

  abstract get(key: string): Promise<string | null>;

  abstract set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void>;

  abstract setNx(key: string, value: string, pxMs: number): Promise<string | null>;

  abstract incr(key: string): Promise<number>;

  abstract expire(key: string, seconds: number): Promise<void>;

  abstract ttl(key: string): Promise<number>;

  abstract del(key: string): Promise<void>;

  abstract pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]>;

  abstract ping(): Promise<boolean>;

  abstract disconnect(): Promise<void>;
}
