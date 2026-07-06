import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import { resolveClassInstanceDashboardStatus } from "@/shared/lib/schedule-instance-dashboard-status";

export type ScheduleInstanceDisplayStatus = ClassOutcome | ClassExecutionState;

export function resolveScheduleInstanceDisplayStatus(
  outcome: ClassOutcome | null | undefined,
  executionState: ClassExecutionState | null | undefined,
  actualStartAt?: Date | string | null,
  actualEndAt?: Date | string | null
): ScheduleInstanceDisplayStatus {
  return resolveClassInstanceDashboardStatus(
    outcome,
    executionState,
    actualStartAt,
    actualEndAt
  ) as unknown as ScheduleInstanceDisplayStatus;
}
