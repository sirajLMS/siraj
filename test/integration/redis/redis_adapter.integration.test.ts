/**
 * RedisCacheAdapter live provider smoke test.
 * Run: `bun run test:integration` or `bun test test/integration/redis/`
 */
import { expect, test } from "bun:test";
import { RedisCacheAdapter } from "@/backend/services";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasRedis = Boolean(process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_REST_URL);
const describeLive = describeLiveWhen(hasRedis, "RedisCacheAdapter @live-redis");

describeLive("RedisCacheAdapter @live-redis", () => {
  test("ping() and set/get/del cycle against live Redis/Upstash", async () => {
    const adapter = new RedisCacheAdapter();
    const isPingOk = await adapter.ping();
    expect(isPingOk).toBe(true);

    const testKey = `smoke:test:${Date.now()}`;
    await adapter.set(testKey, "hello", { ex: 60 });

    const val = await adapter.get(testKey);
    expect(val).toBe("hello");

    await adapter.del(testKey);
    const afterDel = await adapter.get(testKey);
    expect(afterDel).toBeNull();
  });
});
