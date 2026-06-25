"use client";

import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import { resolveScheduleInstanceDisplayStatus } from "@/frontend/views/dashboard/dashboard/utils/scheduleInstanceStatus";

interface ScheduleInstanceStatusBadgeProps {
  readonly outcome: ClassOutcome | null | undefined;
  readonly executionState: ClassExecutionState | null | undefined;
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly size?: "small" | "medium";
}

export function ScheduleInstanceStatusBadge({
  outcome,
  executionState,
  statusLabels,
  size = "small",
}: ScheduleInstanceStatusBadgeProps) {
  const displayStatus = resolveScheduleInstanceDisplayStatus(outcome, executionState);

  return (
    <StatusBadge category="classInstance" status={displayStatus} label={statusLabels[displayStatus]} size={size} />
  );
}
