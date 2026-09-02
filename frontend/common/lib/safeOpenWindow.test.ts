import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { safeOpenWindow } from "./safeOpenWindow";

describe("safeOpenWindow", () => {
  let openSpy: ReturnType<typeof mock>;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    openSpy = mock(() => null);
    globalThis.window = {
      open: openSpy,
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  test("opens safe https URLs", () => {
    safeOpenWindow("https://example.com/meeting");
    expect(openSpy).toHaveBeenCalledWith("https://example.com/meeting", "_blank", "noopener,noreferrer");
  });

  test("opens safe http URLs", () => {
    safeOpenWindow("http://localhost:3000/meeting");
    expect(openSpy).toHaveBeenCalledWith("http://localhost:3000/meeting", "_blank", "noopener,noreferrer");
  });

  test("opens safe relative paths", () => {
    safeOpenWindow("/dashboard/schedule");
    expect(openSpy).toHaveBeenCalledWith("/dashboard/schedule", "_blank", "noopener,noreferrer");
  });

  test("rejects javascript: URLs (XSS protection)", () => {
    safeOpenWindow("javascript:alert('xss')");
    expect(openSpy).not.toHaveBeenCalled();
  });

  test("rejects data: URLs", () => {
    safeOpenWindow("data:text/html,<script>alert(1)</script>");
    expect(openSpy).not.toHaveBeenCalled();
  });

  test("rejects vbscript: URLs", () => {
    safeOpenWindow("vbscript:msgbox(1)");
    expect(openSpy).not.toHaveBeenCalled();
  });

  test("rejects protocol-relative URLs (//evil.com)", () => {
    safeOpenWindow("//evil.com/phishing");
    expect(openSpy).not.toHaveBeenCalled();
  });

  test("rejects null, undefined, or empty string", () => {
    safeOpenWindow(null);
    safeOpenWindow(undefined);
    safeOpenWindow("   ");
    expect(openSpy).not.toHaveBeenCalled();
  });
});
