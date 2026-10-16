import { describe, expect, it } from "bun:test";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  collectDaysWithSessions,
  filterHistorySessions,
  mapSessionsByDay,
  uniqueSessionStatuses,
  uniqueSessionSubjects,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistoryFilters";

function mockSession(overrides: Partial<StudentHistorySessionRow>): StudentHistorySessionRow {
  return {
    id: "session-1",
    title: "Math",
    time: "10:00 AM",
    duration: 60,
    status: "COMPLETED",
    outcome: "ATTENDED",
    isFrozen: false,
    instructor: "Teacher John",
    teacherId: "teacher-1",
    timeSlot: "10:00 - 11:00",
    room: "Room 101",
    notes: "",
    dayOfMonth: 15,
    meetingJoinUrl: null,
    effectiveMeeting: null,
    ...overrides,
  };
}

describe("studentHistoryFilters", () => {
  describe("mapSessionsByDay", () => {
    it("maps sessions by positive dayOfMonth", () => {
      const s1 = mockSession({ id: "1", dayOfMonth: 5 });
      const s2 = mockSession({ id: "2", dayOfMonth: 12 });
      const result = mapSessionsByDay([s1, s2]);
      expect(result).toEqual({ 5: s1, 12: s2 });
    });

    it("ignores non-positive dayOfMonth", () => {
      const s1 = mockSession({ id: "1", dayOfMonth: 0 });
      const s2 = mockSession({ id: "2", dayOfMonth: -1 });
      const result = mapSessionsByDay([s1, s2]);
      expect(result).toEqual({});
    });

    it("keeps first session for duplicate dayOfMonth", () => {
      const s1 = mockSession({ id: "1", dayOfMonth: 5, title: "Math" });
      const s2 = mockSession({ id: "2", dayOfMonth: 5, title: "English" });
      const result = mapSessionsByDay([s1, s2]);
      expect(result[5]).toBe(s1);
    });
  });

  describe("collectDaysWithSessions", () => {
    it("returns unique set of positive days", () => {
      const s1 = mockSession({ dayOfMonth: 5 });
      const s2 = mockSession({ dayOfMonth: 5 });
      const s3 = mockSession({ dayOfMonth: 12 });
      const s4 = mockSession({ dayOfMonth: 0 });

      const days = collectDaysWithSessions([s1, s2, s3, s4]);
      expect(Array.from(days).sort((a, b) => a - b)).toEqual([5, 12]);
    });
  });

  describe("filterHistorySessions", () => {
    it("filters by subject and status", () => {
      const s1 = mockSession({ id: "1", title: "Math", status: "COMPLETED" });
      const s2 = mockSession({ id: "2", title: "English", status: "COMPLETED" });
      const s3 = mockSession({ id: "3", title: "Math", status: "SCHEDULED" });

      expect(filterHistorySessions([s1, s2, s3], "", "")).toEqual([s1, s2, s3]);
      expect(filterHistorySessions([s1, s2, s3], "Math", "")).toEqual([s1, s3]);
      expect(filterHistorySessions([s1, s2, s3], "", "COMPLETED")).toEqual([s1, s2]);
      expect(filterHistorySessions([s1, s2, s3], "Math", "COMPLETED")).toEqual([s1]);
    });
  });

  describe("uniqueSessionSubjects", () => {
    it("returns sorted unique non-empty subjects", () => {
      const sessions = [
        mockSession({ title: "Physics" }),
        mockSession({ title: "Algebra" }),
        mockSession({ title: "" }),
        mockSession({ title: "Algebra" }),
      ];

      expect(uniqueSessionSubjects(sessions)).toEqual(["Algebra", "Physics"]);
    });

    it("handles empty array", () => {
      expect(uniqueSessionSubjects([])).toEqual([]);
    });
  });

  describe("uniqueSessionStatuses", () => {
    it("returns sorted unique non-empty statuses", () => {
      const sessions = [
        mockSession({ status: "SCHEDULED" }),
        mockSession({ status: "COMPLETED" }),
        mockSession({ status: "" }),
        mockSession({ status: "COMPLETED" }),
      ];

      expect(uniqueSessionStatuses(sessions)).toEqual(["COMPLETED", "SCHEDULED"]);
    });

    it("handles empty array", () => {
      expect(uniqueSessionStatuses([])).toEqual([]);
    });
  });
});
