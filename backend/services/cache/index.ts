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

export { ApolloCacheAdapter } from "@/backend/services/cache/ApolloCacheAdapter";
export { cacheService } from "@/backend/services/cache/CacheServiceFactory";
export type { CacheProvider, ICacheService } from "@/backend/services/cache/ICacheService";
export { PostgresCacheAdapter } from "@/backend/services/cache/PostgresCacheAdapter";
export { RedisCacheAdapter } from "@/backend/services/cache/RedisCacheAdapter";
