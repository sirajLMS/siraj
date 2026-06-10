import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import { db } from "../drizzleDb";
import { RateLimitRepository } from "../repo";
import { authRateLimits, passwordResetTokens } from "../schema";

describe("Authentication Rate Limiting Enforcement", () => {
  test("Failed login attempts should eventually lock the account/IP", async () => {
    testLogger.info("Testing rate limit enforcement on failed login attempts...");

    const email = `test-rate-${randomUUID()}@example.com`;
    const ip = "127.0.0.1";
    const maxAttempts = 3;

    // Simulate failed attempts
    for (let i = 1; i <= maxAttempts; i++) {
      const result = await RateLimitRepository.recordAttempt(ip, email, maxAttempts);
      testLogger.info(`Attempt ${i}: attempts=${result.attempts}, isLocked=${result.isLocked}`);

      if (i < maxAttempts) {
        expect(result.isLocked).toBe(false);
      } else {
        expect(result.isLocked).toBe(true);
        expect(result.lockedUntil).not.toBeNull();
      }
    }

    // Verify it's locked
    const locked = await RateLimitRepository.isLocked(ip, email);
    expect(locked).toBe(true);

    // Reset attempts
    await RateLimitRepository.resetAttempts(ip, email);
    const lockedAfterReset = await RateLimitRepository.isLocked(ip, email);
    expect(lockedAfterReset).toBe(false);

    testLogger.info("Rate limit enforcement test passed.");
  });

  test("Cleanup job should remove expired security data", async () => {
    testLogger.info("Testing security data cleanup job...");

    const email = `test-cleanup-${randomUUID()}@example.com`;
    const ip = "127.0.0.2";

    // Create an expired record (maxAttempts=1, lockoutMinutes=-1 ensures it locks and expires immediately)
    const result = await RateLimitRepository.recordAttempt(ip, email, 1, -1);
    expect(result.isLocked).toBe(false); // Locked is false because now > lockedUntil
    expect(result.lockedUntil).not.toBeNull();

    const lockedBefore = await RateLimitRepository.isLocked(ip, email);
    expect(lockedBefore).toBe(false);

    // Record should still exist in DB
    const records = await db.select().from(authRateLimits).where(eq(authRateLimits.email, email));
    expect(records.length).toBe(1);

    // Run cleanup
    await RateLimitRepository.cleanupExpired();

    // Records should be gone
    const recordsAfter = await db.select().from(authRateLimits).where(eq(authRateLimits.email, email));
    expect(recordsAfter.length).toBe(0);

    // Verify password reset token cleanup
    const tokenEmail = `token-cleanup-${randomUUID()}@example.com`;
    await db.insert(passwordResetTokens).values({
      email: tokenEmail,
      hashedToken: "abc",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() - 1000), // expired
    });

    await RateLimitRepository.cleanupExpired();
    const tokens = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.email, tokenEmail));
    expect(tokens.length).toBe(0);

    testLogger.info("Security data cleanup test passed.");
  });
});
