import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { db, withForUpdate } from "@/backend/db";
import { signedUrls } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type { DBTransaction, SignedUrlInsertType, SignedUrlSelectType } from "@/backend/types";

// ============================================================================
// Prepared Statements (Drizzle Prepared Statements 2.0)
// ============================================================================

const findSignedUrlByIdPrepared = db
  .select()
  .from(signedUrls)
  .where(eq(signedUrls.id, sql.placeholder("id")))
  .limit(1)
  .prepare("find_signed_url_by_id");

export namespace SignedUrlRepository {
  /**
   * Create a new signed URL entry in the database
   */
  export const createSignedUrl = async (data: SignedUrlInsertType): Promise<SignedUrlSelectType> => {
    const [result] = await db.insert(signedUrls).values(data).returning();
    logger.info(`Created signed URL: ${result.id} for path: ${result.filePath}`);
    return result;
  };

  /**
   * Get a signed URL by its token ID
   * // NOTE: Authorization should be checked by the calling service before using this method
   */
  export const getSignedUrlById = async (id: string): Promise<SignedUrlSelectType | null> => {
    const result = await findSignedUrlByIdPrepared.execute({ id });
    return result[0] || null;
  };

  /**
   * Latest signed URL for a stored file path. Used to attribute an uploaded
   * file to its uploader (upload provenance) when validating that the actor
   * referencing a file id is the one who uploaded it.
   */
  export const getLatestByFilePath = async (
    filePath: string,
    tx?: DBTransaction
  ): Promise<SignedUrlSelectType | null> => {
    const q = tx ?? db;
    const [row] = await q
      .select()
      .from(signedUrls)
      .where(eq(signedUrls.filePath, filePath))
      .orderBy(desc(signedUrls.createdAt))
      .limit(1);
    return row ?? null;
  };

  /**
   * Atomically claim a signed URL token
   * Uses row-level locking to prevent race conditions
   * Returns the signed URL entity if successfully claimed, or null if invalid/used/expired
   */
  export const claimSignedUrl = async (id: string): Promise<SignedUrlSelectType | null> => {
    try {
      const now = new Date();

      // Use a transaction with row-level locking
      const result = await db.transaction(async tx => {
        // SELECT FOR UPDATE SKIP LOCKED - atomic claim
        const [token] = await withForUpdate(
          tx
            .select()
            .from(signedUrls)
            .where(
              and(
                eq(signedUrls.id, id),
                eq(signedUrls.used, false),
                gt(signedUrls.expiresAt, now) // expiresAt is greater than now (not expired)
              )
            ),
          { skipLocked: true }
        ).limit(1);

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
