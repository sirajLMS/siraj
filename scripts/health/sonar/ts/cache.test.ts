import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as cacheModule from "@/scripts/health/sonar/ts/cache";
import { clearSonarCache, getCachedFingerprint, saveProjectFingerprint } from "@/scripts/health/sonar/ts/cache";
import { SONAR_DIR } from "@/scripts/health/sonar/ts/config";

const CACHE_FILE = join(SONAR_DIR, ".sonar-cache");

describe("Sonar Cache", () => {
  let originalCacheContent: string | null = null;

  beforeEach(() => {
    if (existsSync(CACHE_FILE)) {
      originalCacheContent = readFileSync(CACHE_FILE, "utf8");
    } else {
      originalCacheContent = null;
    }
  });

  afterEach(() => {
    if (originalCacheContent !== null) {
      writeFileSync(CACHE_FILE, originalCacheContent, "utf8");
    } else if (existsSync(CACHE_FILE)) {
      unlinkSync(CACHE_FILE);
    }
  });

  it("saves and retrieves project fingerprint correctly", async () => {
    await saveProjectFingerprint();
    const cached = getCachedFingerprint();
    expect(cached).not.toBeNull();
    expect(typeof cached).toBe("string");
    expect(cached).toMatch(/^\d+-\d+$/);
  });

  it("clears sonar cache properly", async () => {
    await saveProjectFingerprint();
    expect(getCachedFingerprint()).not.toBeNull();
    clearSonarCache();
    expect(getCachedFingerprint()).toBeNull();
  });

  it("measures performance of saveProjectFingerprint file writing", async () => {
    const spy = spyOn(cacheModule, "getProjectFingerprint").mockResolvedValue("123-456789");
    const iterations = 100;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await saveProjectFingerprint();
    }
    const duration = performance.now() - start;
    console.log(
      `[Benchmark Baseline] ${iterations} saveProjectFingerprint calls took ${duration.toFixed(2)}ms (${(duration / iterations).toFixed(2)}ms/op)`
    );
    expect(duration).toBeGreaterThan(0);
    expect(getCachedFingerprint()).toBe("123-456789");
    spy.mockRestore();
  });
});
