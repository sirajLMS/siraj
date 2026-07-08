import { ClassExecutionState, ClassOutcome } from "@/shared/lib/enum";

export interface TeacherScheduleSessionActionInput {
  readonly executionState?: ClassExecutionState | string | null | undefined;
  readonly outcome?: ClassOutcome | string | null | undefined;
  readonly activateEnabled: boolean;
  readonly canActivate: boolean;
  readonly videoEnabled: boolean;
  readonly isConnecting?: boolean;
}

export interface TeacherScheduleSessionActions {
  readonly activate: boolean;
  readonly start: boolean;
  readonly markAbsent: boolean;
  readonly requestLeave: boolean;
  readonly joinVideo: boolean;
}

/**
 * Resolves which teacher schedule row controls are available based on the
 * class instance execution state machine and activation switching rules.
 *
 * NOT_ACTIVATED + PENDING → activate control (disabled outside time window), join video
 * ACTIVATED → start, mark absent, request leave
 * RUNNING → mark absent, request leave (start already applied)
 * COMPLETED / terminal outcomes → no session controls (join video if available)
 */
export function resolveTeacherScheduleSessionActions(
  input: TeacherScheduleSessionActionInput
): TeacherScheduleSessionActions {
  const executionState = (input.executionState ?? ClassExecutionState.NOT_ACTIVATED) as ClassExecutionState;
  const outcome = (input.outcome ?? ClassOutcome.PENDING) as ClassOutcome;
  const none = { activate: false, start: false, markAbsent: false, requestLeave: false, joinVideo: false };

  if (executionState === ClassExecutionState.COMPLETED) {
    return { ...none, joinVideo: input.videoEnabled };
  }

  if (executionState === ClassExecutionState.NOT_ACTIVATED && outcome !== ClassOutcome.PENDING) {
    return none;
  }

  if (executionState === ClassExecutionState.NOT_ACTIVATED) {
    return {
      ...none,
      activate: input.canActivate && !input.isConnecting,
      joinVideo: true,
    };
  }

  if (executionState === ClassExecutionState.ACTIVATED) {
    return {
      activate: false,
      start: true,
      markAbsent: true,
      requestLeave: true,
      joinVideo: true,
    };
  }

  if (executionState === ClassExecutionState.RUNNING) {
    return {
      activate: false,
      start: false,
      markAbsent: true,
      requestLeave: true,
      joinVideo: true,
    };
  }

  return none;
}
