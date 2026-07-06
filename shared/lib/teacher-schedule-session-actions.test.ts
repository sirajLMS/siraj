import { describe, expect, test } from "bun:test";
import { ClassExecutionState, ClassOutcome } from "@/shared/lib/enum";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/teacher-schedule-session-actions";

const baseInput = {
  activateEnabled: true,
  canActivate: true,
  videoEnabled: true,
  isConnecting: false,
};

describe("resolveTeacherScheduleSessionActions", () => {
  test("NOT_ACTIVATED + PENDING inside window exposes activate and join video", () => {
    expect(
      resolveTeacherScheduleSessionActions({
        ...baseInput,
        executionState: ClassExecutionState.NOT_ACTIVATED,
        outcome: ClassOutcome.PENDING,
      })
    ).toEqual({
      activate: true,
      start: false,
      markAbsent: false,
      requestLeave: false,
      joinVideo: true,
    });
  });

  test("NOT_ACTIVATED + PENDING outside window still shows activate and join video", () => {
    expect(
      resolveTeacherScheduleSessionActions({
        ...baseInput,
        activateEnabled: false,
        executionState: ClassExecutionState.NOT_ACTIVATED,
        outcome: ClassOutcome.PENDING,
      })
    ).toEqual({
      activate: true,
      start: false,
      markAbsent: false,
      requestLeave: false,
      joinVideo: true,
    });
  });

  test("ACTIVATED exposes start, absent, leave, and join video", () => {
    expect(
      resolveTeacherScheduleSessionActions({
        ...baseInput,
        executionState: ClassExecutionState.ACTIVATED,
        outcome: ClassOutcome.PENDING,
      })
    ).toEqual({
      activate: false,
      start: true,
      markAbsent: true,
      requestLeave: true,
      joinVideo: true,
    });
  });

  test("RUNNING exposes absent and leave only", () => {
    expect(
      resolveTeacherScheduleSessionActions({
        ...baseInput,
        executionState: ClassExecutionState.RUNNING,
        outcome: ClassOutcome.PENDING,
      })
    ).toEqual({
      activate: false,
      start: false,
      markAbsent: true,
      requestLeave: true,
      joinVideo: true,
    });
  });

  test("COMPLETED exposes join video only when available", () => {
    expect(
      resolveTeacherScheduleSessionActions({
        ...baseInput,
        executionState: ClassExecutionState.COMPLETED,
        outcome: ClassOutcome.TAKEN,
      })
    ).toEqual({
      activate: false,
      start: false,
      markAbsent: false,
      requestLeave: false,
      joinVideo: true,
    });
  });

  test("terminal NOT_ACTIVATED outcomes expose no controls", () => {
    expect(
      resolveTeacherScheduleSessionActions({
        ...baseInput,
        executionState: ClassExecutionState.NOT_ACTIVATED,
        outcome: ClassOutcome.ABSENT,
      })
    ).toEqual({
      activate: false,
      start: false,
      markAbsent: false,
      requestLeave: false,
      joinVideo: false,
    });
  });
});
