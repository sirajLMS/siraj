import { describe, expect, test } from "bun:test";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import type {
  TeacherScheduleSessionActionInput,
  TeacherScheduleSessionActions,
} from "@/shared/lib/schedule/teacher-schedule-session-actions";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

const baseInput = {
  activateEnabled: true,
  canActivate: true,
  videoEnabled: true,
  isConnecting: false,
};

function expectActions(
  overrides: Partial<TeacherScheduleSessionActionInput>,
  expected: TeacherScheduleSessionActions
): void {
  expect(resolveTeacherScheduleSessionActions({ ...baseInput, ...overrides })).toEqual(expected);
}

describe("resolveTeacherScheduleSessionActions", () => {
  const pendingActivateActions: TeacherScheduleSessionActions = {
    activate: true,
    start: false,
    markAbsent: false,
    requestLeave: false,
    joinVideo: true,
  };

  test.each([
    ["inside window", {}],
    ["outside window", { activateEnabled: false }],
  ])("NOT_ACTIVATED + PENDING %s exposes activate and join video", (_label, overrides) => {
    expectActions(
      { executionState: ClassExecutionState.NOT_ACTIVATED, outcome: ClassOutcome.PENDING, ...overrides },
      pendingActivateActions
    );
  });

  test("ACTIVATED exposes start, absent, leave, and join video", () => {
    expectActions(
      { executionState: ClassExecutionState.ACTIVATED, outcome: ClassOutcome.PENDING },
      { activate: false, start: true, markAbsent: true, requestLeave: true, joinVideo: true }
    );
  });

  test("RUNNING exposes absent and leave only", () => {
    expectActions(
      { executionState: ClassExecutionState.RUNNING, outcome: ClassOutcome.PENDING },
      { activate: false, start: false, markAbsent: true, requestLeave: true, joinVideo: true }
    );
  });

  test("COMPLETED exposes join video only when available", () => {
    expectActions(
      { executionState: ClassExecutionState.COMPLETED, outcome: ClassOutcome.TAKEN },
      { activate: false, start: false, markAbsent: false, requestLeave: false, joinVideo: true }
    );
  });

  test("terminal NOT_ACTIVATED outcomes expose no controls", () => {
    expectActions(
      { executionState: ClassExecutionState.NOT_ACTIVATED, outcome: ClassOutcome.ABSENT },
      { activate: false, start: false, markAbsent: false, requestLeave: false, joinVideo: false }
    );
  });
});
