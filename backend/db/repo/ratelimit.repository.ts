import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { authRateLimits } from "@/backend/db/schema";

export namespace RateLimitRepository {
  /**
   * Records a failed authentication attempt and returns the current state.
   */
  export const recordAttempt = async (
    ipAddress: string,
    email: string,
    maxAttempts: number = 5,
    lockoutMinutes: number = 15
  ): Promise<{ attempts: number; lockedUntil: Date | null; isLocked: boolean }> => {
    const result = await db.execute<{
      attempts: number;
      locked_until: string | null;
      is_locked: boolean;
    }>(sql`
      SELECT * FROM check_and_record_auth_attempt(
        ${ipAddress}::inet, 
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
  };

  /**
   * Checks if an IP/Email combination is currently locked.
   */
  export const isLocked = async (ipAddress: string, email: string): Promise<boolean> => {
    const results = await db
      .select()
      .from(authRateLimits)
      .where(and(eq(authRateLimits.ipAddress, ipAddress), eq(authRateLimits.email, email)));

    if (results.length === 0) {
      return false;
    }

    const record = results[0];
    if (!record.lockedUntil) {
      return false;
    }

    return record.lockedUntil > new Date();
  };

  /**
   * Resets attempts for a successful login.
   */
  export const resetAttempts = async (ipAddress: string, email: string): Promise<void> => {
    await db.execute(sql`SELECT reset_auth_attempts(${ipAddress}::inet, ${email})`);
  };

  /**
   * Cleans up expired rate limit records, tokens, and cache.
   */
  export const cleanupExpired = async (): Promise<void> => {
    await db.execute(sql`SELECT cleanup_expired_security_data()`);
  };
}
