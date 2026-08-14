/**
 * Redis Service Module
 *
 * Provides a clean interface for Redis operations with support for multiple providers:
 * - Local Redis (ioredis) - for development and self-hosted
 * - Upstash Redis - for serverless production deployments
 *
 * Usage:
 * ```typescript
 * import { redisService } from '@/backend/services/redis';
 *
 * await redisService.set('key', 'value', { ex: 60 });
 * const value = await redisService.get('key');
 * ```
 */

export * from "./IRedisService";
export * from "./LocalRedisAdapter";
export * from "./RedisServiceFactory";
export * from "./SessionRedisService";
export * from "./UpstashRedisAdapter";
