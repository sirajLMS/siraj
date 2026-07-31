import { TeacherProgressFeedEventKind } from "@/backend/enum";

type ClassStatusEventState = {
  executionState?: string;
  outcome?: string;
};

export function resolveTeacherProgressFeedEventKind(
  fromState: unknown,
  toState: unknown,
  actorUserId: string | null
): TeacherProgressFeedEventKind {
  const from = (fromState ?? {}) as ClassStatusEventState;
  const to = (toState ?? {}) as ClassStatusEventState;

  if (to.executionState === "COMPLETED" && to.outcome === "ABSENT") {
    if (from.executionState === "NOT_ACTIVATED" && actorUserId === null) {
      return TeacherProgressFeedEventKind.AUTO_MISSED;
    }
    return TeacherProgressFeedEventKind.MARKED_ABSENT;
  }
  if (to.executionState === "ACTIVATED") {
    return TeacherProgressFeedEventKind.ACTIVATED;
  }
  if (to.executionState === "RUNNING") {
    return TeacherProgressFeedEventKind.STARTED;
  }
  if (to.executionState === "COMPLETED" && to.outcome === "TAKEN") {
    return TeacherProgressFeedEventKind.COMPLETED;
  }
  if (to.executionState === "COMPLETED" && to.outcome === "LEAVE") {
    return TeacherProgressFeedEventKind.LEAVE;
  }
  return TeacherProgressFeedEventKind.OTHER;
}
