import type { ICacheServiceBase } from "../shared/CacheInterface";

/**
 * Redis Service Interface
 * Defines the contract that all Redis adapters must implement
 */
export type IRedisService = ICacheServiceBase;

/**
 * Redis Provider Types
 */
export type RedisProvider = "local" | "upstash";
