import { describe, expect, test } from "bun:test";
import { formatOffsetFromMinutes, formatRelativeTimezoneOffset } from "@/frontend/common/lib/timezone";
import {
  buildScheduleTimezoneOffsetDetail,
  formatDurationMinutes,
  formatScheduleTimeOnly,
  formatScheduleYourTime,
} from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";

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

describe("formatRelativeTimezoneOffset", () => {
  test("returns zero relative offset when timezones match", () => {
    expect(formatRelativeTimezoneOffset("Africa/Cairo", "Africa/Cairo", new Date("2026-07-19T12:00:00Z"))).toBe(
      "+00:00"
    );
  });

  test("returns dash when target timezone is missing", () => {
    expect(formatRelativeTimezoneOffset(null, "Africa/Cairo")).toBe("—");
  });

  test("formats absolute offset minutes with sign", () => {
    expect(formatOffsetFromMinutes(180)).toBe("+03:00");
    expect(formatOffsetFromMinutes(-240)).toBe("-04:00");
  });
});

describe("buildScheduleTimezoneOffsetDetail", () => {
  test("includes time, timezone name, absolute offsets, and relative offset", () => {
    const detail = buildScheduleTimezoneOffsetDetail({
      timeValue: "11:00 AM",
      timezone: "Africa/Cairo",
      viewerTimezone: "Africa/Cairo",
      locale: "en",
      at: "2026-07-19T08:00:00.000Z",
    });

    expect(detail.relativeOffset).toBe("+00:00");
    expect(detail.time).toBe("11:00 AM");
    expect(detail.timezoneName.length).toBeGreaterThan(0);
    expect(detail.timezoneUtcOffset).toMatch(/^[+-]\d{2}:\d{2}$/);
    expect(detail.yourUtcOffset).toMatch(/^[+-]\d{2}:\d{2}$/);
  });
});
