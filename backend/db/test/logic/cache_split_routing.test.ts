import { afterAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import logger from "@/backend/lib/logger";
import { db } from "../../drizzleDb";
import { CacheDbRepository } from "../../repo/cache.repository";
import { rateLimitCache, sessionCache } from "../../schema/cache";

describe("Cache Split Routing & Functionality", () => {
  const RATE_LIMIT_KEY = "ratelimit:test:123";
  const SESSION_KEY = "user:session:456";
  const TEST_VALUE = "test-value";
  const FUTURE_EXPIRES = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

  afterAll(async () => {
    // Cleanup
    await CacheDbRepository.del(RATE_LIMIT_KEY);
    await CacheDbRepository.del(SESSION_KEY);
  });

  it("should route rate limit keys to rate_limit_cache table", async () => {
    logger.log(`Testing routing for rate limit key: ${RATE_LIMIT_KEY}`);
    await CacheDbRepository.set(RATE_LIMIT_KEY, TEST_VALUE, FUTURE_EXPIRES);

    // Verify it exists in rate_limit_cache
    const rlResult = await db.select().from(rateLimitCache).where(eq(rateLimitCache.key, RATE_LIMIT_KEY)).limit(1);
    expect(rlResult.length).toBe(1);
    expect(rlResult[0].value).toBe(TEST_VALUE);

    // Verify it DOES NOT exist in session_cache
    const sessionResult = await db.select().from(sessionCache).where(eq(sessionCache.key, RATE_LIMIT_KEY)).limit(1);
    expect(sessionResult.length).toBe(0);

    const retrieved = await CacheDbRepository.get(RATE_LIMIT_KEY);
    expect(retrieved?.value).toBe(TEST_VALUE);
  });

  it("should route other keys to session_cache table", async () => {
    logger.log(`Testing routing for session key: ${SESSION_KEY}`);
    await CacheDbRepository.set(SESSION_KEY, TEST_VALUE, FUTURE_EXPIRES);

    // Verify it exists in session_cache
    const sessionResult = await db.select().from(sessionCache).where(eq(sessionCache.key, SESSION_KEY)).limit(1);
    expect(sessionResult.length).toBe(1);
    expect(sessionResult[0].value).toBe(TEST_VALUE);

    // Verify it DOES NOT exist in rate_limit_cache
    const rlResult = await db.select().from(rateLimitCache).where(eq(rateLimitCache.key, SESSION_KEY)).limit(1);
    expect(rlResult.length).toBe(0);

    const retrieved = await CacheDbRepository.get(SESSION_KEY);
    expect(retrieved?.value).toBe(TEST_VALUE);
  });

  it("should handle increment on rate limit keys", async () => {
    const INCR_KEY = "ratelimit:incr:test";
    await CacheDbRepository.del(INCR_KEY);

    const first = await CacheDbRepository.incr(INCR_KEY);
    expect(first).toBe(1);

    const second = await CacheDbRepository.incr(INCR_KEY);
    expect(second).toBe(2);

    // Verify it's in the correct table
    const result = await db.select().from(rateLimitCache).where(eq(rateLimitCache.key, INCR_KEY)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe("2");

    await CacheDbRepository.del(INCR_KEY);
  });

  it("should handle expiration and cleanup for both tables", async () => {
    const EXPIRED_RL_KEY = "ratelimit:expired";
    const EXPIRED_SESSION_KEY = "session:expired";
    const PAST_DATE = new Date(Date.now() - 1000 * 60); // 1 minute ago

    // Directly insert expired entries to bypass get() logic that deletes on read
    await db.insert(rateLimitCache).values({
      key: EXPIRED_RL_KEY,
      value: "expired",
      expiresAt: PAST_DATE,
    });
    await db.insert(sessionCache).values({
      key: EXPIRED_SESSION_KEY,
      value: "expired",
      expiresAt: PAST_DATE,
    });

    // Run cleanup
    const deletedCount = await CacheDbRepository.deleteExpired();
    expect(deletedCount).toBeGreaterThanOrEqual(2);

    // Verify both are gone
    const rlResult = await db.select().from(rateLimitCache).where(eq(rateLimitCache.key, EXPIRED_RL_KEY)).limit(1);
    expect(rlResult.length).toBe(0);
    const sessionResult = await db
      .select()
      .from(sessionCache)
      .where(eq(sessionCache.key, EXPIRED_SESSION_KEY))
      .limit(1);
    expect(sessionResult.length).toBe(0);
  });
});
