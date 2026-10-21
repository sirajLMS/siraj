import { describe, expect, it } from "bun:test";
import { AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherAvailabilityGapItem } from "@/frontend/common/views/dashboard/search-schedule/types";
import {
  buildDateColumns,
  formatGapLabel,
  getColumnCount,
  getSortLabelKey,
  groupGapsByDate,
  groupGapsByDayOfMonth,
  shiftMonth,
} from "@/frontend/common/views/dashboard/search-schedule/utils/searchSchedule.utils";
import { computeSearchScheduleResults } from "@/frontend/common/views/dashboard/search-schedule/utils/searchScheduleResults.utils";

describe("searchSchedule.utils", () => {
  describe("groupGapsByDate", () => {
    it("handles null, undefined, or empty gaps array", () => {
      expect(groupGapsByDate(null).size).toBe(0);
      expect(groupGapsByDate(undefined).size).toBe(0);
      expect(groupGapsByDate([]).size).toBe(0);
    });

    it("groups gaps correctly by calendarDate", () => {
      const gap1: TeacherAvailabilityGapItem = {
        calendarDate: "2026-03-15",
        gapStartTime: "09:00",
        gapEndTime: "10:00",
      };
      const gap2: TeacherAvailabilityGapItem = {
        calendarDate: "2026-03-15",
        gapStartTime: "11:00",
        gapEndTime: "12:00",
      };
      const gap3: TeacherAvailabilityGapItem = {
        calendarDate: "2026-03-16",
        gapStartTime: "14:00",
        gapEndTime: "15:00",
      };

      const result = groupGapsByDate([gap1, null, gap2, gap3]);

      expect(result.size).toBe(2);
      expect(result.get("2026-03-15")).toEqual([gap1, gap2]);
      expect(result.get("2026-03-16")).toEqual([gap3]);
    });

    it("skips items missing calendarDate", () => {
      const invalidGap = { gapStartTime: "09:00", gapEndTime: "10:00" } as unknown as TeacherAvailabilityGapItem;
      const result = groupGapsByDate([invalidGap]);
      expect(result.size).toBe(0);
    });
  });

  describe("groupGapsByDayOfMonth", () => {
    it("handles null, undefined, or empty gaps", () => {
      const month = new Date(2026, 2, 1); // March 2026
      expect(groupGapsByDayOfMonth(null, month)).toEqual({});
      expect(groupGapsByDayOfMonth(undefined, month)).toEqual({});
      expect(groupGapsByDayOfMonth([], month)).toEqual({});
    });

    it("groups gaps belonging to the target month and year", () => {
      const month = new Date(2026, 2, 1); // March 2026
      const gapMarch15A: TeacherAvailabilityGapItem = {
        calendarDate: "2026-03-15",
        gapStartTime: "09:00",
        gapEndTime: "10:00",
      };
      const gapMarch15B: TeacherAvailabilityGapItem = {
        calendarDate: "2026-03-15",
        gapStartTime: "10:00",
        gapEndTime: "11:00",
      };
      const gapMarch20: TeacherAvailabilityGapItem = {
        calendarDate: "2026-03-20",
        gapStartTime: "13:00",
        gapEndTime: "14:00",
      };
      const gapApril1: TeacherAvailabilityGapItem = {
        calendarDate: "2026-04-01",
        gapStartTime: "09:00",
        gapEndTime: "10:00",
      };
      const gapMarch2025: TeacherAvailabilityGapItem = {
        calendarDate: "2025-03-15",
        gapStartTime: "09:00",
        gapEndTime: "10:00",
      };

      const grouped = groupGapsByDayOfMonth(
        [gapMarch15A, null, gapMarch15B, gapMarch20, gapApril1, gapMarch2025],
        month
      );

      expect(Object.keys(grouped)).toEqual(["15", "20"]);
      expect(grouped[15]).toEqual([gapMarch15A, gapMarch15B]);
      expect(grouped[20]).toEqual([gapMarch20]);
    });

    it("handles fallback date parsing if calendarDate format is non-standard", () => {
      const month = new Date(2026, 2, 1); // March 2026
      const nonStandardGap: TeacherAvailabilityGapItem = {
        calendarDate: "2026-03-15T00:00:00Z",
        gapStartTime: "09:00",
        gapEndTime: "10:00",
      };

      const grouped = groupGapsByDayOfMonth([nonStandardGap], month);
      expect(grouped[15]).toEqual([nonStandardGap]);
    });
  });

  describe("computeSearchScheduleResults", () => {
    it("handles null or undefined searchResult", () => {
      const res = computeSearchScheduleResults(null, "2026-03-01", "2026-03-03");
      expect(res.totalGaps).toBe(0);
      expect(res.activeTeachers).toEqual([]);
      expect(res.teacherSlots).toEqual([]);
    });

    it("computes active teachers and slots correctly", () => {
      const gap1: TeacherAvailabilityGapItem = {
        calendarDate: "2026-03-01",
        gapStartTime: "10:00",
        gapEndTime: "11:00",
      };
      const searchResult = {
        totalGaps: 5,
        teachers: [
          {
            teacherId: "t1",
            gaps: [gap1],
          },
          null,
        ],
      };

      const res = computeSearchScheduleResults(
        searchResult as unknown as Parameters<typeof computeSearchScheduleResults>[0],
        "2026-03-01",
        "2026-03-02"
      );

      expect(res.totalGaps).toBe(5);
      expect(res.activeTeachers.length).toBe(1);
      expect(res.teacherSlots.length).toBe(1);
      expect(res.teacherSlots[0].dateColumns).toEqual(["2026-03-01", "2026-03-02"]);
      expect(res.teacherSlots[0].gapsByDate.get("2026-03-01")).toEqual([gap1]);
    });
  });

  describe("helper functions", () => {
    it("buildDateColumns and getColumnCount", () => {
      expect(getColumnCount("2026-03-01", "2026-03-03")).toBe(3);
      expect(buildDateColumns("2026-03-01", "2026-03-03")).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
    });

    it("formatGapLabel", () => {
      const gap: TeacherAvailabilityGapItem = {
        gapStartTime: "10:00",
        gapEndTime: "11:00",
      };
      expect(formatGapLabel(gap)).toBe("10:00 - 11:00");
    });

    it("getSortLabelKey", () => {
      expect(getSortLabelKey(AvailabilitySearchSortBy.MostGaps)).toBe("mostGaps");
      expect(getSortLabelKey(AvailabilitySearchSortBy.NameAsc)).toBe("nameAsc");
      expect(getSortLabelKey(AvailabilitySearchSortBy.NameDesc)).toBe("nameDesc");
      expect(getSortLabelKey(AvailabilitySearchSortBy.TimezoneAsc)).toBe("timezoneAsc");
      expect(getSortLabelKey(AvailabilitySearchSortBy.MostAvailableDays)).toBe("mostAvailableDays");
    });

    it("shiftMonth", () => {
      const march = new Date(2026, 2, 1);
      const april = shiftMonth(march, 1);
      expect(april.getMonth()).toBe(3);

      const feb = shiftMonth(march, -1);
      expect(feb.getMonth()).toBe(1);
    });
  });
});
