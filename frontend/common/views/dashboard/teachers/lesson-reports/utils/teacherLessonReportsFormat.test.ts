import { describe, expect, it } from "bun:test";
import { formatLessonReportDate } from "./teacherLessonReportsFormat";

describe("formatLessonReportDate", () => {
  it("returns null for null or empty input", () => {
    expect(formatLessonReportDate(null, "en")).toBeNull();
    expect(formatLessonReportDate("", "en")).toBeNull();
    expect(formatLessonReportDate(undefined, "en")).toBeNull();
  });

  it("returns null for invalid date strings", () => {
    expect(formatLessonReportDate("invalid-date", "en")).toBeNull();
  });

  it("formats valid ISO date strings for 'en' locale", () => {
    const formatted = formatLessonReportDate("2026-02-15T10:00:00Z", "en");
    expect(formatted).not.toBeNull();
    expect(formatted).toContain("Feb");
    expect(formatted).toContain("15");
  });

  it("formats valid ISO date strings for 'ar' locale using Latin numeral locale tag fallback", () => {
    const formatted = formatLessonReportDate("2026-02-15T10:00:00Z", "ar");
    expect(formatted).not.toBeNull();
    expect(formatted).toMatch(/15/);
  });
});
