import { describe, expect, test } from "bun:test";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  collectDaysWithSessions,
  filterHistorySessions,
  mapSessionsByDay,
  uniqueSessionStatuses,
  uniqueSessionSubjects,
} from "./studentHistoryFilters";

function makeSession(
  overrides: Partial<StudentHistorySessionRow> = {}
): StudentHistorySessionRow {
  return {
    id: "session-1",
    title: "Mathematics",
    time: "2026-03-01T10:00:00Z",
    duration: 60,
    status: "COMPLETED",
    outcome: "PASS",
    isFrozen: false,
    instructor: "John Doe",
    teacherId: "teacher-1",
    timeSlot: "10:00 - 11:00",
    room: "Room A",
    notes: "Good session",
    dayOfMonth: 5,
    meetingJoinUrl: null,
    effectiveMeeting: null,
    ...overrides,
  };
}

describe("studentHistoryFilters", () => {
  describe("uniqueSessionSubjects", () => {
    test("returns sorted unique non-empty subject titles", () => {
      const sessions = [
        makeSession({ title: "Physics" }),
        makeSession({ title: "Mathematics" }),
        makeSession({ title: "Physics" }),
        makeSession({ title: "" }),
        makeSession({ title: "Chemistry" }),
      ];

      const subjects = uniqueSessionSubjects(sessions);
      expect(subjects).toEqual(["Chemistry", "Mathematics", "Physics"]);
    });

    test("returns empty array when sessions array is empty or contains no titles", () => {
      expect(uniqueSessionSubjects([])).toEqual([]);
      expect(uniqueSessionSubjects([makeSession({ title: "" })])).toEqual([]);
    });
  });

  describe("uniqueSessionStatuses", () => {
    test("returns sorted unique non-empty session statuses", () => {
      const sessions = [
        makeSession({ status: "SCHEDULED" }),
        makeSession({ status: "COMPLETED" }),
        makeSession({ status: "SCHEDULED" }),
        makeSession({ status: "" }),
        makeSession({ status: "MISSED" }),
      ];

      const statuses = uniqueSessionStatuses(sessions);
      expect(statuses).toEqual(["COMPLETED", "MISSED", "SCHEDULED"]);
    });

    test("returns empty array when sessions array is empty or contains no statuses", () => {
      expect(uniqueSessionStatuses([])).toEqual([]);
      expect(uniqueSessionStatuses([makeSession({ status: "" })])).toEqual([]);
    });
  });

  describe("mapSessionsByDay", () => {
    test("maps first session encountered per dayOfMonth (> 0)", () => {
      const s1 = makeSession({ id: "s1", dayOfMonth: 10, title: "Math" });
      const s2 = makeSession({ id: "s2", dayOfMonth: 10, title: "Physics" });
      const s3 = makeSession({ id: "s3", dayOfMonth: 0, title: "Invalid" });

      const mapped = mapSessionsByDay([s1, s2, s3]);
      expect(mapped[10]).toEqual(s1);
      expect(mapped[0]).toBeUndefined();
    });
  });

  describe("collectDaysWithSessions", () => {
    test("returns a set of unique positive days with sessions", () => {
      const sessions = [
        makeSession({ dayOfMonth: 1 }),
        makeSession({ dayOfMonth: 5 }),
        makeSession({ dayOfMonth: 1 }),
        makeSession({ dayOfMonth: 0 }),
      ];

      const days = collectDaysWithSessions(sessions);
      expect(Array.from(days).sort((a, b) => a - b)).toEqual([1, 5]);
    });
  });

  describe("filterHistorySessions", () => {
    test("filters sessions matching subject and status criteria", () => {
      const s1 = makeSession({ title: "Math", status: "COMPLETED" });
      const s2 = makeSession({ title: "Math", status: "MISSED" });
      const s3 = makeSession({ title: "Physics", status: "COMPLETED" });

      expect(filterHistorySessions([s1, s2, s3], "", "")).toEqual([s1, s2, s3]);
      expect(filterHistorySessions([s1, s2, s3], "Math", "")).toEqual([s1, s2]);
      expect(filterHistorySessions([s1, s2, s3], "", "COMPLETED")).toEqual([s1, s3]);
      expect(filterHistorySessions([s1, s2, s3], "Math", "COMPLETED")).toEqual([s1]);
    });
  });
});
