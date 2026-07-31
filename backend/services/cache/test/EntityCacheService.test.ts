import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { cacheService } from "@/backend/services/cache/CacheServiceFactory";
import {
  CACHE_VERSION,
  cachedRead,
  cachedReadSingleFlight,
  getEntityCacheStats,
  invalidateClassLifecycle,
  invalidateParentWrite,
  invalidateRoleChange,
  invalidateTag,
  invalidateTeacherWrite,
  safeIndexTags,
  stableStringify,
  validateEntry,
} from "@/backend/services/cache/EntityCacheService";

describe("EntityCacheService Unit Tests", () => {
  const store = new Map<string, string>();
  let pipelineCalls: Array<Array<{ command: string; args: (string | number)[] }>> = [];

  const originalGet = cacheService.get;
  const originalSet = cacheService.set;
  const originalDel = cacheService.del;
  const originalPipeline = cacheService.pipeline;

  beforeEach(() => {
    store.clear();
    pipelineCalls = [];

    cacheService.get = async (key: string) => store.get(key) ?? null;
    cacheService.set = async (key: string, value: string) => {
      store.set(key, value);
    };
    cacheService.del = async (key: string) => {
      store.delete(key);
    };
    cacheService.pipeline = async (commands: Array<{ command: string; args: (string | number)[] }>) => {
      pipelineCalls.push(commands);
      const results: unknown[] = [];
      for (const cmd of commands) {
        if (cmd.command === "del") {
          for (const arg of cmd.args) {
            store.delete(String(arg));
          }
          results.push(1);
        } else if (cmd.command === "set") {
          store.set(String(cmd.args[0]), String(cmd.args[1]));
          results.push("OK");
        }
      }
      return results;
    };
  });

  afterEach(() => {
    cacheService.get = originalGet;
    cacheService.set = originalSet;
    cacheService.del = originalDel;
    cacheService.pipeline = originalPipeline;
  });

  it("stableStringify key-order stability", () => {
    const obj1 = { b: 2, a: 1, c: { y: "hello", x: [1, 2] } };
    const obj2 = { a: 1, c: { x: [1, 2], y: "hello" }, b: 2 };
    expect(stableStringify(obj1)).toBe(stableStringify(obj2));
  });

  it("validateEntry shape guard", () => {
    expect(validateEntry({ version: 1, data: "test", cachedAt: 123 })).toBe(true);
    expect(validateEntry({ version: 2, data: "test", cachedAt: 123 })).toBe(false);
    expect(validateEntry(null)).toBe(false);
    expect(validateEntry([])).toBe(false);
    expect(validateEntry("string")).toBe(false);
  });

  it("cache miss invokes loader and writes entry and tag index", async () => {
    let loaderCount = 0;
    const loader = async () => {
      loaderCount++;
      return { id: 123, name: "Alice" };
    };

    const result = await cachedRead("ec:user:123:admin", 300, loader, ["user:123"]);

    expect(result).toEqual({ id: 123, name: "Alice" });
    expect(loaderCount).toBe(1);

    const storedRaw = store.get("ec:user:123:admin");
    expect(storedRaw).toBeDefined();
    const parsed = JSON.parse(storedRaw ?? "{}");
    expect(parsed.data).toEqual({ id: 123, name: "Alice" });
    expect(parsed.version).toBe(CACHE_VERSION);

    const tagRaw = store.get("tag:user:123");
    expect(tagRaw).toBeDefined();
    expect(JSON.parse(tagRaw ?? "[]")).toEqual(["ec:user:123:admin"]);
  });

  it("cache hit returns cached value without calling loader", async () => {
    const cachedEntry = {
      version: CACHE_VERSION,
      data: { id: 123, name: "Bob" },
      cachedAt: Date.now(),
    };
    store.set("ec:user:123:admin", JSON.stringify(cachedEntry));

    let loaderCalled = false;
    const loader = async () => {
      loaderCalled = true;
      return { id: 123, name: "Fresh" };
    };

    const result = await cachedRead("ec:user:123:admin", 300, loader, ["user:123"]);

    expect(result).toEqual({ id: 123, name: "Bob" });
    expect(loaderCalled).toBe(false);
  });

  it("re-fetches loader when CACHE_VERSION mismatches", async () => {
    const oldEntry = {
      version: 999, // old version
      data: { id: 123, name: "Outdated" },
      cachedAt: Date.now(),
    };
    store.set("ec:user:123:admin", JSON.stringify(oldEntry));

    const result = await cachedRead("ec:user:123:admin", 300, async () => ({ id: 123, name: "New" }));

    expect(result).toEqual({ id: 123, name: "New" });
  });

  it("falls back to loader on malformed JSON cache hit without throwing", async () => {
    store.set("ec:user:123:admin", "{ invalid json ...");

    const result = await cachedRead("ec:user:123:admin", 300, async () => ({ id: 123, name: "Fallback" }));

    expect(result).toEqual({ id: 123, name: "Fallback" });
  });

  it("safeIndexTags dedupes identical key", async () => {
    await safeIndexTags("ec:test:1", ["tag1"]);
    await safeIndexTags("ec:test:1", ["tag1"]);

    const tagRaw = store.get("tag:tag1");
    expect(JSON.parse(tagRaw ?? "[]")).toEqual(["ec:test:1"]);
  });

  it("invalidateTag issues pipelined del of keys and tag index", async () => {
    store.set("ec:user:1:roleA", JSON.stringify({ version: 1, data: "a" }));
    store.set("ec:user:1:roleB", JSON.stringify({ version: 1, data: "b" }));
    store.set("tag:user:1", JSON.stringify(["ec:user:1:roleA", "ec:user:1:roleB"]));

    await invalidateTag("user:1");

    expect(pipelineCalls.length).toBeGreaterThan(0);
    const lastPipeline = pipelineCalls[pipelineCalls.length - 1];
    expect(lastPipeline).toEqual([
      { command: "del", args: ["ec:user:1:roleA", "ec:user:1:roleB"] },
      { command: "del", args: ["tag:user:1"] },
    ]);

    expect(store.get("ec:user:1:roleA")).toBeUndefined();
    expect(store.get("ec:user:1:roleB")).toBeUndefined();
    expect(store.get("tag:user:1")).toBe("[]");
  });

  it("invalidateTag handles malformed tag index cleanly without throwing", async () => {
    store.set("tag:malformed", "{ bad json");

    await expect(invalidateTag("malformed")).resolves.toBeUndefined();
  });

  it("throws error if ttlSeconds > CACHE_TAG_INDEX_TTL", async () => {
    const invalidTtlCall = () => cachedRead("ec:test", 90000, async () => "data");
    expect(invalidTtlCall).toThrow("cache TTL exceeds tag index TTL");

    const invalidSingleFlightCall = () => cachedReadSingleFlight("ec:test", 90000, async () => "data");
    expect(invalidSingleFlightCall).toThrow("cache TTL exceeds tag index TTL");
  });

  it("cachedReadSingleFlight runs single flight pipeline on miss", async () => {
    const result = await cachedReadSingleFlight("ec:user:99:admin", 300, async () => "single-flight-data", ["user:99"]);

    expect(result).toBe("single-flight-data");
    expect(pipelineCalls.length).toBeGreaterThan(0);
  });

  it("named invalidation helpers build expected tag sets", async () => {
    store.set("tag:parent:p1", JSON.stringify(["ec:parent:p1"]));
    await invalidateParentWrite("p1", "u1");
    expect(store.get("tag:parent:p1")).toBe("[]");

    store.set("tag:teacher:t1", JSON.stringify(["ec:teacher:t1"]));
    await invalidateTeacherWrite("t1", "u2");
    expect(store.get("tag:teacher:t1")).toBe("[]");

    await invalidateClassLifecycle("t1", "p1");
    await invalidateRoleChange("u1");
  });

  it("records stats for hits and misses", () => {
    const stats = getEntityCacheStats();
    expect(stats).toBeDefined();
  });

  it("Date objects are restored from ISO strings on cache hit", async () => {
    const now = new Date("2025-01-15T10:30:00.000Z");
    const cachedEntry = {
      version: CACHE_VERSION,
      data: { id: "u1", createdAt: now, nested: { updatedAt: now } },
      cachedAt: Date.now(),
    };
    // Simulate what Redis/Postgres stores: ISO strings (JSON.stringify turns Dates into strings)
    store.set("ec:user:u1:admin", JSON.stringify(cachedEntry));

    const result = await cachedRead("ec:user:u1:admin", 300, async () => ({
      id: "u1",
      createdAt: new Date(),
      nested: { updatedAt: new Date() },
    }));

    // The date reviver must have restored ISO string → Date instance
    expect(result.createdAt).toBeInstanceOf(Date);
    expect((result.createdAt as Date).toISOString()).toBe("2025-01-15T10:30:00.000Z");
    expect((result.nested as { updatedAt: Date }).updatedAt).toBeInstanceOf(Date);
  });
});
