import { describe, expect, test } from "bun:test";
import { DayOfWeek } from "@/backend/enum";
import type { TeacherAvailabilityGap } from "@/backend/types";
import {
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
    const vacations = [
      {
        startAt: new Date("2026-09-08T10:00:00.000Z"),
        endAt: new Date("2026-09-08T12:00:00.000Z"),
      },
    ];
    const blocked = getVacationBlockedRangesForDate("2026-09-08", vacations);
    expect(blocked).toEqual([{ start: 600, end: 720 }]);
  });

  test("getBookingBlockedRangesForDate calculates booking ranges correctly", () => {
    const bookings = [
      {
        scheduledStartAt: new Date("2026-09-08T14:00:00.000Z"),
        scheduledEndAt: new Date("2026-09-08T15:00:00.000Z"),
      },
    ];
    const blocked = getBookingBlockedRangesForDate("2026-09-08", bookings);
    expect(blocked).toEqual([{ start: 840, end: 900 }]);
  });

  test("findGapsForCalendarDate computes correct availability gaps", () => {
    const teacher = {
      teacherId: "teacher-1",
      teacherName: "Jane Doe",
      teacherGender: "female",
      teacherTimezone: IanaTimezone.UTC,
    };
    const options = {
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

    const gaps = findGapsForCalendarDate(options);
    const expectedGaps: TeacherAvailabilityGap[] = [
      {
        id: "teacher-1-2026-09-08-TUESDAY-540-600",
        teacherId: "teacher-1",
        teacherName: "Jane Doe",
        teacherGender: "female",
        dayOfWeek: DayOfWeek.TUESDAY,
        calendarDate: "2026-09-08",
        gapStartTime: "09:00",
        gapEndTime: "10:00",
        timezone: IanaTimezone.UTC,
      },
      {
        id: "teacher-1-2026-09-08-TUESDAY-660-720",
        teacherId: "teacher-1",
        teacherName: "Jane Doe",
        teacherGender: "female",
        dayOfWeek: DayOfWeek.TUESDAY,
        calendarDate: "2026-09-08",
        gapStartTime: "11:00",
        gapEndTime: "12:00",
        timezone: IanaTimezone.UTC,
      },
      {
        id: "teacher-1-2026-09-08-TUESDAY-780-1020",
        teacherId: "teacher-1",
        teacherName: "Jane Doe",
        teacherGender: "female",
        dayOfWeek: DayOfWeek.TUESDAY,
        calendarDate: "2026-09-08",
        gapStartTime: "13:00",
        gapEndTime: "17:00",
        timezone: IanaTimezone.UTC,
      },
    ];
    expect(gaps).toEqual(expectedGaps);

    expect(countAvailableDays(gaps)).toBe(1);
  });
});
