/**
 * Cache Service Module
 *
 * Provides a clean interface for cache operations with support for multiple providers:
 * - Redis - for high-performance caching (default)
 * - PostgreSQL - for unified database stack with UNLOGGED tables
 *
 * Usage:
 * ```typescript
 * import { cacheService } from '@/backend/services/cache';
 *
 * await cacheService.set('key', 'value', { ex: 60 });
 * const value = await cacheService.get('key');
 * ```
 */

export * from "./ApolloCacheAdapter";
export * from "./CacheServiceFactory";
export * from "./EntityCacheService";
export type { CacheProvider, ICacheService } from "./ICacheService";
export * from "./PostgresCacheAdapter";
export * from "./RedisCacheAdapter";
