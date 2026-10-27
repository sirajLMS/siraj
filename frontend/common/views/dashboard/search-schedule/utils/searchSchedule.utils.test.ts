import { describe, expect, it } from "bun:test";
import { AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SearchScheduleGapItem } from "@/frontend/common/stores/searchScheduleStore";
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

const makeGap = (calendarDate: string, gapStartTime: string, gapEndTime: string): TeacherAvailabilityGapItem => ({
  calendarDate,
  gapStartTime,
  gapEndTime,
});

const makeScheduleGap = (calendarDate: string, gapStartTime: string, gapEndTime: string): SearchScheduleGapItem => ({
  id: null,
  teacherId: null,
  teacherName: null,
  teacherGender: null,
  dayOfWeek: null,
  timezone: null,
  calendarDate,
  gapStartTime,
  gapEndTime,
});

const MARCH_2026 = new Date(2026, 2, 1);

describe("searchSchedule.utils", () => {
  describe("groupGapsByDate", () => {
    it("returns an empty map for null, undefined, or empty input", () => {
      expect(groupGapsByDate(null).size).toBe(0);
      expect(groupGapsByDate(undefined).size).toBe(0);
      expect(groupGapsByDate([]).size).toBe(0);
    });

    it("groups gaps by calendarDate, skipping null entries", () => {
      const gap1 = makeGap("2026-03-15", "09:00", "10:00");
      const gap2 = makeGap("2026-03-15", "11:00", "12:00");
      const gap3 = makeGap("2026-03-16", "14:00", "15:00");

      const result = groupGapsByDate([gap1, null, gap2, gap3]);

      expect(result.size).toBe(2);
      expect(result.get("2026-03-15")).toEqual([gap1, gap2]);
      expect(result.get("2026-03-16")).toEqual([gap3]);
    });

    it("skips gaps without calendarDate", () => {
      const result = groupGapsByDate([makeGap("", "09:00", "10:00"), null]);
      expect(result.size).toBe(0);
    });
  });

  describe("groupGapsByDayOfMonth", () => {
    it("returns an empty record for null, undefined, or empty input", () => {
      expect(groupGapsByDayOfMonth(null, MARCH_2026)).toEqual({});
      expect(groupGapsByDayOfMonth(undefined, MARCH_2026)).toEqual({});
      expect(groupGapsByDayOfMonth([], MARCH_2026)).toEqual({});
    });

    it("keeps only gaps inside the target month and year", () => {
      const gapMarch15A = makeGap("2026-03-15", "09:00", "10:00");
      const gapMarch15B = makeGap("2026-03-15", "10:00", "11:00");
      const gapMarch20 = makeGap("2026-03-20", "13:00", "14:00");
      const gapApril = makeGap("2026-04-01", "09:00", "10:00");
      const gap2025 = makeGap("2025-03-15", "09:00", "10:00");

      const grouped = groupGapsByDayOfMonth(
        [gapMarch15A, null, gapMarch15B, gapMarch20, gapApril, gap2025],
        MARCH_2026
      );

      expect(Object.keys(grouped)).toEqual(["15", "20"]);
      expect(grouped[15]).toEqual([gapMarch15A, gapMarch15B]);
      expect(grouped[20]).toEqual([gapMarch20]);
    });

    it("skips non-ISO calendarDate formats", () => {
      const grouped = groupGapsByDayOfMonth([makeGap("2026-03-15T00:00:00Z", "09:00", "10:00")], MARCH_2026);
      expect(grouped).toEqual({});
    });
  });

  describe("computeSearchScheduleResults", () => {
    it("returns empty results for null or undefined searchResult", () => {
      const res = computeSearchScheduleResults(null, "2026-03-01", "2026-03-03");
      expect(res.totalGaps).toBe(0);
      expect(res.activeTeachers).toEqual([]);
      expect(res.teacherSlots).toEqual([]);
    });

    it("builds teacher slots from active teachers with gaps grouped by date", () => {
      const gap1 = makeScheduleGap("2026-03-01", "10:00", "11:00");
      const searchResult = {
        totalGaps: 5,
        teachers: [{ gaps: [gap1] }, null],
      };

      const res = computeSearchScheduleResults(searchResult, "2026-03-01", "2026-03-02");

      expect(res.totalGaps).toBe(5);
      expect(res.activeTeachers).toHaveLength(1);
      expect(res.teacherSlots).toHaveLength(1);
      expect(res.teacherSlots[0]?.dateColumns).toEqual(["2026-03-01", "2026-03-02"]);
      expect(res.teacherSlots[0]?.gapsByDate.get("2026-03-01")).toEqual([gap1]);
    });
  });

  describe("helpers", () => {
    it("buildDateColumns and getColumnCount", () => {
      expect(getColumnCount("2026-03-01", "2026-03-03")).toBe(3);
      expect(buildDateColumns("2026-03-01", "2026-03-03")).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
    });

    it("formatGapLabel", () => {
      expect(formatGapLabel(makeGap("", "10:00", "11:00"))).toBe("10:00 - 11:00");
    });

    it("getSortLabelKey", () => {
      expect(getSortLabelKey(AvailabilitySearchSortBy.MostGaps)).toBe("mostGaps");
      expect(getSortLabelKey(AvailabilitySearchSortBy.NameAsc)).toBe("nameAsc");
      expect(getSortLabelKey(AvailabilitySearchSortBy.NameDesc)).toBe("nameDesc");
      expect(getSortLabelKey(AvailabilitySearchSortBy.TimezoneAsc)).toBe("timezoneAsc");
      expect(getSortLabelKey(AvailabilitySearchSortBy.MostAvailableDays)).toBe("mostAvailableDays");
    });

    it("shiftMonth", () => {
      expect(shiftMonth(MARCH_2026, 1).getMonth()).toBe(3);
      expect(shiftMonth(MARCH_2026, -1).getMonth()).toBe(1);
    });
  });
});
