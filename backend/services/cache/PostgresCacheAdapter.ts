import { db } from "@/backend/db/drizzleDb";
import { CacheDbRepository } from "@/backend/db/repo/cache.repository";
import logger from "@/backend/lib/logger";
import type { ICacheService } from "./ICacheService";

/**
 * PostgreSQL Cache Adapter
 * Implements ICacheService using PostgreSQL with UNLOGGED tables
 * Uses Drizzle ORM for database operations
 */
export class PostgresCacheAdapter implements ICacheService {
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor() {
		// Start periodic cleanup of expired entries
		this.startCleanup();
	}

	/**
	 * Get a value from cache
	 */
	async get(key: string): Promise<string | null> {
		try {
			const entry = await CacheDbRepository.get(key);
			return entry?.value || null;
		} catch (error) {
			logger.error("Postgres cache get error:", error);
			return null;
		}
	}

	/**
	 * Set a value in cache
	 */
	async set(
		key: string,
		value: string,
		options?: { ex?: number; px?: number },
	): Promise<void> {
		try {
			const ttlSeconds =
				options?.ex || options?.px
					? options.ex || (options.px ?? 0) / 1000
					: 3600; // Default 1 hour
			const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

			await CacheDbRepository.set(key, value, expiresAt);
		} catch (error) {
			logger.error("Postgres cache set error:", error);
			throw error;
		}
	}

	/**
	 * Increment a value in cache
	 */
	async incr(key: string): Promise<number> {
		try {
			return await CacheDbRepository.incr(key);
		} catch (error) {
			logger.error("Postgres cache incr error:", error);
			throw error;
		}
	}

	/**
	 * Set expiration time on a key
	 */
	async expire(key: string, seconds: number): Promise<void> {
		try {
			const entry = await CacheDbRepository.get(key);
			if (!entry) {
				return; // Key doesn't exist
			}

			const expiresAt = new Date(Date.now() + seconds * 1000);
			await CacheDbRepository.set(key, entry.value, expiresAt);
		} catch (error) {
			logger.error("Postgres cache expire error:", error);
			throw error;
		}
	}

	/**
	 * Get time to live for a key
	 */
	async ttl(key: string): Promise<number> {
		try {
			return await CacheDbRepository.ttl(key);
		} catch (error) {
			logger.error("Postgres cache ttl error:", error);
			return -1;
		}
	}

	/**
	 * Delete a key
	 */
	async del(key: string): Promise<void> {
		try {
			await CacheDbRepository.del(key);
		} catch (error) {
			logger.error("Postgres cache del error:", error);
			throw error;
		}
	}

	/**
	 * Execute a pipeline of commands (for atomic operations)
	 * Uses database transactions for atomicity
	 */
	async pipeline(
		commands: Array<{ command: string; args: (string | number)[] }>,
	): Promise<unknown[]> {
		try {
			return await db.transaction(async () => {
				const results: unknown[] = [];

				for (const cmd of commands) {
					switch (cmd.command) {
						case "zremrangebyscore":
							// For rate limiting: remove old entries
							// This is a no-op for PostgreSQL cache as we handle expiration differently
							results.push(0);
							break;

						case "zadd": {
							// For rate limiting: add new entry
							const [key, score, member] = cmd.args as [string, number, string];
							const expiresAt = new Date(score + 3600000); // 1 hour from score
							await CacheDbRepository.set(key, member, expiresAt);
							results.push(1);
							break;
						}

						case "zcard": {
							// For rate limiting: count entries
							const entry = await CacheDbRepository.get(cmd.args[0] as string);
							results.push(entry ? 1 : 0);
							break;
						}

						case "expire": {
							// Set expiration
							const [expKey, expSeconds] = cmd.args as [string, number];
							await this.expire(expKey, expSeconds);
							results.push(1);
							break;
						}

						default:
							logger.warn(`Unsupported pipeline command: ${cmd.command}`);
							results.push(null);
					}
				}

				return results;
			});
		} catch (error) {
			logger.error("Postgres cache pipeline error:", error);
			throw error;
		}
	}

	/**
	 * Check if cache connection is healthy
	 */
	async ping(): Promise<boolean> {
		try {
			return await CacheDbRepository.ping();
		} catch (error) {
			logger.error("Postgres cache ping error:", error);
			return false;
		}
	}

	/**
	 * Close the connection
	 */
	disconnect(): Promise<void> {
		try {
			if (this.cleanupInterval) {
				clearInterval(this.cleanupInterval);
				this.cleanupInterval = null;
			}
			logger.log("Postgres cache adapter disconnected");
			return Promise.resolve();
		} catch (error) {
			logger.error("Postgres cache disconnect error:", error);
			return Promise.resolve();
		}
	}

	/**
	 * Start periodic cleanup of expired entries
	 */
	private startCleanup(): void {
		// Run cleanup every 5 minutes
		this.cleanupInterval = setInterval(
			() => {
				CacheDbRepository.deleteExpired().catch((error: unknown) => {
					logger.error("Cache cleanup error:", error);
				});
			},
			5 * 60 * 1000,
		);
	}
}
