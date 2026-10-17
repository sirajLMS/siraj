import { describe, expect, test } from "bun:test";
import { sanitizeUrlCredentials } from "@/backend/lib/utils/url";

describe("sanitizeUrlCredentials", () => {
  test("masks password in valid URLs with credentials", () => {
    expect(sanitizeUrlCredentials("redis://user:secret123@localhost:6379/0")).toBe(
      "redis://user:***@localhost:6379/0"
    );
  });

  test("leaves URLs without passwords unchanged or formatted", () => {
    expect(sanitizeUrlCredentials("https://example.com/api/v1")).toBe("https://example.com/api/v1");
  });

  test("handles invalid URLs gracefully", () => {
    expect(sanitizeUrlCredentials("not a url")).toBe("not a url");
  });
});
