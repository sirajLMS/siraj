import { sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { CacheDbRepository } from "@/backend/db/repo/shared/cache.repository";
import { sessionCache } from "@/backend/db/schema/shared/cache";
import { logger } from "@/backend/lib/logger";
import { CacheAdapterBase } from "@/backend/services/cache/__shared__/CacheAdapterBase";

/**
 * PostgreSQL Cache Adapter
 * Implements ICacheService using PostgreSQL with UNLOGGED tables
 * Uses Drizzle ORM for database operations
 */

interface CacheSetOptions {
  ex?: number;
  px?: number;
}

const DEFAULT_CACHE_TTL_SECONDS = 3600;

function resolveTtlSeconds(options?: CacheSetOptions): number {
  if (options?.ex) {
    return options.ex;
  }
  if (options?.px) {
    return options.px / 1000;
  }
  return DEFAULT_CACHE_TTL_SECONDS;
}

export class PostgresCacheAdapter extends CacheAdapterBase {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Start periodic cleanup of expired entries
    this.startCleanup();
  }

  /**
   * Get a value from cache
   */
  override async get(key: string): Promise<string | null> {
    try {
      const entry = await CacheDbRepository.get(key);
      if (!entry) {
        return null;
      }
      return entry.value;
    } catch (error) {
      logger.error("Postgres cache get error:", error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  override async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    try {
      const ttlSeconds = resolveTtlSeconds(options);
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await CacheDbRepository.set(key, value, expiresAt);
    } catch (error) {
      logger.error("Postgres cache set error:", error);
      throw error;
    }
  }

  /**
   * Atomically set a value only if the key does NOT exist, with a TTL in ms.
   * Returns `"OK"` if the key was inserted (first caller), `null` if it
   * already existed.
   */
  override async setNx(key: string, value: string, pxMs: number): Promise<string | null> {
    try {
      const expiresAt = new Date(Date.now() + pxMs);
      const inserted = await CacheDbRepository.insertIfNotExists(key, value, expiresAt);
      return inserted ? "OK" : null;
    } catch (error) {
      logger.error("Postgres cache setNx error:", error);
      return null;
    }
  }

  /**
   * Increment a value in cache
   */
  override async incr(key: string): Promise<number> {
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
  override async expire(key: string, seconds: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + seconds * 1000);
      await CacheDbRepository.setExpiry(key, expiresAt);
    } catch (error) {
      logger.error("Postgres cache expire error:", error);
      throw error;
    }
  }

  /**
   * Get time to live for a key
   */
  override async ttl(key: string): Promise<number> {
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
  override async del(key: string): Promise<void> {
    try {
      await CacheDbRepository.del(key);
    } catch (error) {
      logger.error("Postgres cache del error:", error);
      throw error;
    }
  }

  /**
   * Execute a pipeline of commands (for atomic operations)
   * Uses database transactions for atomicity when needed.
   * For del-only pipelines, skips the transaction to avoid deadlocks between
   * the transaction connection and the global db connection used by CacheDbRepository.
   */
  override async pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]> {
    try {
      // del and set(NX) commands use CacheDbRepository which uses the global db
      // connection — skip transaction to avoid deadlocks
      const isDelOrSetOnly = commands.every(cmd => cmd.command === "del" || cmd.command === "set");
      if (isDelOrSetOnly) {
        const results = await Promise.all(commands.map(cmd => this.executePipelineCommand(cmd)));
        return results;
      }

      return await db.transaction(async () => {
        const results = await Promise.all(commands.map(cmd => this.executePipelineCommand(cmd)));
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
      // PERF: These 4 pipeline commands (zremrangebyscore + zadd + zcard + expire) could be combined
      // into a single SQL CTE for the rate-limit pattern. Current implementation issues 4 separate queries.
      case "del": {
        const keys = cmd.args.map(arg => String(arg));
        await Promise.all(keys.map(key => CacheDbRepository.del(key)));
        return keys.length;
      }

      case "set": {
        const setKey = String(cmd.args[0]);
        const setValue = String(cmd.args[1]);
        const ttlSeconds = Number(cmd.args[3]);
        const flag = typeof cmd.args[4] === "string" ? cmd.args[4] : undefined;
        if (flag === "NX") {
          const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
          return await CacheDbRepository.insertIfNotExists(setKey, setValue, expiresAt);
        }
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        await CacheDbRepository.set(setKey, setValue, expiresAt);
        return "OK";
      }

      case "zremrangebyscore": {
        // For rate limiting: remove old entries outside the sliding window
        // Redis: ZREMRANGEBYSCORE key min max — removes members with score between min and max
        // PostgreSQL: delete entries with key prefix match and value (timestamp) <= maxScore
        const remKey = String(cmd.args[0]);
        const maxScore = Number(cmd.args[2]);
        await CacheDbRepository.deleteByPrefixAndScore(remKey, maxScore);
        return 0;
      }

      case "zadd": {
        // For rate limiting: add new entry using server-side timestamp
        // Use composite key (key:member) so multiple entries accumulate per rate-limit key
        const key = String(cmd.args[0]);
        const member = String(cmd.args[2]);
        const compositeKey = `${key}:${member}`;
        const now = Date.now();
        // Initial TTL is generous; the pipeline's "expire" command immediately
        // updates all prefix-matching entries to the actual rate-limit window.
        const expiresAt = new Date(now + 3600000);
        await CacheDbRepository.set(compositeKey, String(now), expiresAt);
        return 1;
      }

      case "zcard": {
        // For rate limiting: count entries matching the key prefix
        // Each zadd stores with composite key "{key}:{member}", so we count "{key}:%"
        const prefix = String(cmd.args[0]);
        return await CacheDbRepository.countByKeyPrefix(prefix);
      }

      case "expire": {
        // Set expiration on all entries matching the key prefix
        // Since zadd uses composite keys, we update TTL for all "{key}:%" entries
        const expKey = String(cmd.args[0]);
        const expSeconds = Number(cmd.args[1]);
        await CacheDbRepository.updateExpiryByPrefix(expKey, expSeconds);
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
  override async ping(): Promise<boolean> {
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
  override disconnect(): Promise<void> {
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

  /** Provider name for cache stats. */
  protected getProviderName(): string {
    return "postgres";
  }

  /** Query the total number of entries in the session_cache table. */
  protected async getCacheSize(): Promise<number> {
    const q = queryDb();
    const res = await q.select({ count: sql<number>`count(*)::int` }).from(sessionCache);
    return res[0]?.count ?? 0;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Run cleanup every 60 seconds to match the shortest expected TTL
    // (rate-limit windows can be as short as 60s)
    this.cleanupInterval = setInterval(() => {
      CacheDbRepository.deleteExpired().catch((error: unknown) => {
        logger.error("Cache cleanup error:", error);
      });
    }, 60 * 1000);
  }
}
