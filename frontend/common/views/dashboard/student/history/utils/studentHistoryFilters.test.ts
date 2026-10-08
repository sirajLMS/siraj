import { describe, expect, it } from "bun:test";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  collectDaysWithSessions,
  filterHistorySessions,
  mapSessionsByDay,
  uniqueSessionStatuses,
  uniqueSessionSubjects,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistoryFilters";

const makeSession = (partial: Partial<StudentHistorySessionRow>): StudentHistorySessionRow => ({
  id: "session-1",
  title: "Math",
  status: "COMPLETED",
  dayOfMonth: 15,
  dateStr: "2026-03-15",
  timeRange: "10:00 AM - 11:00 AM",
  teacherName: "John Doe",
  meetingUrl: null,
  meetingProvider: null,
  ...partial,
});

describe("studentHistoryFilters", () => {
  describe("mapSessionsByDay", () => {
    it("maps first session encountered per day of month", () => {
      const s1 = makeSession({ id: "s1", dayOfMonth: 5, title: "Math" });
      const s2 = makeSession({ id: "s2", dayOfMonth: 5, title: "Physics" });
      const s3 = makeSession({ id: "s3", dayOfMonth: 10, title: "Chemistry" });

      const mapped = mapSessionsByDay([s1, s2, s3]);
      expect(mapped[5]).toEqual(s1);
      expect(mapped[10]).toEqual(s3);
      expect(mapped[15]).toBeUndefined();
    });

    it("ignores sessions with non-positive dayOfMonth", () => {
      const s1 = makeSession({ id: "s1", dayOfMonth: 0 });
      const mapped = mapSessionsByDay([s1]);
      expect(Object.keys(mapped)).toHaveLength(0);
    });
  });

  describe("collectDaysWithSessions", () => {
    it("collects unique positive days of month", () => {
      const s1 = makeSession({ dayOfMonth: 5 });
      const s2 = makeSession({ dayOfMonth: 5 });
      const s3 = makeSession({ dayOfMonth: 20 });
      const s4 = makeSession({ dayOfMonth: 0 });

      const days = collectDaysWithSessions([s1, s2, s3, s4]);
      expect(Array.from(days).sort((a, b) => a - b)).toEqual([5, 20]);
    });
  });

  describe("filterHistorySessions", () => {
    it("filters sessions by subject and status", () => {
      const s1 = makeSession({ title: "Math", status: "COMPLETED" });
      const s2 = makeSession({ title: "Math", status: "CANCELLED" });
      const s3 = makeSession({ title: "Physics", status: "COMPLETED" });

      expect(filterHistorySessions([s1, s2, s3], "", "")).toEqual([s1, s2, s3]);
      expect(filterHistorySessions([s1, s2, s3], "Math", "")).toEqual([s1, s2]);
      expect(filterHistorySessions([s1, s2, s3], "", "COMPLETED")).toEqual([s1, s3]);
      expect(filterHistorySessions([s1, s2, s3], "Math", "COMPLETED")).toEqual([s1]);
    });
  });

  describe("uniqueSessionSubjects", () => {
    it("returns sorted unique non-falsy subject titles", () => {
      const sessions = [
        makeSession({ title: "Physics" }),
        makeSession({ title: "" }),
        makeSession({ title: "Biology" }),
        makeSession({ title: "Physics" }),
        makeSession({ title: "Algebra" }),
      ];

      expect(uniqueSessionSubjects(sessions)).toEqual(["Algebra", "Biology", "Physics"]);
    });
  });

  describe("uniqueSessionStatuses", () => {
    it("returns sorted unique non-falsy statuses", () => {
      const sessions = [
        makeSession({ status: "PENDING" }),
        makeSession({ status: "" }),
        makeSession({ status: "COMPLETED" }),
        makeSession({ status: "PENDING" }),
        makeSession({ status: "ABSENT" }),
      ];

      expect(uniqueSessionStatuses(sessions)).toEqual(["ABSENT", "COMPLETED", "PENDING"]);
    });
  });
});
