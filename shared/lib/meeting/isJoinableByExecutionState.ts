function isJoinableByExecutionState(executionState?: string | null, outcome?: string | null): boolean {
  if (executionState) {
    const normalized = executionState.toUpperCase();
    if (normalized === "COMPLETED") {
      return false;
    }
  }

  if (outcome) {
    const normalizedOutcome = outcome.toUpperCase();
    if (normalizedOutcome === "ABSENT" || normalizedOutcome === "LEAVE") {
      return false;
    }
  }

  return true;
}

export function isJoinableClassInstance(
  executionState?: string | null,
  outcome?: string | null,
  options?: { readonly isFrozen?: boolean }
): boolean {
  if (options?.isFrozen) {
    return false;
  }
  return isJoinableByExecutionState(executionState, outcome);
}

export function isFutureClassJoinable(item: {
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly leaveRequestDisabled?: boolean | null;
  readonly leaveRequestDisabledReason?: string | null;
}): boolean {
  if (item.leaveRequestDisabled && item.leaveRequestDisabledReason === "time") {
    return false;
  }
  return isJoinableByExecutionState(item.executionState, item.outcome);
}
