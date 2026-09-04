import { describe, expect, test } from "bun:test";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import {
  mapToSessionAuditStatus,
  type SessionAuditStatus,
  STATUS_TO_PREDICATE_KEY,
} from "@/shared/constants/classes/session-audit-status";

const joined = new Date("2028-01-01T10:00:00Z");
const joinedIso = joined.toISOString();

describe("mapToSessionAuditStatus", () => {
  describe("COMPLETED + TAKEN → end", () => {
    test("with actualStartAt set", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.TAKEN, joined)).toBe("end");
    });

    test("with actualStartAt null", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.TAKEN, null)).toBe("end");
    });
  });

  describe("COMPLETED + ABSENT", () => {
    test("actualStartAt null → Absent (teacher absence)", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.ABSENT, null)).toBe("Absent");
    });

    test("actualStartAt undefined → Absent (teacher absence)", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.ABSENT, undefined)).toBe("Absent");
    });

    test("actualStartAt set as Date → absent_student", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.ABSENT, joined)).toBe(
        "absent_student"
      );
    });

    test("actualStartAt set as ISO string → absent_student", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.ABSENT, joinedIso)).toBe(
        "absent_student"
      );
    });
  });

  describe("COMPLETED + LEAVE → absent_student", () => {
    test("with actualStartAt set", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.LEAVE, joined)).toBe("absent_student");
    });

    test("with actualStartAt null", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.LEAVE, null)).toBe("absent_student");
    });
  });

  describe("COMPLETED with unmatched outcome → open", () => {
    test("COMPLETED + PENDING → open", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, ClassOutcome.PENDING, joined)).toBe("open");
    });

    test("COMPLETED + null outcome → open", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, null, joined)).toBe("open");
    });
  });

  describe("non-COMPLETED states → open", () => {
    test("RUNNING with actualStartAt set → open", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.RUNNING, ClassOutcome.PENDING, joined)).toBe("open");
    });

    test("ACTIVATED with actualStartAt set → open", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.ACTIVATED, ClassOutcome.PENDING, joined)).toBe("open");
    });

    test("RUNNING with actualStartAt null → open", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.RUNNING, ClassOutcome.PENDING, null)).toBe("open");
    });

    test("ACTIVATED with actualStartAt null → open", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.ACTIVATED, ClassOutcome.PENDING, null)).toBe("open");
    });

    test("NOT_ACTIVATED → open", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.NOT_ACTIVATED, ClassOutcome.PENDING, null)).toBe("open");
    });
  });

  describe("ON_DEMAND variants → open", () => {
    const onDemandStates: ClassExecutionState[] = [
      ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
      ClassExecutionState.ON_DEMAND_CONFLICT_HELD,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
    ];

    test.each(onDemandStates)("%s with actualStartAt null → open", state => {
      expect(mapToSessionAuditStatus(state, ClassOutcome.PENDING, null)).toBe("open");
    });

    test.each(onDemandStates)("%s with actualStartAt set → open", state => {
      expect(mapToSessionAuditStatus(state, ClassOutcome.ABSENT, joined)).toBe("open");
    });
  });

  describe("defensive null/undefined inputs → open", () => {
    test("null executionState", () => {
      expect(mapToSessionAuditStatus(null, ClassOutcome.TAKEN, joined)).toBe("open");
    });

    test("undefined executionState", () => {
      expect(mapToSessionAuditStatus(undefined, ClassOutcome.TAKEN, joined)).toBe("open");
    });

    test("undefined outcome", () => {
      expect(mapToSessionAuditStatus(ClassExecutionState.COMPLETED, undefined, joined)).toBe("open");
    });

    test("all inputs nullish", () => {
      expect(mapToSessionAuditStatus(null, undefined, undefined)).toBe("open");
    });
  });
});

describe("STATUS_TO_PREDICATE_KEY", () => {
  const expectedStatuses: SessionAuditStatus[] = ["open", "end", "Absent", "absent_student"];

  test("has exactly one entry per SessionAuditStatus", () => {
    const keys = Object.keys(STATUS_TO_PREDICATE_KEY);
    expect(keys).toHaveLength(expectedStatuses.length);
    for (const status of expectedStatuses) {
      expect(keys).toContain(status);
    }
  });

  test.each(expectedStatuses)("%s maps to the predicate key of the same name", status => {
    expect(STATUS_TO_PREDICATE_KEY[status]).toBe(status);
  });
});
