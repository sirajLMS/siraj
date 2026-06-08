import logger from "@/backend/lib/logger";
import type { CacheProvider, ICacheService } from "./ICacheService";
import { PostgresCacheAdapter } from "./PostgresCacheAdapter";

// Module-level state replaces the static class properties
let instance: ICacheService | null = null;
let initializationPromise: Promise<ICacheService> | null = null;

/**
 * Get cache provider from environment variable
 */
function getCacheProvider(): CacheProvider {
	const rawProvider = process.env.CACHE_PROVIDER as string | undefined;
	const provider = (rawProvider || "redis").toLowerCase();

	if (provider !== "redis" && provider !== "postgres") {
		logger.warn(
			`⚠️  Invalid CACHE_PROVIDER: ${provider}. Must be 'redis' or 'postgres'. Using 'redis'.`,
		);
		return "redis";
	}

	return provider;
}

/**
 * Create PostgreSQL cache adapter
 */
function createPostgresCache(): ICacheService {
	logger.log("Connecting to PostgreSQL cache (UNLOGGED table)");
	return new PostgresCacheAdapter();
}

/**
 * Create Redis cache adapter (lazy import to avoid loading Redis when using PostgreSQL)
 */
async function createRedisCache(): Promise<ICacheService> {
	logger.log("Connecting to Redis cache");
	// Use dynamic import to avoid importing Redis module when using PostgreSQL
	const { RedisCacheAdapter } = await import("./RedisCacheAdapter");
	return new RedisCacheAdapter();
}

/**
 * Create cache service based on provider type
 */
async function createCacheService(): Promise<ICacheService> {
	const provider = getCacheProvider();

	logger.log(`🔧 Initializing Cache with provider: ${provider}`);

	switch (provider) {
		case "postgres":
			return createPostgresCache();

		case "redis":
			return await createRedisCache();

		default:
			logger.warn(`Unknown cache provider: ${provider}, falling back to redis`);
			return await createRedisCache();
	}
}

/**
 * Get cache service instance (singleton)
 */
export const getCacheService = async (): Promise<ICacheService> => {
	// If already fully initialized, return the instance immediately
	if (instance) {
		return instance;
	}

	// Cache the initialization promise to prevent race conditions
	// causing multiple connections during startup
	if (!initializationPromise) {
		initializationPromise = (async () => {
			try {
				const service = await createCacheService();
				instance = service;
				return instance;
			} catch (error) {
				initializationPromise = null;
				logger.error("Failed to initialize cache service", error);
				throw error;
			}
		})();
	}

	return initializationPromise;
};

/**
 * Reset instance (useful for testing)
 */
export const resetCacheService = (): void => {
	if (instance) {
		void instance.disconnect();
		instance = null;
	}
	initializationPromise = null;
};

/**
 * Health check for cache connection
 */
export const checkCacheHealth = async (): Promise<boolean> => {
	try {
		const cache = await getCacheService();
		return await cache.ping();
	} catch (error) {
		logger.error("Cache health check failed:", error);
		return false;
	}
};

/**
 * Export singleton cache service instance
 * This provides a direct instance for synchronous usage where methods
 * will automatically wait for the underlying service to initialize.
 */
export const cacheService = {
	get: async (key: string) => {
		const service = await getCacheService();
		return service.get(key);
	},
	set: async (
		key: string,
		value: string,
		options?: { ex?: number; px?: number },
	) => {
		const service = await getCacheService();
		return service.set(key, value, options);
	},
	del: async (key: string) => {
		const service = await getCacheService();
		return service.del(key);
	},
	expire: async (key: string, seconds: number) => {
		const service = await getCacheService();
		return service.expire(key, seconds);
	},
	ttl: async (key: string) => {
		const service = await getCacheService();
		return service.ttl(key);
	},
	incr: async (key: string) => {
		const service = await getCacheService();
		return service.incr(key);
	},
	pipeline: async (
		commands: Array<{ command: string; args: (string | number)[] }>,
	) => {
		const service = await getCacheService();
		return service.pipeline(commands);
	},
	ping: async () => {
		const service = await getCacheService();
		return service.ping();
	},
	disconnect: async () => {
		const service = await getCacheService();
		return service.disconnect();
	},
};
