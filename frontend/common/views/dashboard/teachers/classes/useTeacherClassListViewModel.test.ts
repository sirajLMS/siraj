import { describe, expect, it } from "bun:test";
import { formatClassSchedule } from "./formatClassSchedule";

describe("formatClassSchedule", () => {
  it("returns empty string when start date is null, undefined, or empty", () => {
    expect(formatClassSchedule(null, null, "en")).toBe("");
    expect(formatClassSchedule(undefined, undefined, "en")).toBe("");
    expect(formatClassSchedule("", null, "en")).toBe("");
  });

  it("returns empty string when start date is invalid", () => {
    expect(formatClassSchedule("not-a-date", null, "en")).toBe("");
  });

  it("formats start date and time when scheduledEndAt is missing or invalid", () => {
    const start = "2026-03-15T10:00:00.000Z";
    const result = formatClassSchedule(start, null, "en");
    expect(result).toContain("Sun, Mar 15");
    expect(result).toContain("·");

    const resultInvalidEnd = formatClassSchedule(start, "invalid-end", "en");
    expect(resultInvalidEnd).toBe(result);
  });

  it("formats start and end range when both timestamps are valid", () => {
    const start = "2026-03-15T10:00:00.000Z";
    const end = "2026-03-15T11:00:00.000Z";
    const result = formatClassSchedule(start, end, "en");
    expect(result).toContain("Sun, Mar 15");
    expect(result).toContain("–");
  });

  it("handles 'ar' locale using Latin locale tag fallback", () => {
    const start = "2026-03-15T10:00:00.000Z";
    const end = "2026-03-15T11:00:00.000Z";
    const result = formatClassSchedule(start, end, "ar");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("–");
  });

  it("formats 100 schedule ranges rapidly using cached Intl.DateTimeFormat instances", () => {
    const start = "2026-03-15T10:00:00.000Z";
    const end = "2026-03-15T11:00:00.000Z";

    // Warm-up cache
    formatClassSchedule(start, end, "en");

    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
      formatClassSchedule(start, end, "en");
    }
    const duration = performance.now() - startTime;

    // 100 formatting operations with cached Intl instances should complete in < 20ms
    expect(duration).toBeLessThan(20);
  });
});
