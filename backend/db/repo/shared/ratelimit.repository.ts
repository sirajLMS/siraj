import { and, eq, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { authRateLimits } from "@/backend/db/schema";

export namespace RateLimitRepository {
  const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

  function sanitizeIpAddress(ip: string): string {
    if (IPV4_REGEX.test(ip)) return ip;
    const parts = ip.split(":");
    if (parts.length === 2 && IPV4_REGEX.test(parts[0])) return parts[0];
    return "127.0.0.1";
  }

  export const recordAttempt = async (
    ipAddress: string,
    email: string,
    maxAttempts: number = 5,
    lockoutMinutes: number = 15
  ): Promise<{ attempts: number; lockedUntil: Date | null; isLocked: boolean }> => {
    const safeIp = sanitizeIpAddress(ipAddress);
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
    const safeIp = sanitizeIpAddress(ipAddress);
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
    const safeIp = sanitizeIpAddress(ipAddress);
    await db.execute(sql`SELECT reset_auth_attempts(${safeIp}::inet, ${email})`);
  };

  export const cleanupExpired = async (): Promise<void> => {
    await db.execute(sql`SELECT cleanup_expired_security_data()`);
  };
}
