import { describe, expect, test } from "bun:test";
import {
  formatDurationMinutes,
  formatScheduleTimeOnly,
  formatScheduleYourTime,
} from "@/frontend/views/dashboard/admin/dashboard/utils/formatScheduleTime";

describe("formatScheduleTimeOnly", () => {
  test("formats ISO timestamps as hh:mm AM/PM", () => {
    const formatted = formatScheduleTimeOnly("2028-06-15T14:30:00.000Z", "en");
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    expect(formatted).not.toContain("2028");
  });

  test("returns plain time strings unchanged when not ISO", () => {
    expect(formatScheduleTimeOnly("11:00 AM", "en")).toBe("11:00 AM");
  });

  test("strips trailing timezone labels from formatted strings", () => {
    expect(formatScheduleTimeOnly("3:00 PM (Asia/Riyadh)", "en")).toBe("3:00 PM");
  });
});

describe("formatScheduleYourTime", () => {
  test("combines weekday and time for ISO values", () => {
    const formatted = formatScheduleYourTime(null, "2028-06-15T14:30:00.000Z", "en");
    expect(formatted).toContain(" - ");
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
  });

  test("falls back to time-only label when no date is available", () => {
    expect(formatScheduleYourTime("11:00 AM", null, "en")).toBe("11:00 AM");
  });
});

describe("formatDurationMinutes", () => {
  test("formats minutes as hh:mm", () => {
    expect(formatDurationMinutes(60)).toBe("01:00");
    expect(formatDurationMinutes(90)).toBe("01:30");
  });

  test("returns empty string for missing values", () => {
    expect(formatDurationMinutes(null)).toBe("");
  });
});
