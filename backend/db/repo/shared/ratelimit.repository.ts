import { and, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db, queryDb } from "@/backend/db";
import { isSqlite } from "@/backend/db/dialect";
import { authRateLimits, passwordResetTokens } from "@/backend/db/schema";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";
import type { DBTransaction } from "@/backend/types";

type RateLimitResult = { attempts: number; lockedUntil: Date | null; isLocked: boolean };

async function recordAttemptSqlite(
  safeIp: string,
  email: string,
  maxAttempts: number,
  lockoutMinutes: number
): Promise<RateLimitResult> {
  const now = new Date();
  const q = queryDb();
  const [existing] = await q
    .select()
    .from(authRateLimits)
    .where(and(eq(authRateLimits.ipAddress, safeIp), eq(authRateLimits.email, email)));

  if (!existing) {
    const lockedUntil = 1 >= maxAttempts ? new Date(now.getTime() + lockoutMinutes * 60 * 1000) : null;
    const shouldLock = lockedUntil ? lockedUntil > now : false;
    await q.insert(authRateLimits).values({
      ipAddress: safeIp,
      email,
      attempts: 1,
      lockedUntil,
      createdAt: now,
      updatedAt: now,
    });
    return { attempts: 1, lockedUntil, isLocked: shouldLock };
  }

  if (existing.lockedUntil && existing.lockedUntil > now) {
    return {
      attempts: existing.attempts,
      lockedUntil: existing.lockedUntil,
      isLocked: true,
    };
  }

  const newAttempts = (existing.lockedUntil && existing.lockedUntil <= now ? 0 : existing.attempts) + 1;
  const lockedUntil = newAttempts >= maxAttempts ? new Date(now.getTime() + lockoutMinutes * 60 * 1000) : null;
  const shouldLock = lockedUntil ? lockedUntil > now : false;
  await q
    .update(authRateLimits)
    .set({
      attempts: newAttempts,
      lockedUntil,
      updatedAt: now,
    })
    .where(eq(authRateLimits.id, existing.id));

  return {
    attempts: newAttempts,
    lockedUntil,
    isLocked: shouldLock,
  };
}

async function recordAttemptPostgres(
  safeIp: string,
  email: string,
  maxAttempts: number,
  lockoutMinutes: number
): Promise<RateLimitResult> {
  const pgDb = db as NodePgDatabase;
  const result = await pgDb.execute<{
    attempts: number;
    locked_until: string | null;
    is_locked: boolean;
  }>(sql`
    SELECT * FROM check_and_record_auth_attempt(
      ${safeIp}::inet, 
      ${email}, 
      ${maxAttempts}, 
      ${lockoutMinutes}
    )
  `);

  const row = result.rows[0];
  return {
    attempts: row.attempts,
    lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
    isLocked: row.is_locked,
  };
}

export namespace RateLimitRepository {
  export const recordAttempt = async (
    ipAddress: string,
    email: string,
    maxAttempts: number = 5,
    lockoutMinutes: number = 15
  ): Promise<RateLimitResult> => {
    const safeIp = sanitizeIpAddress(ipAddress) ?? "127.0.0.1";
    if (isSqlite()) {
      return recordAttemptSqlite(safeIp, email, maxAttempts, lockoutMinutes);
    }
    return recordAttemptPostgres(safeIp, email, maxAttempts, lockoutMinutes);
  };

  export const isLocked = async (ipAddress: string, email: string): Promise<boolean> => {
    const safeIp = sanitizeIpAddress(ipAddress) ?? "127.0.0.1";
    const q = queryDb();
    const results = await q
      .select()
      .from(authRateLimits)
      .where(and(eq(authRateLimits.ipAddress, safeIp), eq(authRateLimits.email, email)));

    if (results.length === 0) {
      return false;
    }

    const record = results[0];
    if (!record.lockedUntil) {
      return false;
    }

    return record.lockedUntil > new Date();
  };

  export const resetAttempts = async (ipAddress: string, email: string): Promise<void> => {
    const safeIp = sanitizeIpAddress(ipAddress) ?? "127.0.0.1";
    if (isSqlite()) {
      const q = queryDb();
      await q.delete(authRateLimits).where(and(eq(authRateLimits.ipAddress, safeIp), eq(authRateLimits.email, email)));
      return;
    }
    const pgDb = db as NodePgDatabase;
    await pgDb.execute(sql`SELECT reset_auth_attempts(${safeIp}::inet, ${email})`);
  };

  export const cleanupExpired = async (): Promise<void> => {
    if (isSqlite()) {
      const q = queryDb();
      const now = new Date();
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await q
        .delete(authRateLimits)
        .where(
          sql`(${authRateLimits.lockedUntil} IS NOT NULL AND ${authRateLimits.lockedUntil} < ${now}) OR (${authRateLimits.lockedUntil} IS NULL AND ${authRateLimits.updatedAt} < ${cutoff})`
        );
      await q.delete(passwordResetTokens).where(sql`${passwordResetTokens.expiresAt} < ${now}`);
      return;
    }
    const pgDb = db as NodePgDatabase;
    await pgDb.execute(sql`SELECT cleanup_expired_security_data()`);
  };

  /**
   * Right-to-be-forgotten scrub: delete the email-keyed security rows
   * (auth rate-limit attempts and password-reset tokens) of the anonymized
   * subject's pre-anonymization email. Runs inside the caller's transaction.
   */
  export const deleteEmailRemnants = async (email: string, tx: DBTransaction): Promise<void> => {
    await tx.delete(authRateLimits).where(eq(authRateLimits.email, email));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));
  };
}
