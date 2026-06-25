import { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";

export function resolveScheduleInstanceDisplayStatus(
  outcome: ClassOutcome | null | undefined,
  executionState: ClassExecutionState | null | undefined
): ClassOutcome | ClassExecutionState {
  if (executionState && executionState !== ClassExecutionState.NotActivated) {
    return executionState;
  }
  return outcome ?? ClassOutcome.Pending;
}
