import { afterAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { CacheDbRepository } from "@/backend/db/repo/shared/cache.repository";
import { rateLimitCache, sessionCache } from "@/backend/db/schema/shared/cache";
import { runInRollback } from "@/backend/db/test/test-utils";
import { testLogger } from "@/shared/lib/logger/testlogger";

describe("Cache Split Routing & Functionality", () => {
  const uid = randomUUID();
  const RATE_LIMIT_KEY = `ratelimit:test:${uid}`;
  const SESSION_KEY = `user:session:${uid}`;
  const INCR_KEY = `ratelimit:incr:test:${uid}`;
  const TEST_VALUE = "test-value";
  const FUTURE_EXPIRES = new Date(Date.now() + 1000 * 60 * 60);

  const allKeys = [RATE_LIMIT_KEY, SESSION_KEY, INCR_KEY];

  afterAll(async () => {
    await Promise.all(
      allKeys.map(async key => {
        try {
          await CacheDbRepository.del(key);
        } catch {
          // Key may not exist — ignore
        }
      })
    );
  });

  it("should route rate limit keys to rate_limit_cache table", async () => {
    testLogger.info(`Testing routing for rate limit key: ${RATE_LIMIT_KEY}`);
    await CacheDbRepository.set(RATE_LIMIT_KEY, TEST_VALUE, FUTURE_EXPIRES);

    // Verify via runInRollback so these SELECTs don't pollute
    await runInRollback(async tx => {
      const rlResult = await tx.select().from(rateLimitCache).where(eq(rateLimitCache.key, RATE_LIMIT_KEY)).limit(1);
      expect(rlResult).toHaveLength(1);
      expect(rlResult[0].value).toBe(TEST_VALUE);

      const sessionResult = await tx.select().from(sessionCache).where(eq(sessionCache.key, RATE_LIMIT_KEY)).limit(1);
      expect(sessionResult).toHaveLength(0);
    });

    const retrieved = await CacheDbRepository.get(RATE_LIMIT_KEY);
    expect(retrieved?.value).toBe(TEST_VALUE);
  });

  it("should route other keys to session_cache table", async () => {
    testLogger.info(`Testing routing for session key: ${SESSION_KEY}`);
    await CacheDbRepository.set(SESSION_KEY, TEST_VALUE, FUTURE_EXPIRES);

    await runInRollback(async tx => {
      const sessionResult = await tx.select().from(sessionCache).where(eq(sessionCache.key, SESSION_KEY)).limit(1);
      expect(sessionResult).toHaveLength(1);
      expect(sessionResult[0].value).toBe(TEST_VALUE);

      const rlResult = await tx.select().from(rateLimitCache).where(eq(rateLimitCache.key, SESSION_KEY)).limit(1);
      expect(rlResult).toHaveLength(0);
    });

    const retrieved = await CacheDbRepository.get(SESSION_KEY);
    expect(retrieved?.value).toBe(TEST_VALUE);
  });

  it("should route ec: and tag: keys explicitly to session_cache table", async () => {
    const ecKey = `ec:user:${uid}:admin`;
    const tagKey = `tag:teacher:${uid}`;
    allKeys.push(ecKey, tagKey);

    await CacheDbRepository.set(ecKey, TEST_VALUE, FUTURE_EXPIRES);
    await CacheDbRepository.set(tagKey, TEST_VALUE, FUTURE_EXPIRES);

    await runInRollback(async tx => {
      const ecSessionResult = await tx.select().from(sessionCache).where(eq(sessionCache.key, ecKey)).limit(1);
      expect(ecSessionResult).toHaveLength(1);

      const tagSessionResult = await tx.select().from(sessionCache).where(eq(sessionCache.key, tagKey)).limit(1);
      expect(tagSessionResult).toHaveLength(1);

      const ecRlResult = await tx.select().from(rateLimitCache).where(eq(rateLimitCache.key, ecKey)).limit(1);
      expect(ecRlResult).toHaveLength(0);
    });
  });

  it("should handle increment on rate limit keys", async () => {
    await CacheDbRepository.del(INCR_KEY);

    const first = await CacheDbRepository.incr(INCR_KEY);
    expect(first).toBe(1);

    const second = await CacheDbRepository.incr(INCR_KEY);
    expect(second).toBe(2);

    // Verify it's in the correct table via runInRollback
    await runInRollback(async tx => {
      const result = await tx.select().from(rateLimitCache).where(eq(rateLimitCache.key, INCR_KEY)).limit(1);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("2");
    });
  });

  it("should handle expiration and cleanup for both tables", async () => {
    const expiredUid = randomUUID();
    const EXPIRED_RL_KEY = `ratelimit:expired:${expiredUid}`;
    const EXPIRED_SESSION_KEY = `session:expired:${expiredUid}`;
    const PAST_DATE = new Date(Date.now() - 1000 * 60);

    // Directly insert expired entries — these leak outside transactions,
    // so we add them to afterAll cleanup
    allKeys.push(EXPIRED_RL_KEY, EXPIRED_SESSION_KEY);

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

    // Run cleanup — deleteExpired() deletes ALL expired entries,
    // so we don't assert on total count (it includes other tests' data)
    const deletedCount = await CacheDbRepository.deleteExpired();
    expect(deletedCount).toBeGreaterThanOrEqual(2);

    // Verify our specific test entries are gone via runInRollback
    await runInRollback(async tx => {
      const rlResult = await tx.select().from(rateLimitCache).where(eq(rateLimitCache.key, EXPIRED_RL_KEY)).limit(1);
      expect(rlResult).toHaveLength(0);

      const sessionResult = await tx
        .select()
        .from(sessionCache)
        .where(eq(sessionCache.key, EXPIRED_SESSION_KEY))
        .limit(1);
      expect(sessionResult).toHaveLength(0);
    });
  });
});
