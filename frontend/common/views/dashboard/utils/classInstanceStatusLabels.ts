import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AdminDashboardLabels } from "@/shared/locale";

export function buildClassInstanceStatusLabels(
  t: AdminDashboardLabels["statusLabels"]
): Record<ClassOutcome | ClassExecutionState, string> {
  return {
    [ClassOutcome.Pending]: t.PENDING,
    [ClassOutcome.Taken]: t.TAKEN,
    [ClassOutcome.Absent]: t.ABSENT,
    [ClassOutcome.Leave]: t.LEAVE,
    [ClassExecutionState.NotActivated]: t.NOT_ACTIVATED,
    [ClassExecutionState.Activated]: t.ACTIVATED,
    [ClassExecutionState.Running]: t.RUNNING,
    [ClassExecutionState.Completed]: t.COMPLETED,
    [ClassExecutionState.OnDemandConflictHeld]: t.ON_DEMAND_CONFLICT_HELD,
    [ClassExecutionState.OnDemandNoCreditsAbsent]: t.ON_DEMAND_NO_CREDITS_ABSENT,
    [ClassExecutionState.OnDemandNoCreditsCancelled]: t.ON_DEMAND_NO_CREDITS_CANCELLED,
    [ClassExecutionState.OnDemandPendingCredits]: t.ON_DEMAND_PENDING_CREDITS,
  };
}
