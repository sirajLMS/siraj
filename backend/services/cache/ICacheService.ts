import type { ICacheServiceBase } from "@/backend/types";

/**
 * Cache Service Interface
 * Defines the contract that all cache adapters must implement
 * Matches Redis operations used in rate limiting
 */
export type ICacheService = ICacheServiceBase;

/**
 * Cache Provider Types
 */
export type CacheProvider = "redis" | "postgres";
