import { describe, expect, test } from "bun:test";
import { isSafeUrl } from "@/shared/lib/safe-url";

describe("isSafeUrl", () => {
  test("allows valid https URL", () => {
    expect(isSafeUrl("https://example.com/path?query=1")).toBe("https://example.com/path?query=1");
  });

  test("allows valid http URL", () => {
    expect(isSafeUrl("http://localhost:3000/dashboard")).toBe("http://localhost:3000/dashboard");
  });

  test("rejects javascript: protocol", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe("");
  });

  test("rejects data: protocol", () => {
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  test("rejects file: protocol", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe("");
  });

  test("rejects bare https:// without domain", () => {
    expect(isSafeUrl("https://")).toBe("");
  });

  test("rejects control character injection", () => {
    expect(isSafeUrl("https://\x00example.com")).toBe("");
    expect(isSafeUrl("https://\r\njavascript:alert(1)")).toBe("");
    expect(isSafeUrl("https://example.com\x07")).toBe("");
  });

  test("rejects null, undefined, or empty inputs", () => {
    expect(isSafeUrl(null)).toBe("");
    expect(isSafeUrl(undefined)).toBe("");
    expect(isSafeUrl("")).toBe("");
  });
});
