import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  type ClassInstanceStatusResolveOptions,
  DEFAULT_MISSED_GRACE_MINUTES,
  resolveClassInstanceDashboardStatus,
} from "@/shared/lib/schedule/schedule-instance-dashboard-status";

export type ScheduleInstanceDisplayStatus = ClassOutcome | ClassExecutionState;

type DateStringNullable = Date | string | null;

export interface ScheduleInstanceDisplayInput {
  readonly outcome: ClassOutcome | null | undefined;
  readonly executionState: ClassExecutionState | null | undefined;
  readonly actualStartAt?: DateStringNullable;
  readonly actualEndAt?: DateStringNullable;
  readonly scheduledEndAt?: DateStringNullable;
  readonly scheduledStartAt?: DateStringNullable;
  readonly durationMinutes?: number | null;
}

function resolveScheduledEndAt(input: ScheduleInstanceDisplayInput): DateStringNullable | undefined {
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
  actualStartAt?: DateStringNullable,
  actualEndAt?: DateStringNullable,
  options?: ClassInstanceStatusResolveOptions & {
    scheduledEndAt?: DateStringNullable;
    scheduledStartAt?: DateStringNullable;
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
