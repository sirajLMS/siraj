import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  DEFAULT_MISSED_GRACE_MINUTES,
  type ClassInstanceStatusResolveOptions,
  resolveClassInstanceDashboardStatus,
} from "@/shared/lib/schedule-instance-dashboard-status";

export type ScheduleInstanceDisplayStatus = ClassOutcome | ClassExecutionState;

export interface ScheduleInstanceDisplayInput {
  readonly outcome: ClassOutcome | null | undefined;
  readonly executionState: ClassExecutionState | null | undefined;
  readonly actualStartAt?: Date | string | null;
  readonly actualEndAt?: Date | string | null;
  readonly scheduledEndAt?: Date | string | null;
  readonly scheduledStartAt?: Date | string | null;
  readonly durationMinutes?: number | null;
}

function resolveScheduledEndAt(input: ScheduleInstanceDisplayInput): Date | string | null | undefined {
  if (input.scheduledEndAt) {
    return input.scheduledEndAt;
  }
  if (!input.scheduledStartAt || !input.durationMinutes) {
    return undefined;
  }
  const startAt = input.scheduledStartAt instanceof Date ? input.scheduledStartAt : new Date(input.scheduledStartAt);
  return new Date(startAt.getTime() + input.durationMinutes * 60_000);
}

export function resolveScheduleInstanceDisplayStatus(
  outcome: ClassOutcome | null | undefined,
  executionState: ClassExecutionState | null | undefined,
  actualStartAt?: Date | string | null,
  actualEndAt?: Date | string | null,
  options?: ClassInstanceStatusResolveOptions & {
    scheduledEndAt?: Date | string | null;
    scheduledStartAt?: Date | string | null;
    durationMinutes?: number | null;
  }
): ScheduleInstanceDisplayStatus {
  const scheduledEndAt = resolveScheduledEndAt({
    outcome,
    executionState,
    actualStartAt,
    actualEndAt,
    scheduledEndAt: options?.scheduledEndAt,
    scheduledStartAt: options?.scheduledStartAt,
    durationMinutes: options?.durationMinutes,
  });

  return resolveClassInstanceDashboardStatus(outcome, executionState, actualStartAt, actualEndAt, {
    scheduledEndAt,
    missedGraceMinutes: options?.missedGraceMinutes ?? DEFAULT_MISSED_GRACE_MINUTES,
    now: options?.now,
  }) as unknown as ScheduleInstanceDisplayStatus;
}
