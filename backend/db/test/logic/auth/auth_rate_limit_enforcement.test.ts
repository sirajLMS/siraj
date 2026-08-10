import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { RateLimitRepository } from "@/backend/db/repo";
import { authRateLimits, passwordResetTokens } from "@/backend/db/schema";
import { testLogger } from "@/shared/lib/logger/testlogger";

/** Generate a unique IP address to avoid collision across parallel test runs. */
function uniqueTestIp(): string {
  const hex = randomUUID().replaceAll("-", "");
  // Build a valid IPv4 in 10.x.y.z range (3 octets from UUID hex)
  const x = Number.parseInt(hex.slice(0, 2), 16); // 0-255
  const y = Number.parseInt(hex.slice(2, 4), 16); // 0-255
  const z = (Number.parseInt(hex.slice(4, 6), 16) % 253) + 1; // 1-253
  return `10.${x}.${y}.${z}`;
}

const CLEANUP_PREFIX = "test-rate-limits-";

describe("Authentication Rate Limiting Enforcement", () => {
  afterAll(async () => {
    testLogger.info("Cleaning up rate limit enforcement test records...");
    try {
      await db.delete(authRateLimits).where(like(authRateLimits.email, `${CLEANUP_PREFIX}%`));
      await db.delete(passwordResetTokens).where(like(passwordResetTokens.email, `${CLEANUP_PREFIX}%`));
      testLogger.info("Rate limit enforcement test records cleaned up.");
    } catch (error) {
      testLogger.error("Error during rate limit test cleanup:", error);
    }
  });

  test("Failed login attempts should eventually lock the account/IP", async () => {
    testLogger.info("Testing rate limit enforcement on failed login attempts...");

    const email = `${CLEANUP_PREFIX}${randomUUID()}@example.com`;
    const ip = uniqueTestIp();
    const maxAttempts = 3;

    // Simulate failed attempts — sequential via reduce (each attempt depends on
    // accumulated state from prior attempts; cannot parallelize)
    const attempts = Array.from({ length: maxAttempts }, (_, i) => i + 1);
    await attempts.reduce(async (prev, i) => {
      await prev;
      const result = await RateLimitRepository.recordAttempt(ip, email, maxAttempts);
      testLogger.info(`Attempt ${i}: attempts=${result.attempts}, isLocked=${result.isLocked}`);

      if (i < maxAttempts) {
        expect(result.isLocked).toBe(false);
      } else {
        expect(result.isLocked).toBe(true);
        expect(result.lockedUntil).not.toBeNull();
      }
    }, Promise.resolve());

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

    const email = `${CLEANUP_PREFIX}cleanup-${randomUUID()}@example.com`;
    const ip = uniqueTestIp();

    // Create an expired record (maxAttempts=1, lockoutMinutes=-1 ensures it locks and expires immediately)
    const result = await RateLimitRepository.recordAttempt(ip, email, 1, -1);
    expect(result.isLocked).toBe(false); // Locked is false because now > lockedUntil
    expect(result.lockedUntil).not.toBeNull();

    const lockedBefore = await RateLimitRepository.isLocked(ip, email);
    expect(lockedBefore).toBe(false);

    // Record should still exist in DB
    const records = await db.select().from(authRateLimits).where(eq(authRateLimits.email, email));
    expect(records).toHaveLength(1);

    // Run cleanup
    await RateLimitRepository.cleanupExpired();

    // Records should be gone
    const recordsAfter = await db.select().from(authRateLimits).where(eq(authRateLimits.email, email));
    expect(recordsAfter).toHaveLength(0);

    // Verify password reset token cleanup
    const tokenEmail = `${CLEANUP_PREFIX}token-${randomUUID()}@example.com`;
    await db.insert(passwordResetTokens).values({
      email: tokenEmail,
      hashedToken: "abc",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() - 1000), // expired
    });

    await RateLimitRepository.cleanupExpired();
    const tokens = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.email, tokenEmail));
    expect(tokens).toHaveLength(0);

    testLogger.info("Security data cleanup test passed.");
  });
});
