import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export interface TeacherScheduleSessionActionInput {
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly activateEnabled: boolean;
  readonly canActivate: boolean;
  readonly videoEnabled: boolean;
  readonly isConnecting?: boolean;
  readonly isFrozen?: boolean | null;
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
 * COMPLETED / terminal outcomes → no session controls; join only when joinable by execution state
 */
export function resolveTeacherScheduleSessionActions(
  input: TeacherScheduleSessionActionInput
): TeacherScheduleSessionActions {
  const executionState = input.executionState ?? ClassExecutionState.NOT_ACTIVATED;
  const outcome = input.outcome ?? ClassOutcome.PENDING;
  const isFrozen = input.isFrozen === true;
  const none = { activate: false, start: false, markAbsent: false, requestLeave: false, joinVideo: false };
  const joinVideo = isJoinableClassInstance(executionState, outcome, { isFrozen });

  if (isFrozen) {
    return { ...none, joinVideo };
  }

  if (executionState === ClassExecutionState.COMPLETED) {
    return { ...none, joinVideo };
  }

  if (executionState === ClassExecutionState.NOT_ACTIVATED && outcome !== ClassOutcome.PENDING) {
    return none;
  }

  if (executionState === ClassExecutionState.NOT_ACTIVATED) {
    return {
      ...none,
      activate: input.canActivate && !input.isConnecting,
      joinVideo,
    };
  }

  if (executionState === ClassExecutionState.ACTIVATED) {
    return {
      activate: false,
      start: true,
      markAbsent: true,
      requestLeave: true,
      joinVideo,
    };
  }

  if (executionState === ClassExecutionState.RUNNING) {
    return {
      activate: false,
      start: false,
      markAbsent: true,
      requestLeave: true,
      joinVideo,
    };
  }

  return none;
}
