import { and, eq, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { authRateLimits } from "@/backend/db/schema";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";

export namespace RateLimitRepository {
  export const recordAttempt = async (
    ipAddress: string,
    email: string,
    maxAttempts: number = 5,
    lockoutMinutes: number = 15
  ): Promise<{ attempts: number; lockedUntil: Date | null; isLocked: boolean }> => {
    const safeIp = sanitizeIpAddress(ipAddress) ?? "127.0.0.1";
    const result = await db.execute<{
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
    await db.execute(sql`SELECT reset_auth_attempts(${safeIp}::inet, ${email})`);
  };

  export const cleanupExpired = async (): Promise<void> => {
    await db.execute(sql`SELECT cleanup_expired_security_data()`);
  };
}
