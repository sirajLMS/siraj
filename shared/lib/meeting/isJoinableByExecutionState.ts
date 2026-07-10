import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

export function isJoinableByExecutionState(executionState?: string | null, outcome?: string | null): boolean {
  if (executionState) {
    const normalized = executionState.toUpperCase();
    if (normalized === ClassExecutionState.COMPLETED) {
      return false;
    }
  }

  if (outcome) {
    const normalizedOutcome = outcome.toUpperCase();
    if (normalizedOutcome === ClassOutcome.ABSENT || normalizedOutcome === ClassOutcome.LEAVE) {
      return false;
    }
  }

  return true;
}
