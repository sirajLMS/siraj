import { describe, expect, test } from "bun:test";
import {
  MAX_AUDIT_MASK_DEPTH,
  maskAuditPayload,
  maskSensitiveAuditValues,
} from "@/backend/db/repo/audit/audit-masking.helpers";

describe("maskSensitiveAuditValues", () => {
  test("masks every sensitive key name at the top level, keeps name/email visible", () => {
    const payload = {
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      password: "hunter2",
      rememberToken: "rt-secret",
      accessToken: "at-secret",
      refreshToken: "rf-secret",
      token: "tok",
      secret: "s",
      iban: "SA0310000012345678901234",
      accountNumber: "1234567890",
      routingNumber: "111000025",
      swiftBic: "ABPBSARI",
      nationalId: "1012345678",
      unchanged: "stays",
    };

    const masked = maskSensitiveAuditValues(payload);

    expect(masked).toMatchObject({
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      password: "[MASKED]",
      rememberToken: "[MASKED]",
      accessToken: "[MASKED]",
      refreshToken: "[MASKED]",
      token: "[MASKED]",
      secret: "[MASKED]",
      iban: "[MASKED]",
      accountNumber: "[MASKED]",
      routingNumber: "[MASKED]",
      swiftBic: "[MASKED]",
      nationalId: "[MASKED]",
      unchanged: "stays",
    });
    // The input payload is never mutated.
    expect(payload.password).toBe("hunter2");
  });

  test("masks sensitive keys nested inside objects and arrays", () => {
    const payload = {
      profile: { contact: { phone: "+966500000000", password: "p@ss" } },
      devices: [{ token: "device-token-1" }, { id: "keep", secret: "s2" }],
    };

    const masked = maskSensitiveAuditValues(payload);

    expect(masked).toMatchObject({
      profile: { contact: { phone: "+966500000000", password: "[MASKED]" } },
      devices: [{ token: "[MASKED]" }, { id: "keep", secret: "[MASKED]" }],
    });
  });

  test("masks sensitive keys inside changes payloads (from/to wrappers)", () => {
    const changes = {
      password: { from: "old", to: "new" },
      name: { from: "Old Name", to: "New Name" },
    };

    expect(maskSensitiveAuditValues(changes)).toEqual({
      password: "[MASKED]",
      name: { from: "Old Name", to: "New Name" },
    });
  });

  test("returns the original reference when nothing needs masking", () => {
    const payload = { name: "Ahmed", email: "ahmed@example.com" };
    expect(maskSensitiveAuditValues(payload)).toBe(payload);
  });

  test("masks the entire subtree past the depth cap", () => {
    const chainDepth = MAX_AUDIT_MASK_DEPTH + 5;
    const deepPayload: Record<string, unknown> = { secret: "top-level-masked" };
    let node: Record<string, unknown> = deepPayload;
    for (let i = 0; i < chainDepth; i++) {
      const next: Record<string, unknown> = {};
      node.child = next;
      node = next;
    }
    node.secret = "buried-below-depth-cap";

    const masked = maskSensitiveAuditValues(deepPayload);

    expect(masked).toHaveProperty("secret", "[MASKED]");
    // Everything past the depth cap is masked rather than passed through.
    const cappedPath = Array.from({ length: MAX_AUDIT_MASK_DEPTH }, () => "child").join(".");
    expect(masked).toHaveProperty(cappedPath, "[MASKED]");
  });

  test("masks decorated key variants (suffix, capitalization, snake_case)", () => {
    const masked = maskSensitiveAuditValues({
      passwordHash: "h",
      rememberTokenHash: "t",
      client_secret: "s",
      ApiKey: "k",
    });
    expect(masked).toEqual({
      passwordHash: "[MASKED]",
      rememberTokenHash: "[MASKED]",
      client_secret: "[MASKED]",
      ApiKey: "[MASKED]",
    });
  });

  test("handles primitives, null, and arrays of primitives", () => {
    expect(maskSensitiveAuditValues(null)).toBeNull();
    expect(maskSensitiveAuditValues("plain")).toBe("plain");
    expect(maskSensitiveAuditValues(42)).toBe(42);
    expect(maskSensitiveAuditValues([1, "two", null])).toEqual([1, "two", null]);
  });
});

describe("maskAuditPayload", () => {
  test("maps null and undefined to null (insert-boundary semantics)", () => {
    expect(maskAuditPayload(null)).toBeNull();
    expect(maskAuditPayload(undefined)).toBeNull();
  });

  test("masks the payload it receives", () => {
    expect(maskAuditPayload({ password: "x", name: "y" })).toEqual({ password: "[MASKED]", name: "y" });
  });
});
