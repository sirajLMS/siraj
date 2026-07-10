import { describe, expect, test } from "bun:test";
import { extractMeetingId } from "@/backend/services/meeting/meeting-url-parser";

describe("extractMeetingId", () => {
  test("extracts zoom meeting id from standard join URL", () => {
    const id = extractMeetingId("zoom", "https://zoom.us/j/12345678901");
    expect(id).toBe("12345678901");
  });

  test("extracts zoom meeting id from URL with query params", () => {
    const id = extractMeetingId("zoom", "https://us06web.zoom.us/j/987654321?pwd=abc");
    expect(id).toBe("987654321");
  });

  test("returns null for zoom when URL has no meeting id", () => {
    const id = extractMeetingId("zoom", "https://zoom.us/");
    expect(id).toBeNull();
  });

  test("extracts google_meet slug from standard meet URL", () => {
    const id = extractMeetingId("google_meet", "https://meet.google.com/abc-defg-hij");
    expect(id).toBe("abc-defg-hij");
  });

  test("extracts google_meet slug case-insensitively", () => {
    const id = extractMeetingId("google_meet", "https://meet.google.com/ABC-DEFG-HIJ");
    expect(id).toBe("ABC-DEFG-HIJ");
  });

  test("returns null for google_meet when slug format is invalid", () => {
    const id = extractMeetingId("google_meet", "https://meet.google.com/lookup/abc-defg-hij");
    expect(id).toBeNull();
  });

  test("returns null for unknown provider slug", () => {
    const id = extractMeetingId("unknown_provider", "https://example.com/meeting/123");
    expect(id).toBeNull();
  });
});
