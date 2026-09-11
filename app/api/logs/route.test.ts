import { describe, expect, test } from "bun:test";
import { sanitizeForRendering } from "@/app/api/logs/route";

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
});
