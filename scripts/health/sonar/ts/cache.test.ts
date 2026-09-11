import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import {
  clearSonarCache,
  getCachedFingerprint,
  getFileMtime,
  getProjectFingerprint,
  isProjectChanged,
  saveProjectFingerprint,
} from "@/scripts/health/sonar/ts/cache";
import { SONAR_DIR } from "@/scripts/health/sonar/ts/config";

const CACHE_FILE = join(SONAR_DIR, ".sonar-cache");

describe("Sonar cache operations", () => {
  beforeEach(() => {
    clearSonarCache();
  });

  afterEach(() => {
    clearSonarCache();
  });

  it("getProjectFingerprint returns a valid fingerprint string", async () => {
    const start = performance.now();
    const fingerprint = await getProjectFingerprint();
    const duration = performance.now() - start;
    console.log(`[Benchmark] getProjectFingerprint duration: ${duration.toFixed(2)} ms`);

    expect(typeof fingerprint).toBe("string");
    expect(fingerprint).toMatch(/^\d+-\d+$/);
  }, 30000);

  it("getCachedFingerprint returns null when cache does not exist", async () => {
    const cached = await getCachedFingerprint();
    expect(cached).toBeNull();
  });

  it("saveProjectFingerprint writes cache file and isProjectChanged reports no change", async () => {
    const startSave = performance.now();
    await saveProjectFingerprint();
    const saveDuration = performance.now() - startSave;
    console.log(`[Benchmark] saveProjectFingerprint duration: ${saveDuration.toFixed(2)} ms`);

    expect(existsSync(CACHE_FILE)).toBe(true);

    const startCheck = performance.now();
    const changedAfter = await isProjectChanged();
    const checkDuration = performance.now() - startCheck;
    console.log(`[Benchmark] isProjectChanged duration: ${checkDuration.toFixed(2)} ms`);

    expect(changedAfter).toBe(false);
  }, 30000);

  it("clearSonarCache removes the cache file", async () => {
    await saveProjectFingerprint();
    expect(existsSync(CACHE_FILE)).toBe(true);

    clearSonarCache();
    expect(existsSync(CACHE_FILE)).toBe(false);
  }, 30000);

  it("getFileMtime returns positive number for existing file and 0 for missing file", () => {
    const mtime = getFileMtime(__filename);
    expect(mtime).toBeGreaterThan(0);

    const nonExistentMtime = getFileMtime("/path/to/nonexistent/file.ts");
    expect(nonExistentMtime).toBe(0);
  });
});
