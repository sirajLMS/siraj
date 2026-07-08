const ClassOutcomeValues = {
  PENDING: "PENDING",
  TAKEN: "TAKEN",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
} as const;

const ClassExecutionStateValues = {
  NOT_ACTIVATED: "NOT_ACTIVATED",
  ACTIVATED: "ACTIVATED",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
} as const;

export interface TeacherScheduleSessionActionInput {
  readonly executionState?: string | null | undefined;
  readonly outcome?: string | null | undefined;
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
  const executionState = (input.executionState ?? ClassExecutionStateValues.NOT_ACTIVATED) as string;
  const outcome = (input.outcome ?? ClassOutcomeValues.PENDING) as string;
  const none = { activate: false, start: false, markAbsent: false, requestLeave: false, joinVideo: false };

  if (executionState === ClassExecutionStateValues.COMPLETED) {
    return { ...none, joinVideo: input.videoEnabled };
  }

  if (executionState === ClassExecutionStateValues.NOT_ACTIVATED && outcome !== ClassOutcomeValues.PENDING) {
    return none;
  }

  if (executionState === ClassExecutionStateValues.NOT_ACTIVATED) {
    return {
      ...none,
      activate: input.canActivate && !input.isConnecting,
      joinVideo: true,
    };
  }

  if (executionState === ClassExecutionStateValues.ACTIVATED) {
    return {
      activate: false,
      start: true,
      markAbsent: true,
      requestLeave: true,
      joinVideo: true,
    };
  }

  if (executionState === ClassExecutionStateValues.RUNNING) {
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
