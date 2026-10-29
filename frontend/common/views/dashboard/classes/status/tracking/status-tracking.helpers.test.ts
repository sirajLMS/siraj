import { describe, expect, it } from "bun:test";
import { ClassExecutionState, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
} from "./status-tracking.helpers";

describe("status-tracking.helpers", () => {
  describe("computeSessionStatus", () => {
    it("returns SUSPENDED_PENDING when student is frozen or suspended", () => {
      expect(computeSessionStatus(null, true, ClassExecutionState.Activated)).toBe(
        SessionStatus.SUSPENDED_PENDING
      );
      expect(computeSessionStatus(StudentStatus.Suspended, false, ClassExecutionState.Activated)).toBe(
        SessionStatus.SUSPENDED_PENDING
      );
    });

    it("returns ON_LEAVE when student is on leave", () => {
      expect(computeSessionStatus(StudentStatus.OnLeave, false, ClassExecutionState.Activated)).toBe(
        SessionStatus.ON_LEAVE
      );
    });

    it("returns PENDING_VERIFICATION when execution state is NotActivated", () => {
      expect(computeSessionStatus(StudentStatus.Active, false, ClassExecutionState.NotActivated)).toBe(
        SessionStatus.PENDING_VERIFICATION
      );
    });

    it("returns REGULAR for active student and activated execution state", () => {
      expect(computeSessionStatus(StudentStatus.Active, false, ClassExecutionState.Activated)).toBe(
        SessionStatus.REGULAR
      );
    });
  });

  describe("formatScheduleRange", () => {
    it("formats start and end ISO strings into time range", () => {
      const start = "2026-03-30T14:30:00.000Z";
      const end = "2026-03-30T15:30:00.000Z";
      const formatted = formatScheduleRange(start, end, "en");
      expect(formatted).toContain("-");
      expect(formatted.length).toBeGreaterThan(5);
    });

    it("handles empty or nullish start/end gracefully", () => {
      expect(formatScheduleRange(null, null, "en")).toBe(" - ");
      expect(formatScheduleRange("invalid-date", null, "en")).toBe(" - ");
    });
  });
});
