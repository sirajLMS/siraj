import { describe, expect, test } from "bun:test";
import {
  ClassExecutionState,
  StudentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
} from "./status-tracking.helpers";

describe("status-tracking.helpers", () => {
  describe("computeSessionStatus", () => {
    test("returns SUSPENDED_PENDING when isFrozen is true", () => {
      expect(
        computeSessionStatus(
          StudentStatus.Regular,
          true,
          ClassExecutionState.Active,
        ),
      ).toBe(SessionStatus.SUSPENDED_PENDING);
    });

    test("returns SUSPENDED_PENDING when studentStatus is Suspended", () => {
      expect(
        computeSessionStatus(
          StudentStatus.Suspended,
          false,
          ClassExecutionState.Active,
        ),
      ).toBe(SessionStatus.SUSPENDED_PENDING);
    });

    test("returns ON_LEAVE when studentStatus is OnLeave and not frozen", () => {
      expect(
        computeSessionStatus(
          StudentStatus.OnLeave,
          false,
          ClassExecutionState.Active,
        ),
      ).toBe(SessionStatus.ON_LEAVE);
    });

    test("returns PENDING_VERIFICATION when executionState is NotActivated", () => {
      expect(
        computeSessionStatus(
          StudentStatus.Regular,
          false,
          ClassExecutionState.NotActivated,
        ),
      ).toBe(SessionStatus.PENDING_VERIFICATION);
    });

    test("returns REGULAR for active regular students", () => {
      expect(
        computeSessionStatus(
          StudentStatus.Regular,
          false,
          ClassExecutionState.Active,
        ),
      ).toBe(SessionStatus.REGULAR);
    });
  });

  describe("formatScheduleRange", () => {
    test("formats valid timestamps in English locale", () => {
      const start = "2026-03-30T10:00:00.000Z";
      const end = "2026-03-30T11:00:00.000Z";
      const formatted = formatScheduleRange(start, end, "en");
      expect(formatted).toBe("10:00 AM - 11:00 AM");
    });

    test("formats valid timestamps in Arabic locale with Latin numerals", () => {
      const start = "2026-03-30T10:00:00.000Z";
      const end = "2026-03-30T11:00:00.000Z";
      const formatted = formatScheduleRange(start, end, "ar");
      expect(formatted).toBe("10:00 ص - 11:00 ص");
    });

    test("handles null or empty timestamps gracefully", () => {
      expect(formatScheduleRange(null, null, "en")).toBe(" - ");
      expect(formatScheduleRange("", "", "en")).toBe(" - ");
      expect(formatScheduleRange("2026-03-30T10:00:00.000Z", null, "en")).toBe(
        "10:00 AM - ",
      );
      expect(formatScheduleRange(null, "2026-03-30T11:00:00.000Z", "en")).toBe(
        " - 11:00 AM",
      );
    });

    test("handles invalid date strings gracefully", () => {
      expect(formatScheduleRange("invalid", "invalid", "en")).toBe(
        "Invalid Date - Invalid Date",
      );
    });
  });
});
