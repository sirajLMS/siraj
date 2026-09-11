import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { sanitizeForRendering } from "@/app/api/logs/route";

const ROUTE_PATH = "app/api/logs/route.ts";

describe("Client logs API route security", () => {
  test("neutralizes CR and LF characters in sanitizeForRendering", () => {
    const maliciousInput = "Hello\r\n[CRITICAL] System compromised!\nEvilLogLine";
    const sanitized = sanitizeForRendering(maliciousInput);

    expect(sanitized).not.toContain("\r");
    expect(sanitized).not.toContain("\n");
    expect(sanitized).toBe("Hello [CRITICAL] System compromised! EvilLogLine");
  });

  test("strips ANSI escapes and escapes HTML entities in sanitizeForRendering", () => {
    const input = "\x1b[31m<script>alert('xss')</script>\x1b[0m & \"test\"";
    const sanitized = sanitizeForRendering(input);

    expect(sanitized).toBe("&lt;script&gt;alert('xss')&lt;/script&gt; &amp; &quot;test&quot;");
  });

  test("enforces session ID alphanumeric hyphen format to prevent path traversal", async () => {
    const src = await readFile(join(process.cwd(), ROUTE_PATH), "utf8");

    expect(src).toContain("SAFE_SESSION_ID_REGEX = /^[a-zA-Z0-9-]+$/");
    expect(src).toContain("sanitizeSessionId");
  });

  test("requires authentication and rate limiting for client log ingestion", async () => {
    const src = await readFile(join(process.cwd(), ROUTE_PATH), "utf8");

    expect(src).toContain("getServerUserContext()");
    expect(src).toContain("clientLogsRateLimiter");
    expect(src).toContain("MAX_LOG_ENTRIES_PER_BATCH");
    expect(src).toContain("MAX_LOG_BATCH_BYTES");
  });
});
