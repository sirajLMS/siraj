import { describe, expect, test } from "bun:test";
import { ClassExecutionState, ClassOutcome } from "@/backend/enum";
import type {
  TeacherScheduleSessionActionInput,
  TeacherScheduleSessionActions,
} from "@/shared/lib/teacher-schedule-session-actions";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/teacher-schedule-session-actions";

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
  test("NOT_ACTIVATED + PENDING inside window exposes activate and join video", () => {
    expectActions(
      { executionState: ClassExecutionState.NOT_ACTIVATED, outcome: ClassOutcome.PENDING },
      { activate: true, start: false, markAbsent: false, requestLeave: false, joinVideo: true }
    );
  });

  test("NOT_ACTIVATED + PENDING outside window still shows activate and join video", () => {
    expectActions(
      {
        activateEnabled: false,
        executionState: ClassExecutionState.NOT_ACTIVATED,
        outcome: ClassOutcome.PENDING,
      },
      { activate: true, start: false, markAbsent: false, requestLeave: false, joinVideo: true }
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
