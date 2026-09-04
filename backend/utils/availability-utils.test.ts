import { describe, expect, it } from "bun:test";
import { AvailabilitySearchSortBy, DayOfWeek } from "@/backend/enum";
import type {
  AvailabilitySearchTeacher,
  TeacherAvailabilityGap,
  TeacherAvailabilityWindowSelectType,
  TeacherRecurringUnavailabilitySelectType,
} from "@/backend/types";
import {
  countAvailableDays,
  dateToMinutes,
  dateToTimeString,
  expandDateRange,
  findGapsForCalendarDate,
  getBookingBlockedRangesForDate,
  getDayOfWeekFromDateString,
  getUtcDateString,
  getUtcDayOfWeek,
  getVacationBlockedRangesForDate,
  groupByTeacherId,
  isWithinEffectiveRange,
  sortTeachers,
  timeToMinutes,
} from "@/backend/utils/availability-utils";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

describe("availability-utils performance and correctness", () => {
  describe("timeToMinutes", () => {
    it("correctly converts standard HH:MM and HH:MM:SS format strings", () => {
      expect(timeToMinutes("00:00")).toBe(0);
      expect(timeToMinutes("00:00:00")).toBe(0);
      expect(timeToMinutes("08:30")).toBe(510);
      expect(timeToMinutes("08:30:00")).toBe(510);
      expect(timeToMinutes("14:15:30")).toBe(855);
      expect(timeToMinutes("23:59:59")).toBe(1439);
      expect(timeToMinutes("9:5")).toBe(545);
    });
  });

  describe("dateToMinutes", () => {
    it("correctly converts Date objects to UTC minutes from midnight", () => {
      const d1 = new Date("2026-09-04T08:30:00.000Z");
      expect(dateToMinutes(d1)).toBe(510);

      const d2 = new Date("2026-09-04T00:00:00.000Z");
      expect(dateToMinutes(d2)).toBe(0);

      const d3 = new Date("2026-09-04T23:59:00.000Z");
      expect(dateToMinutes(d3)).toBe(1439);

      // Verify exact equality with timeToMinutes(dateToTimeString(d))
      expect(dateToMinutes(d1)).toBe(timeToMinutes(dateToTimeString(d1)));
      expect(dateToMinutes(d2)).toBe(timeToMinutes(dateToTimeString(d2)));
      expect(dateToMinutes(d3)).toBe(timeToMinutes(dateToTimeString(d3)));
    });
  });

  describe("dateToTimeString and UTC helpers", () => {
    it("formats date to HH:MM:SS string in UTC", () => {
      const d = new Date("2026-09-04T12:05:09.000Z");
      expect(dateToTimeString(d)).toBe("12:05:09");
      expect(getUtcDateString(d)).toBe("2026-09-04");
      expect(getUtcDayOfWeek(d)).toBe(DayOfWeek.FRIDAY);
    });
  });

  describe("isWithinEffectiveRange", () => {
    it("evaluates effective date constraints correctly", () => {
      expect(isWithinEffectiveRange("2026-09-04", null, null)).toBe(true);
      expect(isWithinEffectiveRange("2026-09-04", "2026-09-01", "2026-09-10")).toBe(true);
      expect(isWithinEffectiveRange("2026-08-31", "2026-09-01", "2026-09-10")).toBe(false);
      expect(isWithinEffectiveRange("2026-09-11", "2026-09-01", "2026-09-10")).toBe(false);
    });
  });

  describe("groupByTeacherId", () => {
    it("groups elements by teacherId without missing records", () => {
      const rows = [
        { teacherId: "t1", val: 1 },
        { teacherId: "t2", val: 2 },
        { teacherId: "t1", val: 3 },
      ];
      const grouped = groupByTeacherId(rows);
      expect(grouped.size).toBe(2);
      expect(grouped.get("t1")).toEqual([
        { teacherId: "t1", val: 1 },
        { teacherId: "t1", val: 3 },
      ]);
      expect(grouped.get("t2")).toEqual([{ teacherId: "t2", val: 2 }]);
    });
  });

  describe("countAvailableDays", () => {
    it("counts unique calendar dates in gap list", () => {
      const gaps = [
        { calendarDate: "2026-09-01" },
        { calendarDate: "2026-09-01" },
        { calendarDate: "2026-09-02" },
      ] as Partial<TeacherAvailabilityGap>[] as TeacherAvailabilityGap[];
      expect(countAvailableDays(gaps)).toBe(2);
    });
  });

  describe("sortTeachers", () => {
    it("sorts teacher list by different criteria", () => {
      const teachers = [
        { name: "Bob", gaps: [1, 2], availableDaysCount: 1, timezone: "UTC" },
        { name: "Alice", gaps: [1], availableDaysCount: 3, timezone: "EST" },
      ] as Partial<AvailabilitySearchTeacher>[] as AvailabilitySearchTeacher[];

      const byNameDesc = sortTeachers(teachers, AvailabilitySearchSortBy.NAME_DESC);
      expect(byNameDesc[0].name).toBe("Bob");

      const byMostGaps = sortTeachers(teachers, AvailabilitySearchSortBy.MOST_GAPS);
      expect(byMostGaps[0].name).toBe("Bob");

      const byAvailableDays = sortTeachers(teachers, AvailabilitySearchSortBy.MOST_AVAILABLE_DAYS);
      expect(byAvailableDays[0].name).toBe("Alice");
    });
  });

  describe("expandDateRange and getDayOfWeekFromDateString", () => {
    it("expands date ranges inclusive of bounds", () => {
      const dates = expandDateRange("2026-09-01", "2026-09-03");
      expect(dates).toEqual(["2026-09-01", "2026-09-02", "2026-09-03"]);
    });

    it("extracts DayOfWeek from YYYY-MM-DD date string", () => {
      // 2026-09-04 is Friday
      expect(getDayOfWeekFromDateString("2026-09-04")).toBe(DayOfWeek.FRIDAY);
    });
  });

  describe("getVacationBlockedRangesForDate and getBookingBlockedRangesForDate", () => {
    it("computes vacation blocked ranges correctly", () => {
      const vacations = [
        {
          startAt: new Date("2026-09-04T08:00:00.000Z"),
          endAt: new Date("2026-09-04T10:00:00.000Z"),
        },
      ];
      const blocked = getVacationBlockedRangesForDate("2026-09-04", vacations);
      expect(blocked).toEqual([{ start: 480, end: 600 }]);
    });

    it("computes booking blocked ranges correctly", () => {
      const bookings = [
        {
          scheduledStartAt: new Date("2026-09-04T14:00:00.000Z"),
          scheduledEndAt: new Date("2026-09-04T15:00:00.000Z"),
        },
      ];
      const blocked = getBookingBlockedRangesForDate("2026-09-04", bookings);
      expect(blocked).toEqual([{ start: 840, end: 900 }]);
    });
  });

  describe("findGapsForCalendarDate", () => {
    it("computes available gaps subtracting unavailabilities and extra blocked ranges", () => {
      const teacher = {
        teacherId: "t1",
        teacherName: "Teacher One",
        teacherGender: "MALE",
        teacherTimezone: "UTC" as IanaTimezone,
      };

      const dayWindows: TeacherAvailabilityWindowSelectType[] = [
        {
          id: "w1",
          teacherId: "t1",
          dayOfWeek: DayOfWeek.FRIDAY,
          startTime: "08:00:00",
          endTime: "12:00:00",
          effectiveFrom: null,
          effectiveUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const dayUnavail: TeacherRecurringUnavailabilitySelectType[] = [
        {
          id: "u1",
          teacherId: "t1",
          dayOfWeek: DayOfWeek.FRIDAY,
          startTime: "09:00:00",
          endTime: "10:00:00",
          effectiveFrom: null,
          effectiveUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const extraBlocked = [{ start: 660, end: 720 }]; // 11:00 to 12:00

      const gaps = findGapsForCalendarDate({
        teacher,
        calendarDate: "2026-09-04",
        day: DayOfWeek.FRIDAY,
        dayWindows,
        dayUnavail,
        extraBlocked,
        searchRange: { from: 0, to: 1440 },
      });

      expect(gaps).toHaveLength(2);
      expect(gaps[0].gapStartTime).toBe("08:00");
      expect(gaps[0].gapEndTime).toBe("09:00");
      expect(gaps[1].gapStartTime).toBe("10:00");
      expect(gaps[1].gapEndTime).toBe("11:00");
    });
  });
});
