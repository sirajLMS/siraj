import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";

describe("safeOpenWindow", () => {
  let openSpy: ReturnType<typeof mock>;
  let hadRealWindow = false;
  let originalOpen: typeof window.open | undefined;

  beforeEach(() => {
    openSpy = mock(() => null);
    hadRealWindow = typeof globalThis.window !== "undefined";
    if (hadRealWindow) {
      originalOpen = globalThis.window.open;
    } else {
      Object.defineProperty(globalThis, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
    }
    globalThis.window.open = openSpy;
  });

  afterEach(() => {
    if (hadRealWindow && originalOpen) {
      globalThis.window.open = originalOpen;
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
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
