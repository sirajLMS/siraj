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

export { ApolloCacheAdapter } from "./ApolloCacheAdapter";
export { cacheService } from "./CacheServiceFactory";
export type { CacheProvider, ICacheService } from "./ICacheService";
export { PostgresCacheAdapter } from "./PostgresCacheAdapter";
export { RedisCacheAdapter } from "./RedisCacheAdapter";
