import type * as Types from "@/backend/types";

type ClassStatusEventState = {
  executionState?: string;
  outcome?: string;
};

export function resolveTeacherProgressFeedEventKind(
  fromState: unknown,
  toState: unknown,
  actorUserId: string | null
): Types.TeacherProgressFeedEventKind {
  const from = (fromState ?? {}) as ClassStatusEventState;
  const to = (toState ?? {}) as ClassStatusEventState;

  if (to.executionState === "COMPLETED" && to.outcome === "ABSENT") {
    if (from.executionState === "NOT_ACTIVATED" && actorUserId === null) {
      return "auto_missed";
    }
    return "marked_absent";
  }
  if (to.executionState === "ACTIVATED") {
    return "activated";
  }
  if (to.executionState === "RUNNING") {
    return "started";
  }
  if (to.executionState === "COMPLETED" && to.outcome === "TAKEN") {
    return "completed";
  }
  if (to.executionState === "COMPLETED" && to.outcome === "LEAVE") {
    return "leave";
  }
  return "other";
}
