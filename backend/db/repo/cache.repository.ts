import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { rateLimitCache, sessionCache } from "@/backend/db/schema/cache";
import logger from "@/backend/lib/logger";

export namespace CacheDbRepository {
  /**
   * Determine which table to use based on key prefix
   * Rate limiting keys go to UNLOGGED table
   */
  const getTable = (key: string) => {
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
      const result = await db.select().from(table).where(eq(table.key, key)).limit(1);

      if (result.length === 0 || !result[0]) {
        return null;
      }

      const entry = result[0];

      // Check if expired
      if (entry.expiresAt < new Date()) {
        // Delete expired entry
        await del(key);
        return null;
      }

      return {
        value: entry.value,
        expiresAt: entry.expiresAt,
      };
    } catch (error) {
      logger.error(`Failed to get cache entry for key ${key}:`, error);
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
   * Increment cache value and return new count
   */
  export const incr = async (key: string): Promise<number> => {
    try {
      const table = getTable(key);
      const now = new Date();
      const defaultExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);

      const updated = await db
        .update(table)
        .set({ value: sql`(${table.value}::int + 1)::text` })
        .where(and(eq(table.key, key), gt(table.expiresAt, now)))
        .returning({ value: table.value });

      if (updated.length > 0) {
        return Number.parseInt(updated[0].value, 10);
      }

      const inserted = await db
        .insert(table)
        .values({ key, value: "1", expiresAt: defaultExpiresAt })
        .onConflictDoUpdate({
          target: table.key,
          set: { value: sql`(${table.value}::int + 1)::text`, expiresAt: defaultExpiresAt },
        })
        .returning();

      return Number.parseInt(inserted[0]?.value ?? "1", 10);
    } catch (error) {
      logger.error(`Failed to increment cache value for key ${key}:`, error);
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

  export const insertIfNotExists = async (key: string, value: string, expiresAt: Date): Promise<boolean> => {
    try {
      const table = getTable(key);
      const result = await db
        .insert(table)
        .values({ key, value, expiresAt })
        .onConflictDoNothing({ target: table.key })
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
      await Promise.all([db.select().from(rateLimitCache).limit(1), db.select().from(sessionCache).limit(1)]);
      return true;
    } catch (error) {
      logger.error("Cache ping failed:", error);
      return false;
    }
  };
}
