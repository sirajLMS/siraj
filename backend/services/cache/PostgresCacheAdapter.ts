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
  async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    try {
      // Default to no expiry if no TTL is provided — callers must be explicit
      const ttlSeconds = options?.ex ? options.ex : options?.px ? options.px / 1000 : 0;
      // No expiry: far-future date (year 2100) so the entry never expires via TTL cleanup
      const expiresAt = ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : new Date("2100-01-01T00:00:00Z");

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
  async pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]> {
    try {
      return await db.transaction(async () => {
        const results: unknown[] = [];

        for (const cmd of commands) {
          results.push(await this.executePipelineCommand(cmd));
        }

        return results;
      });
    } catch (error) {
      logger.error("Postgres cache pipeline error:", error);
      throw error;
    }
  }

  /**
   * Execute a single command within a pipeline
   */
  private async executePipelineCommand(cmd: { command: string; args: (string | number)[] }): Promise<unknown> {
    switch (cmd.command) {
      case "zremrangebyscore":
        // For rate limiting: remove old entries
        // This is a no-op for PostgreSQL cache as we handle expiration differently
        return 0;

      case "zadd": {
        // For rate limiting: add new entry using server-side timestamp
        const [key, , member] = cmd.args as [string, number, string];
        const now = Date.now();
        const expiresAt = new Date(now + 3600000); // 1 hour from now
        await CacheDbRepository.set(key, member, expiresAt);
        return 1;
      }

      case "zcard": {
        // For rate limiting: count entries
        const entry = await CacheDbRepository.get(cmd.args[0] as string);
        return entry ? 1 : 0;
      }

      case "expire": {
        // Set expiration
        const [expKey, expSeconds] = cmd.args as [string, number];
        await this.expire(expKey, expSeconds);
        return 1;
      }

      default:
        logger.warn(`Unsupported pipeline command: ${cmd.command}`);
        return null;
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
      5 * 60 * 1000
    );
  }
}
