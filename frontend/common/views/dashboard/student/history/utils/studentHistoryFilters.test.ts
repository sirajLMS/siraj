import { describe, expect, it } from "bun:test";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  collectDaysWithSessions,
  filterHistorySessions,
  mapSessionsByDay,
  uniqueSessionStatuses,
  uniqueSessionSubjects,
} from "./studentHistoryFilters";

const mockSessions: StudentHistorySessionRow[] = [
  {
    id: "s1",
    title: "Mathematics",
    status: "COMPLETED",
    dayOfMonth: 5,
    formattedDate: "May 5",
    formattedTime: "10:00 AM",
    teacherName: "Teacher A",
  },
  {
    id: "s2",
    title: "Arabic",
    status: "CANCELLED",
    dayOfMonth: 12,
    formattedDate: "May 12",
    formattedTime: "11:00 AM",
    teacherName: "Teacher B",
  },
  {
    id: "s3",
    title: "Mathematics",
    status: "COMPLETED",
    dayOfMonth: 5, // duplicate day
    formattedDate: "May 5",
    formattedTime: "02:00 PM",
    teacherName: "Teacher A",
  },
  {
    id: "s4",
    title: "", // empty title
    status: "SCHEDULED",
    dayOfMonth: 0, // invalid day
    formattedDate: "May 0",
    formattedTime: "03:00 PM",
    teacherName: "Teacher C",
  },
];

describe("studentHistoryFilters", () => {
  describe("mapSessionsByDay", () => {
    it("maps sessions by dayOfMonth taking first occurrence for duplicate days", () => {
      const mapped = mapSessionsByDay(mockSessions);
      expect(mapped[5]).toEqual(mockSessions[0]);
      expect(mapped[12]).toEqual(mockSessions[1]);
      expect(mapped[0]).toBeUndefined();
    });

    it("returns empty object for empty sessions array", () => {
      expect(mapSessionsByDay([])).toEqual({});
    });
  });

  describe("collectDaysWithSessions", () => {
    it("collects unique positive days with sessions", () => {
      const days = collectDaysWithSessions(mockSessions);
      expect(days.has(5)).toBe(true);
      expect(days.has(12)).toBe(true);
      expect(days.has(0)).toBe(false);
      expect(days.size).toBe(2);
    });

    it("returns empty Set for empty sessions array", () => {
      expect(collectDaysWithSessions([]).size).toBe(0);
    });
  });

  describe("filterHistorySessions", () => {
    it("filters sessions by subject and status", () => {
      const filtered = filterHistorySessions(mockSessions, "Mathematics", "COMPLETED");
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe("s1");
      expect(filtered[1].id).toBe("s3");
    });

    it("returns all sessions when filters are empty strings", () => {
      const filtered = filterHistorySessions(mockSessions, "", "");
      expect(filtered).toHaveLength(4);
    });
  });

  describe("uniqueSessionSubjects", () => {
    it("returns sorted unique non-empty subject titles", () => {
      const subjects = uniqueSessionSubjects(mockSessions);
      expect(subjects).toEqual(["Arabic", "Mathematics"]);
    });

    it("returns empty array for empty sessions or sessions with no title", () => {
      expect(uniqueSessionSubjects([])).toEqual([]);
      expect(
        uniqueSessionSubjects([
          {
            id: "s_empty",
            title: "",
            status: "COMPLETED",
            dayOfMonth: 1,
            formattedDate: "May 1",
            formattedTime: "10:00 AM",
            teacherName: "Teacher A",
          },
        ])
      ).toEqual([]);
    });
  });

  describe("uniqueSessionStatuses", () => {
    it("returns sorted unique non-empty statuses", () => {
      const statuses = uniqueSessionStatuses(mockSessions);
      expect(statuses).toEqual(["CANCELLED", "COMPLETED", "SCHEDULED"]);
    });

    it("returns empty array for empty sessions or sessions with no status", () => {
      expect(uniqueSessionStatuses([])).toEqual([]);
    });
  });
});
