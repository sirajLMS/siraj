import { describe, expect, test } from "bun:test";
import { sanitizeFailureReason } from "@/backend/lib/whatsapp-sanitize";

describe("sanitizeFailureReason", () => {
  test("passes through benign error messages unchanged", () => {
    expect(sanitizeFailureReason("Rate limit exceeded")).toBe("Rate limit exceeded");
  });

  test("returns default string for empty or whitespace-only inputs", () => {
    expect(sanitizeFailureReason("")).toBe("unknown error");
    expect(sanitizeFailureReason("   ")).toBe("unknown error");
  });

  test("redacts bearer tokens and access tokens", () => {
    expect(sanitizeFailureReason("Error with access_token=EAAG123456789xyz")).toBe("Error with [redacted]");
    expect(sanitizeFailureReason("Authorization token: abc123def456")).toBe("Authorization [redacted]");
  });

  test("redacts passwords, secrets, and API keys", () => {
    expect(sanitizeFailureReason("Connection failed with password=supersecret")).toBe("Connection failed with [redacted]");
    expect(sanitizeFailureReason("Invalid secret: 987654321")).toBe("Invalid [redacted]");
    expect(sanitizeFailureReason("Unauthorized key=sk_live_12345")).toBe("Unauthorized [redacted]");
  });

  test("redacts account_id, waba_id, and phone_number_id", () => {
    expect(sanitizeFailureReason("Failed for account_id: 123456789")).toBe("Failed for [redacted]");
    expect(sanitizeFailureReason("Invalid waba_id=987654321")).toBe("Invalid [redacted]");
    expect(sanitizeFailureReason("Error on phone_number_id: \"5551234\"")).toBe("Error on [redacted]");
  });

  test("redacts cursor tokens and paging params", () => {
    expect(sanitizeFailureReason("Failed at cursor=QVFIUl token")).toBe("Failed at [redacted] token");
    expect(sanitizeFailureReason("Paging error paging: \"page_1\"")).toBe("Paging error [redacted]");
  });

  test("truncates messages longer than 256 characters", () => {
    const longMessage = "A".repeat(300);
    const result = sanitizeFailureReason(longMessage);
    expect(result.length).toBe(256);
    expect(result.endsWith("...")).toBe(true);
  });
});
