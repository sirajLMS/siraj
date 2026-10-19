import { describe, expect, test } from "bun:test";
import type { LogEntry } from "@/app/api/logs/client-logs.constants";
import { isValidLogEntry, sanitizeForRendering } from "@/app/api/logs/client-logs-sanitize.helpers";

describe("sanitizeForRendering", () => {
  test("replaces newlines (\n, \r, \r\n) with spaces to prevent log injection", () => {
    const inputWithLineFeed = "Line 1\n[2026-01-01] [ERROR] [SEQ:99] [admin] Forged log message";
    expect(sanitizeForRendering(inputWithLineFeed)).toBe(
      "Line 1 [2026-01-01] [ERROR] [SEQ:99] [admin] Forged log message"
    );

    const inputWithCarriageReturnLineFeed = "Line 1\r\nLine 2";
    expect(sanitizeForRendering(inputWithCarriageReturnLineFeed)).toBe("Line 1 Line 2");

    const inputWithMultipleNewlines = "Line 1\n\n\r\r\nLine 2";
    expect(sanitizeForRendering(inputWithMultipleNewlines)).toBe("Line 1 Line 2");
  });

  test("escapes HTML entities and strips ANSI escape sequences", () => {
    const inputWithAnsiAndHtml = "\x1b[31m<script>alert('xss')</script> & \"quote\"\x1b[0m";
    expect(sanitizeForRendering(inputWithAnsiAndHtml)).toBe(
      "\x26lt;script\x26gt;alert('xss')\x26lt;/script\x26gt; \x26amp; \x26quot;quote\x26quot;"
    );
  });

  test("neutralizes log injection payloads in level and timestamp fields", () => {
    const maliciousTimestamp = "2026-01-01\n[2026-01-01T00:00:00Z] [FATAL] [SEQ:999] [admin] Fake log line";
    expect(sanitizeForRendering(maliciousTimestamp)).toBe(
      "2026-01-01 [2026-01-01T00:00:00Z] [FATAL] [SEQ:999] [admin] Fake log line"
    );

    const maliciousLevel = "INFO\r\n[2026-01-01T00:00:00Z] [WARN] Injected line";
    expect(sanitizeForRendering(maliciousLevel)).toBe("INFO [2026-01-01T00:00:00Z] [WARN] Injected line");
  });
});

describe("isValidLogEntry", () => {
  test("returns true for valid LogEntry objects", () => {
    expect(
      isValidLogEntry({
        sessionId: "session-123",
        level: "info",
        message: "user logged in",
        sequence: 1,
        timestamp: "2026-01-01T00:00:00Z",
        caller: "auth.ts",
      })
    ).toBe(true);

    expect(
      isValidLogEntry({
        sessionId: "session-123",
        level: "error",
        message: "something failed",
        sequence: 2,
      })
    ).toBe(true);
  });

  test("returns false for non-string or missing required fields", () => {
    // Missing fields
    expect(isValidLogEntry({} as LogEntry)).toBe(false);
    expect(isValidLogEntry(null as unknown as LogEntry)).toBe(false);

    // Non-string level
    expect(
      isValidLogEntry({
        sessionId: "session-123",
        level: 123 as unknown as string,
        message: "test",
        sequence: 1,
      })
    ).toBe(false);

    // Non-string message
    expect(
      isValidLogEntry({
        sessionId: "session-123",
        level: "info",
        message: { malicious: "object" } as unknown as string,
        sequence: 1,
      })
    ).toBe(false);

    // Non-numeric sequence
    expect(
      isValidLogEntry({
        sessionId: "session-123",
        level: "info",
        message: "test",
        sequence: "1" as unknown as number,
      })
    ).toBe(false);

    // Non-string timestamp
    expect(
      isValidLogEntry({
        sessionId: "session-123",
        level: "info",
        message: "test",
        sequence: 1,
        timestamp: 123456789 as unknown as string,
      })
    ).toBe(false);
  });
});
