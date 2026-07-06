"use client";

import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import { resolveScheduleInstanceDisplayStatus } from "@/frontend/views/dashboard/dashboard/utils/scheduleInstanceStatus";

interface ScheduleInstanceStatusBadgeProps {
  readonly outcome: ClassOutcome | null | undefined;
  readonly executionState: ClassExecutionState | null | undefined;
  readonly scheduledEndAt?: Date | string | null;
  readonly scheduledStartAt?: Date | string | null;
  readonly durationMinutes?: number | null;
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly size?: "small" | "medium";
}

export function ScheduleInstanceStatusBadge({
  outcome,
  executionState,
  scheduledEndAt,
  scheduledStartAt,
  durationMinutes,
  statusLabels,
  size = "small",
}: ScheduleInstanceStatusBadgeProps) {
  const displayStatus = resolveScheduleInstanceDisplayStatus(outcome, executionState, undefined, undefined, {
    scheduledEndAt,
    scheduledStartAt,
    durationMinutes,
  });

  return (
    <StatusBadge category="classInstance" status={displayStatus} label={statusLabels[displayStatus]} size={size} />
  );
}
