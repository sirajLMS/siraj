import { describe, expect, test } from "bun:test";
import { DayOfWeek } from "@/backend/enum";
import type { TeacherAvailabilityGap } from "@/backend/types";
import {
  computeSlotBounds,
  countAvailableDays,
  dateToTimeString,
  findGapsForCalendarDate,
  getBookingBlockedRangesForDate,
  getUtcDateString,
  getVacationBlockedRangesForDate,
  isWithinEffectiveRange,
  timeToMinutes,
} from "@/backend/utils/availability-utils";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

function expectBlockedRanges(
  ranges: { start: number; end: number }[],
  expected: { start: number; end: number }[]
): void {
  expect(ranges).toEqual(expected);
}

function buildGapOptions() {
  const teacher = {
    teacherId: "teacher-1",
    teacherName: "Jane Doe",
    teacherGender: "female",
    teacherTimezone: IanaTimezone.UTC,
  };
  return {
    teacher,
    calendarDate: "2026-09-08",
    day: DayOfWeek.TUESDAY,
    dayWindows: [
      {
        id: "w1",
        teacherId: "teacher-1",
        dayOfWeek: DayOfWeek.TUESDAY,
        startTime: "09:00",
        endTime: "17:00",
        timezoneId: null,
        timezone: "UTC",
        utcOffsetSnapshot: null,
        effectiveFrom: null,
        effectiveUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    dayUnavail: [
      {
        id: "u1",
        teacherId: "teacher-1",
        dayOfWeek: DayOfWeek.TUESDAY,
        startTime: "12:00",
        endTime: "13:00",
        reason: null,
        timezoneId: null,
        timezone: "UTC",
        utcOffsetSnapshot: null,
        effectiveFrom: null,
        effectiveUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    extraBlocked: [{ start: 600, end: 660 }], // 10:00 - 11:00
    searchRange: { from: 0, to: 1440 },
  };
}

function buildGap(id: string, gapStartTime: string, gapEndTime: string): TeacherAvailabilityGap {
  return {
    id,
    teacherId: "teacher-1",
    teacherName: "Jane Doe",
    teacherGender: "female",
    dayOfWeek: DayOfWeek.TUESDAY,
    calendarDate: "2026-09-08",
    gapStartTime,
    gapEndTime,
    timezone: IanaTimezone.UTC,
  };
}

function buildExpectedGaps(): TeacherAvailabilityGap[] {
  return [
    buildGap("teacher-1-2026-09-08-TUESDAY-540-600", "09:00", "10:00"),
    buildGap("teacher-1-2026-09-08-TUESDAY-660-720", "11:00", "12:00"),
    buildGap("teacher-1-2026-09-08-TUESDAY-780-1020", "13:00", "17:00"),
  ];
}

describe("availability-utils optimized functions", () => {
  test("timeToMinutes parses HH:MM and HH:MM:SS correctly", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("08:30")).toBe(510);
    expect(timeToMinutes("14:45:30")).toBe(885);
    expect(timeToMinutes("23:59:59")).toBe(1439);
  });

  test("dateToTimeString formats UTC time correctly", () => {
    const date = new Date("2026-09-08T08:05:09.000Z");
    expect(dateToTimeString(date)).toBe("08:05:09");
  });

  test("getUtcDateString extracts YYYY-MM-DD", () => {
    const date = new Date("2026-09-08T15:30:00.000Z");
    expect(getUtcDateString(date)).toBe("2026-09-08");
  });

  test("isWithinEffectiveRange works as expected", () => {
    expect(isWithinEffectiveRange("2026-09-08", "2026-09-01", "2026-09-30")).toBe(true);
    expect(isWithinEffectiveRange("2026-08-31", "2026-09-01", "2026-09-30")).toBe(false);
    expect(isWithinEffectiveRange("2026-10-01", "2026-09-01", "2026-09-30")).toBe(false);
    expect(isWithinEffectiveRange("2026-09-08", null, null)).toBe(true);
  });

  test("getVacationBlockedRangesForDate calculates blocked ranges correctly", () => {
    const blocked = getVacationBlockedRangesForDate("2026-09-08", [
      {
        startAt: new Date("2026-09-08T10:00:00.000Z"),
        endAt: new Date("2026-09-08T12:00:00.000Z"),
      },
    ]);
    expectBlockedRanges(blocked, [{ start: 600, end: 720 }]);
  });

  test("getBookingBlockedRangesForDate calculates booking ranges correctly", () => {
    const blocked = getBookingBlockedRangesForDate("2026-09-08", [
      {
        scheduledStartAt: new Date("2026-09-08T14:00:00.000Z"),
        scheduledEndAt: new Date("2026-09-08T15:00:00.000Z"),
      },
    ]);
    expectBlockedRanges(blocked, [{ start: 840, end: 900 }]);
  });

  test("findGapsForCalendarDate computes correct availability gaps", () => {
    const options = buildGapOptions();
    const gaps = findGapsForCalendarDate(options);
    expect(gaps).toEqual(buildExpectedGaps());
    expect(countAvailableDays(gaps)).toBe(1);
  });

  describe("computeSlotBounds", () => {
    test("returns default dates for empty slots array", () => {
      const result = computeSlotBounds([]);
      expect(result.earliestStart.getTime()).toBe(0);
      expect(result.latestEnd.getTime()).toBe(0);
    });

    test("correctly computes bounds for a single slot", () => {
      const start = new Date("2026-03-15T10:00:00.000Z");
      const end = new Date("2026-03-15T11:00:00.000Z");
      const result = computeSlotBounds([{ startTime: start, endTime: end }]);
      expect(result.earliestStart.getTime()).toBe(start.getTime());
      expect(result.latestEnd.getTime()).toBe(end.getTime());
    });

    test("correctly computes bounds for multiple unsorted slots", () => {
      const slot1 = {
        startTime: new Date("2026-03-15T14:00:00.000Z"),
        endTime: new Date("2026-03-15T15:00:00.000Z"),
      };
      const slot2 = {
        startTime: new Date("2026-03-15T08:00:00.000Z"),
        endTime: new Date("2026-03-15T09:00:00.000Z"),
      };
      const slot3 = {
        startTime: new Date("2026-03-15T18:00:00.000Z"),
        endTime: new Date("2026-03-15T20:00:00.000Z"),
      };

      const result = computeSlotBounds([slot1, slot2, slot3]);
      expect(result.earliestStart.getTime()).toBe(slot2.startTime.getTime());
      expect(result.latestEnd.getTime()).toBe(slot3.endTime.getTime());
    });

    test("handles large slot arrays without stack overflow", () => {
      const baseMs = Date.parse("2026-01-01T00:00:00.000Z");
      const numSlots = 10_000;
      const slots = Array.from({ length: numSlots }, (_, i) => ({
        startTime: new Date(baseMs + i * 3600_000),
        endTime: new Date(baseMs + (i + 1) * 3600_000),
      }));

      const result = computeSlotBounds(slots);
      expect(result.earliestStart.getTime()).toBe(baseMs);
      expect(result.latestEnd.getTime()).toBe(baseMs + numSlots * 3600_000);
    });
  });
});
