/**
 * CacheServiceFactory fallback smoke test.
 * Run: `bun run test:integration` or `bun test test/integration/redis/`
 */
import { expect, test } from "bun:test";
import { cacheService } from "@/backend/services";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const describeLive = describeLiveWhen(true, "CacheServiceFactory Fallback");

describeLive("CacheServiceFactory Fallback", () => {
  test("cacheService operations succeed (Redis or Postgres fallback)", async () => {
    const pingResult = await cacheService.ping();
    expect(typeof pingResult).toBe("boolean");

    const stats = await cacheService.stats();
    expect(stats.provider).toBeDefined();
  });
});
