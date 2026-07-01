import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { signedUrls } from "@/backend/db/schema/storage";
import logger from "@/backend/lib/logger";

export type SignedUrlEntity = typeof signedUrls.$inferSelect;
export type SignedUrlEntityInput = typeof signedUrls.$inferInsert;

export namespace SignedUrlRepository {
  /**
   * Create a new signed URL entry in the database
   */
  export const createSignedUrl = async (data: SignedUrlEntityInput): Promise<SignedUrlEntity> => {
    const [result] = await db.insert(signedUrls).values(data).returning();
    logger.info(`Created signed URL: ${result.id} for path: ${result.filePath}`);
    return result;
  };

  /**
   * Get a signed URL by its token ID
   * // NOTE: Authorization should be checked by the calling service before using this method
   */
  export const getSignedUrlById = async (id: string): Promise<SignedUrlEntity | null> => {
    const result = await db.select().from(signedUrls).where(eq(signedUrls.id, id)).limit(1);
    return result[0] || null;
  };

  /**
   * Atomically claim a signed URL token
   * Uses row-level locking to prevent race conditions
   * Returns the signed URL entity if successfully claimed, or null if invalid/used/expired
   */
  export const claimSignedUrl = async (id: string): Promise<SignedUrlEntity | null> => {
    try {
      const now = new Date();

      // Use a transaction with row-level locking
      const result = await db.transaction(async tx => {
        // SELECT FOR UPDATE SKIP LOCKED - atomic claim
        const [token] = await tx
          .select()
          .from(signedUrls)
          .where(
            and(
              eq(signedUrls.id, id),
              eq(signedUrls.used, false),
              gt(signedUrls.expiresAt, now) // expiresAt is greater than now (not expired)
            )
          )
          .for("update", { skipLocked: true })
          .limit(1);

        if (token.expiresAt <= now) {
          return null;
        }

        // Mark as used
        const [updated] = await tx.update(signedUrls).set({ used: true }).where(eq(signedUrls.id, id)).returning();

        logger.info(`Claimed signed URL: ${id} for path: ${updated.filePath}`);
        return updated;
      });

      return result;
    } catch (error) {
      logger.error(`Error claiming signed URL ${id}:`, error);
      return null;
    }
  };

  /**
   * Delete all expired signed URL tokens
   * Returns the number of deleted records
   */
  export const deleteExpired = async (): Promise<number> => {
    try {
      const now = new Date();
      const deleted = await db.delete(signedUrls).where(lt(signedUrls.expiresAt, now)).returning();

      const count = deleted.length;
      if (count > 0) {
        logger.info(`Deleted ${count} expired signed URLs`);
      }
      return count;
    } catch (error) {
      logger.error("Error deleting expired signed URLs:", error);
      return 0;
    }
  };
}
