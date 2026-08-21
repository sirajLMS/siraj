import { ClassExecutionState } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";

export const EXECUTION_STATE_TO_STATUS: Record<ClassExecutionState, ClassInstanceStatus> = {
  [ClassExecutionState.Activated]: "active",
  [ClassExecutionState.Running]: "active",
  [ClassExecutionState.Completed]: "completed",
  [ClassExecutionState.NotActivated]: "scheduled",
  [ClassExecutionState.OnDemandConflictHeld]: "pending",
  [ClassExecutionState.OnDemandNoCreditsAbsent]: "cancelled",
  [ClassExecutionState.OnDemandNoCreditsCancelled]: "cancelled",
  [ClassExecutionState.OnDemandPendingCredits]: "pending",
};
