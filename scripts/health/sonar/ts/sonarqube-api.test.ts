import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CONFIG } from "@/scripts/health/sonar/ts/config";
import { generateToken } from "@/scripts/health/sonar/ts/sonarqube-api";

const TEST_TOKEN_FILE = join(import.meta.dirname, ".test-sonar-token");

describe("generateToken performance benchmark & unit test", () => {
  const originalTokenFile = CONFIG.SONAR_TOKEN_FILE;

  beforeEach(() => {
    CONFIG.SONAR_TOKEN_FILE = TEST_TOKEN_FILE;
    if (existsSync(TEST_TOKEN_FILE)) {
      unlinkSync(TEST_TOKEN_FILE);
    }
  });

  afterEach(() => {
    if (existsSync(TEST_TOKEN_FILE)) {
      unlinkSync(TEST_TOKEN_FILE);
    }
    CONFIG.SONAR_TOKEN_FILE = originalTokenFile;
    mock.restore();
  });

  test("uses existing valid token when present", async () => {
    writeFileSync(TEST_TOKEN_FILE, "existing-valid-token\n", "utf8");

    // Mock global fetch for validateToken
    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/authentication/validate")) {
        return new Response(JSON.stringify({ valid: true }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const token = await generateToken();
    expect(token).toBe("existing-valid-token");
    expect(fetchSpy).toHaveBeenCalled();
  });

  test("generates new token when existing token is invalid", async () => {
    writeFileSync(TEST_TOKEN_FILE, "existing-invalid-token", "utf8");

    const _fetchSpy = spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/authentication/validate")) {
        return new Response(JSON.stringify({ valid: false }), { status: 200 });
      }
      if (urlStr.includes("/api/user_tokens/generate")) {
        return new Response(JSON.stringify({ token: "newly-generated-token" }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const token = await generateToken();
    expect(token).toBe("newly-generated-token");
    expect(readFileSync(TEST_TOKEN_FILE, "utf8")).toBe("newly-generated-token");
  });

  test("benchmark sync file read vs async file read performance", async () => {
    const testContent = "token-for-benchmark-testing-1234567890-abcdef\n";
    writeFileSync(TEST_TOKEN_FILE, testContent, "utf8");

    const iterations = 1000;

    // Sync benchmark
    const syncStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      if (existsSync(TEST_TOKEN_FILE)) {
        const _content = readFileSync(TEST_TOKEN_FILE, "utf8").trim();
      }
    }
    const syncTime = performance.now() - syncStart;

    // Async benchmark
    const asyncStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      try {
        const _content = (await readFile(TEST_TOKEN_FILE, "utf8")).trim();
      } catch {
        // file not found
      }
    }
    const asyncTime = performance.now() - asyncStart;

    globalThis.console.log(`[Benchmark] ${iterations} sync reads: ${syncTime.toFixed(3)}ms`);
    globalThis.console.log(`[Benchmark] ${iterations} async reads: ${asyncTime.toFixed(3)}ms`);

    expect(syncTime).toBeGreaterThan(0);
    expect(asyncTime).toBeGreaterThan(0);
  });
});
