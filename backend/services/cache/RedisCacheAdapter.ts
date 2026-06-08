import { getRedisService } from "@/backend/services/redis";
import type { ICacheService } from "./ICacheService";

/**
 * Redis Cache Adapter
 * Wrapper around existing IRedisService to match ICacheService interface
 * Simply delegates to redisService singleton
 */
export class RedisCacheAdapter implements ICacheService {
	private get redisService() {
		return getRedisService();
	}

	/**
	 * Get a value from cache
	 */
	async get(key: string): Promise<string | null> {
		return await this.redisService.get(key);
	}

	/**
	 * Set a value in cache
	 */
	async set(
		key: string,
		value: string,
		options?: { ex?: number; px?: number },
	): Promise<void> {
		await this.redisService.set(key, value, options);
	}

	/**
	 * Increment a value in cache
	 */
	async incr(key: string): Promise<number> {
		return await this.redisService.incr(key);
	}

	/**
	 * Set expiration time on a key
	 */
	async expire(key: string, seconds: number): Promise<void> {
		await this.redisService.expire(key, seconds);
	}

	/**
	 * Get time to live for a key
	 */
	async ttl(key: string): Promise<number> {
		return await this.redisService.ttl(key);
	}

	/**
	 * Delete a key
	 */
	async del(key: string): Promise<void> {
		await this.redisService.del(key);
	}

	/**
	 * Execute a pipeline of commands (for atomic operations)
	 */
	async pipeline(
		commands: Array<{ command: string; args: (string | number)[] }>,
	): Promise<unknown[]> {
		return await this.redisService.pipeline(commands);
	}

	/**
	 * Check if cache connection is healthy
	 */
	async ping(): Promise<boolean> {
		return await this.redisService.ping();
	}

	/**
	 * Close the connection
	 */
	async disconnect(): Promise<void> {
		await this.redisService.disconnect();
	}
}
