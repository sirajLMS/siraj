import { describe, expect, it } from "bun:test";
import { AvailabilitySearchSortBy, DayOfWeek } from "@/backend/enum";
import {
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
} from "./availability-utils";

describe("availability-utils", () => {
  describe("timeToMinutes", () => {
    it("converts HH:MM strings to total minutes accurately", () => {
      expect(timeToMinutes("00:00")).toBe(0);
      expect(timeToMinutes("01:30")).toBe(90);
      expect(timeToMinutes("09:15")).toBe(555);
      expect(timeToMinutes("14:30")).toBe(870);
      expect(timeToMinutes("23:59")).toBe(1439);
    });

    it("handles HH:MM:SS format correctly ignoring seconds", () => {
      expect(timeToMinutes("14:30:45")).toBe(870);
      expect(timeToMinutes("08:05:12")).toBe(485);
    });

    it("returns 0 for invalid string lacking colon", () => {
      expect(timeToMinutes("invalid")).toBe(0);
    });
  });

  describe("dateToMinutes and dateToTimeString", () => {
    it("extracts total minutes since UTC midnight directly", () => {
      const date = new Date("2025-05-15T14:30:00.000Z");
      expect(dateToMinutes(date)).toBe(870);
      expect(dateToTimeString(date)).toBe("14:30:00");
    });
  });

  describe("getUtcDayOfWeek and getUtcDateString", () => {
    it("returns correct DayOfWeek enum and date string", () => {
      const date = new Date("2025-05-15T10:00:00.000Z"); // Thursday
      expect(getUtcDayOfWeek(date)).toBe(DayOfWeek.THURSDAY);
      expect(getUtcDateString(date)).toBe("2025-05-15");
    });
  });

  describe("isWithinEffectiveRange", () => {
    it("validates effective date bounds correctly", () => {
      expect(isWithinEffectiveRange("2025-05-15", "2025-05-01", "2025-05-31")).toBe(true);
      expect(isWithinEffectiveRange("2025-05-15", "2025-05-20", "2025-05-31")).toBe(false);
      expect(isWithinEffectiveRange("2025-05-15", "2025-05-01", "2025-05-10")).toBe(false);
      expect(isWithinEffectiveRange("2025-05-15", null, null)).toBe(true);
    });
  });

  describe("getVacationBlockedRangesForDate", () => {
    it("computes vacation blocked minute ranges accurately without string round-trips", () => {
      const calendarDate = "2025-05-15";
      const vacations = [
        {
          startAt: new Date("2025-05-15T09:00:00.000Z"),
          endAt: new Date("2025-05-15T12:00:00.000Z"),
        },
        {
          // Out of range (prior day)
          startAt: new Date("2025-05-10T00:00:00.000Z"),
          endAt: new Date("2025-05-14T23:59:59.000Z"),
        },
      ];

      const blocked = getVacationBlockedRangesForDate(calendarDate, vacations);
      expect(blocked).toEqual([{ start: 540, end: 720 }]);
    });
  });

  describe("getBookingBlockedRangesForDate", () => {
    it("computes booking blocked minute ranges accurately using direct dateToMinutes", () => {
      const calendarDate = "2025-05-15";
      const bookings = [
        {
          scheduledStartAt: new Date("2025-05-15T14:00:00.000Z"),
          scheduledEndAt: new Date("2025-05-15T15:30:00.000Z"),
        },
        {
          // Different day
          scheduledStartAt: new Date("2025-05-16T14:00:00.000Z"),
          scheduledEndAt: new Date("2025-05-16T15:30:00.000Z"),
        },
      ];

      const blocked = getBookingBlockedRangesForDate(calendarDate, bookings);
      expect(blocked).toEqual([{ start: 840, end: 930 }]);
    });
  });

  describe("findGapsForCalendarDate", () => {
    it("calculates availability gaps correctly", () => {
      const teacher = {
        teacherId: "t1",
        teacherName: "John Doe",
        teacherGender: "MALE",
        teacherTimezone: "UTC" as const,
      };

      const dayWindows = [
        {
          id: "w1",
          teacherProfileId: "t1",
          dayOfWeek: DayOfWeek.THURSDAY,
          startTime: "09:00",
          endTime: "17:00",
          effectiveFrom: null,
          effectiveUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const dayUnavail = [
        {
          id: "u1",
          teacherProfileId: "t1",
          dayOfWeek: DayOfWeek.THURSDAY,
          startTime: "12:00",
          endTime: "13:00",
          effectiveFrom: null,
          effectiveUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const gaps = findGapsForCalendarDate({
        teacher,
        calendarDate: "2025-05-15",
        day: DayOfWeek.THURSDAY,
        dayWindows,
        dayUnavail,
        extraBlocked: [],
        searchRange: { from: 0, to: 1440 },
      });

      expect(gaps).toHaveLength(2);
      expect(gaps[0].gapStartTime).toBe("09:00");
      expect(gaps[0].gapEndTime).toBe("12:00");
      expect(gaps[1].gapStartTime).toBe("13:00");
      expect(gaps[1].gapEndTime).toBe("17:00");
    });
  });

  describe("expandDateRange & getDayOfWeekFromDateString", () => {
    it("expands inclusive date ranges", () => {
      const dates = expandDateRange("2025-05-15", "2025-05-17");
      expect(dates).toEqual(["2025-05-15", "2025-05-16", "2025-05-17"]);
    });

    it("gets DayOfWeek from date string", () => {
      expect(getDayOfWeekFromDateString("2025-05-15")).toBe(DayOfWeek.THURSDAY);
    });
  });

  describe("sortTeachers", () => {
    const teachers = [
      { id: "1", name: "Bob", timezone: "America/New_York", gaps: [1 as any, 2 as any], availableDaysCount: 2 },
      { id: "2", name: "Alice", timezone: "Europe/London", gaps: [1 as any], availableDaysCount: 1 },
      { id: "3", name: "Charlie", timezone: "Asia/Tokyo", gaps: [1 as any, 2 as any, 3 as any], availableDaysCount: 3 },
    ] as any;

    it("sorts by name desc", () => {
      const sorted = sortTeachers(teachers, AvailabilitySearchSortBy.NAME_DESC);
      expect(sorted.map(t => t.name)).toEqual(["Charlie", "Bob", "Alice"]);
    });

    it("sorts by most gaps", () => {
      const sorted = sortTeachers(teachers, AvailabilitySearchSortBy.MOST_GAPS);
      expect(sorted.map(t => t.name)).toEqual(["Charlie", "Bob", "Alice"]);
    });

    it("sorts by default name asc", () => {
      const sorted = sortTeachers(teachers, null);
      expect(sorted.map(t => t.name)).toEqual(["Alice", "Bob", "Charlie"]);
    });
  });

  describe("groupByTeacherId", () => {
    it("groups items by teacherId into a Map", () => {
      const items = [
        { teacherId: "t1", name: "A" },
        { teacherId: "t2", name: "B" },
        { teacherId: "t1", name: "C" },
      ];
      const map = groupByTeacherId(items);
      expect(map.get("t1")).toEqual([
        { teacherId: "t1", name: "A" },
        { teacherId: "t1", name: "C" },
      ]);
      expect(map.get("t2")).toEqual([{ teacherId: "t2", name: "B" }]);
    });
  });
});
