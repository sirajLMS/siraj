import { eq, lt } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { cache } from "@/backend/db/schema/cache";
import logger from "@/backend/lib/logger";

export namespace CacheDbRepository {
  /**
   * Get cache entry by key
   */
  export const get = async (key: string): Promise<{ value: string; expiresAt: Date } | null> => {
    try {
      const result = await db.select().from(cache).where(eq(cache.key, key)).limit(1);

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
      logger.error("Failed to get cache entry:", error);
      return null;
    }
  };

  /**
   * Set cache entry with expiration
   */
  export const set = async (key: string, value: string, expiresAt: Date): Promise<void> => {
    try {
      await db
        .insert(cache)
        .values({
          key,
          value,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: cache.key,
          set: {
            value,
            expiresAt,
          },
        });
    } catch (error) {
      logger.error("Failed to set cache entry:", error);
      throw error;
    }
  };

  /**
   * Increment cache value and return new count
   */
  export const incr = async (key: string): Promise<number> => {
    try {
      // First, try to get existing value
      const existing = await get(key);

      if (!existing) {
        // Create new entry with value 1
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Default 1 hour
        await set(key, "1", expiresAt);
        return 1;
      }

      // Increment existing value
      const newValue = (Number.parseInt(existing.value, 10) || 0) + 1;
      await set(key, newValue.toString(), existing.expiresAt);
      return newValue;
    } catch (error) {
      logger.error("Failed to increment cache value:", error);
      throw error;
    }
  };

  /**
   * Delete cache entry
   */
  export const del = async (key: string): Promise<boolean> => {
    try {
      await db.delete(cache).where(eq(cache.key, key));
      return true;
    } catch (error) {
      logger.error("Failed to delete cache entry:", error);
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
      logger.error("Failed to get TTL:", error);
      return -1;
    }
  };

  /**
   * Delete expired entries
   */
  export const deleteExpired = async (): Promise<number> => {
    try {
      const now = new Date();
      const result = await db.delete(cache).where(lt(cache.expiresAt, now)).returning();

      const deletedCount = result.length;
      if (deletedCount > 0) {
        logger.log(`Cleaned up ${deletedCount} expired cache entries`);
      }

      return deletedCount;
    } catch (error) {
      logger.error("Failed to delete expired cache entries:", error);
      return 0;
    }
  };

  /**
   * Check if cache table is accessible (ping equivalent)
   */
  export const ping = async (): Promise<boolean> => {
    try {
      await db.select().from(cache).limit(1);
      return true;
    } catch (error) {
      logger.error("Cache ping failed:", error);
      return false;
    }
  };
}
