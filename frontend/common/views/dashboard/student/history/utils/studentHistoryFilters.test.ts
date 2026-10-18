import { describe, expect, it } from "bun:test";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  collectDaysWithSessions,
  filterHistorySessions,
  mapSessionsByDay,
  uniqueSessionStatuses,
  uniqueSessionSubjects,
} from "./studentHistoryFilters";

function createDummySession(overrides: Partial<StudentHistorySessionRow>): StudentHistorySessionRow {
  return {
    id: "session-1",
    title: "Math",
    time: "10:00 AM",
    duration: 60,
    status: "COMPLETED",
    outcome: "ATTENDED",
    isFrozen: false,
    instructor: "John Doe",
    teacherId: "teacher-1",
    timeSlot: "10:00 - 11:00",
    room: "Room A",
    notes: "",
    dayOfMonth: 15,
    meetingJoinUrl: null,
    effectiveMeeting: null,
    ...overrides,
  };
}

describe("studentHistoryFilters", () => {
  describe("mapSessionsByDay", () => {
    it("maps sessions by day of month, keeping the first session per day", () => {
      const s1 = createDummySession({ id: "1", dayOfMonth: 5, title: "Math" });
      const s2 = createDummySession({ id: "2", dayOfMonth: 5, title: "Physics" });
      const s3 = createDummySession({ id: "3", dayOfMonth: 12, title: "Chemistry" });
      const s0 = createDummySession({ id: "4", dayOfMonth: 0, title: "Invalid Day" });

      const mapped = mapSessionsByDay([s1, s2, s3, s0]);
      expect(mapped[5]).toEqual(s1);
      expect(mapped[12]).toEqual(s3);
      expect(mapped[0]).toBeUndefined();
    });
  });

  describe("collectDaysWithSessions", () => {
    it("collects unique positive days with sessions", () => {
      const s1 = createDummySession({ dayOfMonth: 5 });
      const s2 = createDummySession({ dayOfMonth: 5 });
      const s3 = createDummySession({ dayOfMonth: 20 });
      const s0 = createDummySession({ dayOfMonth: -1 });

      const days = collectDaysWithSessions([s1, s2, s3, s0]);
      expect(Array.from(days)).toEqual([5, 20]);
    });
  });

  describe("filterHistorySessions", () => {
    it("filters sessions by subject and status", () => {
      const s1 = createDummySession({ title: "Math", status: "COMPLETED" });
      const s2 = createDummySession({ title: "Math", status: "CANCELLED" });
      const s3 = createDummySession({ title: "Physics", status: "COMPLETED" });

      expect(filterHistorySessions([s1, s2, s3], "Math", "")).toEqual([s1, s2]);
      expect(filterHistorySessions([s1, s2, s3], "", "COMPLETED")).toEqual([s1, s3]);
      expect(filterHistorySessions([s1, s2, s3], "Math", "COMPLETED")).toEqual([s1]);
      expect(filterHistorySessions([s1, s2, s3], "", "")).toEqual([s1, s2, s3]);
    });
  });

  describe("uniqueSessionSubjects", () => {
    it("extracts sorted unique non-empty subject titles", () => {
      const s1 = createDummySession({ title: "Physics" });
      const s2 = createDummySession({ title: "Math" });
      const s3 = createDummySession({ title: "Physics" });
      const s4 = createDummySession({ title: "" });

      expect(uniqueSessionSubjects([s1, s2, s3, s4])).toEqual(["Math", "Physics"]);
    });
  });

  describe("uniqueSessionStatuses", () => {
    it("extracts sorted unique non-empty session statuses", () => {
      const s1 = createDummySession({ status: "SCHEDULED" });
      const s2 = createDummySession({ status: "CANCELLED" });
      const s3 = createDummySession({ status: "SCHEDULED" });
      const s4 = createDummySession({ status: "" });

      expect(uniqueSessionStatuses([s1, s2, s3, s4])).toEqual(["CANCELLED", "SCHEDULED"]);
    });
  });
});
