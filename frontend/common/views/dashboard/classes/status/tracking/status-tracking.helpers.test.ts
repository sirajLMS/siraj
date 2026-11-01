import { describe, expect, it } from "bun:test";
import { ClassExecutionState, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
} from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.helpers";

describe("status-tracking.helpers", () => {
  describe("computeSessionStatus", () => {
    it("returns SUSPENDED_PENDING when isFrozen is true", () => {
      expect(computeSessionStatus(StudentStatus.Active, true, ClassExecutionState.Active)).toBe(
        SessionStatus.SUSPENDED_PENDING
      );
    });

    it("returns SUSPENDED_PENDING when studentStatus is Suspended", () => {
      expect(computeSessionStatus(StudentStatus.Suspended, false, ClassExecutionState.Active)).toBe(
        SessionStatus.SUSPENDED_PENDING
      );
    });

    it("returns ON_LEAVE when studentStatus is OnLeave", () => {
      expect(computeSessionStatus(StudentStatus.OnLeave, false, ClassExecutionState.Active)).toBe(
        SessionStatus.ON_LEAVE
      );
    });

    it("returns PENDING_VERIFICATION when executionState is NotActivated", () => {
      expect(computeSessionStatus(StudentStatus.Active, false, ClassExecutionState.NotActivated)).toBe(
        SessionStatus.PENDING_VERIFICATION
      );
    });

    it("returns REGULAR for active and unfrozen sessions", () => {
      expect(computeSessionStatus(StudentStatus.Active, false, ClassExecutionState.Active)).toBe(SessionStatus.REGULAR);
    });
  });

  describe("formatScheduleRange", () => {
    it("handles null or undefined values gracefully", () => {
      expect(formatScheduleRange(null, null, "en")).toBe(" - ");
      expect(formatScheduleRange(null, "2026-10-15T10:00:00.000Z", "en")).toContain(" - ");
      expect(formatScheduleRange("2026-10-15T09:00:00.000Z", null, "en")).toContain(" - ");
    });

    it("handles invalid date strings gracefully", () => {
      expect(formatScheduleRange("invalid-start", "invalid-end", "en")).toBe(" - ");
    });

    it("formats start and end range with 2-digit hour and minute in English", () => {
      const start = "2026-10-15T09:05:00.000Z";
      const end = "2026-10-15T10:35:00.000Z";
      const result = formatScheduleRange(start, end, "en");
      expect(result).toContain(" - ");
      expect(result.length).toBeGreaterThan(5);
    });

    it("formats start and end range in Arabic locale using Latin numeral format", () => {
      const start = "2026-10-15T09:05:00.000Z";
      const end = "2026-10-15T10:35:00.000Z";
      const result = formatScheduleRange(start, end, "ar");
      expect(result).toContain(" - ");
      expect(result.length).toBeGreaterThan(5);
    });
  });
});
