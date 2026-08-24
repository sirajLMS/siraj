import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { rateLimitCache, sessionCache } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import { escapeLikeWildcards } from "@/backend/utils";

export namespace CacheDbRepository {
  /**
   * Determine which table to use based on key prefix
   * Rate limiting keys go to UNLOGGED table
   */
  const getTable = (key: string) => {
    if (key.startsWith("ec:") || key.startsWith("tag:")) {
      return sessionCache;
    }
    if (key.startsWith("ratelimit:") || key.startsWith("auth:")) {
      return rateLimitCache;
    }
    return sessionCache;
  };

  /**
   * Get cache entry by key
   */
  export const get = async (key: string): Promise<{ value: string; expiresAt: Date } | null> => {
    try {
      const table = getTable(key);
      const q = queryDb();
      const now = new Date();
      const result = await q
        .select()
        .from(table)
        .where(and(eq(table.key, key), gte(table.expiresAt, now)))
        .limit(1);

      if (result.length === 0 || !result[0]) {
        return null;
      }

      const entry = result[0];

      return {
        value: entry.value,
        expiresAt: entry.expiresAt,
      };
    } catch (error) {
      logger.error("Failed to get cache entry", { error });
      return null;
    }
  };

  /**
   * Set cache entry with expiration
   */
  export const set = async (key: string, value: string, expiresAt: Date): Promise<void> => {
    try {
      const table = getTable(key);
      await db
        .insert(table)
        .values({
          key,
          value,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: table.key,
          set: {
            value,
            expiresAt,
          },
        });
    } catch (error) {
      logger.error(`Failed to set cache entry for key ${key}:`, error);
      throw error;
    }
  };

  /**
   * Update expiration for a specific key
   */
  export const setExpiry = async (key: string, expiresAt: Date): Promise<number> => {
    try {
      const table = getTable(key);
      const result = await db.update(table).set({ expiresAt }).where(eq(table.key, key)).returning({ key: table.key });
      return result.length;
    } catch (error) {
      logger.error(`Failed to set expiry for key ${key}:`, error);
      throw error;
    }
  };

  /**
   * Increment cache value and return new count
   */
  export const incr = async (key: string): Promise<number> => {
    try {
      const table = getTable(key);
      const now = new Date();
      const defaultExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);

      const inserted = await db
        .insert(table)
        .values({ key, value: "1", expiresAt: defaultExpiresAt })
        .onConflictDoUpdate({
          target: table.key,
          set: {
            value: sql`CAST((CAST(${table.value} AS INTEGER) + 1) AS TEXT)`,
            expiresAt: sql`EXCLUDED.expires_at`,
          },
        })
        .returning({ value: table.value });

      return Number.parseInt(inserted[0]?.value ?? "1", 10);
    } catch (error) {
      logger.error(`Failed to increment cache value for key ${key}:`, error);
      throw error;
    }
  };

  /**
   * Update expiration for all entries matching a key prefix
   * Used by PostgresCacheAdapter.expire in pipeline context
   */
  export const updateExpiryByPrefix = async (prefix: string, seconds: number): Promise<number> => {
    try {
      const table = getTable(prefix);
      const newExpiresAt = new Date(Date.now() + seconds * 1000);
      const result = await db
        .update(table)
        .set({ expiresAt: newExpiresAt })
        .where(sql`${table.key} LIKE ${escapeLikeWildcards(prefix) + "%"}`)
        .returning({ key: table.key });
      return result.length;
    } catch (error) {
      logger.error(`Failed to update expiry for prefix ${prefix}:`, error);
      throw error;
    }
  };

  /**
   * Delete cache entries by key prefix whose value (timestamp) is <= maxScore
   * Used by PostgresCacheAdapter.zremrangebyscore to purge stale rate-limit entries
   */
  export const deleteByPrefixAndScore = async (prefix: string, maxScore: number): Promise<number> => {
    try {
      const table = getTable(prefix);
      const now = new Date();
      const result = await db
        .delete(table)
        .where(
          and(
            sql`${table.key} LIKE ${escapeLikeWildcards(prefix) + "%"}`,
            sql`${table.value}::bigint <= ${BigInt(maxScore)}`,
            gte(table.expiresAt, now)
          )
        )
        .returning();
      return result.length;
    } catch (error) {
      logger.error(`Failed to delete cache entries for prefix ${prefix}:`, error);
      throw error;
    }
  };

  /**
   * Count cache entries by key prefix
   * Used by PostgresCacheAdapter.zcard to count rate-limit entries
   * Only counts non-expired entries
   */
  // NOTE: For optimal performance of LIKE 'prefix%' queries on this column,
  // consider adding an index: CREATE INDEX idx_session_cache_key_pattern ON session_cache (key varchar_pattern_ops);
  export const countByKeyPrefix = async (prefix: string): Promise<number> => {
    try {
      const table = getTable(prefix);
      const now = new Date();
      const q = queryDb();
      const result = await q
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(table)
        .where(sql`${table.key} LIKE ${escapeLikeWildcards(prefix) + "%"} AND ${table.expiresAt} > ${now}`);

      return result[0]?.count ?? 0;
    } catch (error) {
      logger.error(`Failed to count cache entries for prefix ${prefix}:`, error);
      throw error;
    }
  };

  /**
   * Delete cache entry
   */
  export const del = async (key: string): Promise<boolean> => {
    try {
      const table = getTable(key);
      await db.delete(table).where(eq(table.key, key));
      return true;
    } catch (error) {
      logger.error(`Failed to delete cache entry for key ${key}:`, error);
      return false;
    }
  };

  /**
   * Insert a cache entry only if the key does not already exist, OR if the
   * existing entry has expired (overwrites expired rows). This prevents
   * rate-limit and auth keys from being stuck when using the Postgres cache
   * fallback — `onConflictDoNothing` would permanently block re-inserting
   * an expired key, but `onConflictDoUpdate` with a `setWhere` guard only
   * overwrites when `expires_at < now()`.
   */
  export const insertIfNotExists = async (key: string, value: string, expiresAt: Date): Promise<boolean> => {
    try {
      const table = getTable(key);
      const result = await db
        .insert(table)
        .values({ key, value, expiresAt })
        .onConflictDoUpdate({
          target: table.key,
          set: {
            value,
            expiresAt,
          },
          setWhere: and(eq(table.key, key), lt(table.expiresAt, sql`now()`)),
        })
        .returning();

      return result.length > 0;
    } catch (error) {
      logger.error(`Failed to insert cache entry for key ${key}:`, error);
      return false;
    }
  };

  /**
   * Get time to live for a key in seconds
   */
  export const ttl = async (key: string): Promise<number> => {
    try {
      const entry = await get(key);
      if (!entry) {
        return -1; // Key doesn't exist
      }

      const now = new Date();
      const diffMs = entry.expiresAt.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / 1000));
    } catch (error) {
      logger.error(`Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  };

  /**
   * Delete expired entries from both tables
   */
  export const deleteExpired = async (): Promise<number> => {
    try {
      const now = new Date();

      const [rateLimitResult, sessionResult] = await Promise.all([
        db.delete(rateLimitCache).where(lt(rateLimitCache.expiresAt, now)).returning(),
        db.delete(sessionCache).where(lt(sessionCache.expiresAt, now)).returning(),
      ]);

      const deletedCount = rateLimitResult.length + sessionResult.length;
      if (deletedCount > 0) {
        logger.log(
          `Cleaned up ${deletedCount} expired cache entries (${rateLimitResult.length} rate limit, ${sessionResult.length} session)`
        );
      }

      return deletedCount;
    } catch (error) {
      logger.error("Failed to delete expired cache entries:", error);
      return 0;
    }
  };

  /**
   * Check if cache tables are accessible
   */
  export const ping = async (): Promise<boolean> => {
    try {
      const q = queryDb();
      await Promise.all([q.select().from(rateLimitCache).limit(1), q.select().from(sessionCache).limit(1)]);
      return true;
    } catch (error) {
      logger.error("Cache ping failed:", error);
      return false;
    }
  };
}
