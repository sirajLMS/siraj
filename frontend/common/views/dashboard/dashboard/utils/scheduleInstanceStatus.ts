import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type ClassInstanceStatusResolveOptions,
  DEFAULT_MISSED_GRACE_MINUTES,
  resolveClassInstanceDashboardStatus,
} from "@/shared/lib/schedule/schedule-instance-dashboard-status";

export type ScheduleInstanceDisplayStatus = ClassOutcome | ClassExecutionState;

type DateStringNullable = Date | string | null;

const SCHEDULE_INSTANCE_DISPLAY_STATUS_VALUES: ReadonlySet<string> = new Set<string>([
  ...Object.values(ClassOutcome),
  ...Object.values(ClassExecutionState),
]);

function isScheduleInstanceDisplayStatus(value: string): value is ScheduleInstanceDisplayStatus {
  return SCHEDULE_INSTANCE_DISPLAY_STATUS_VALUES.has(value);
}

export interface ScheduleInstanceDisplayInput {
  readonly outcome: ClassOutcome | null | undefined;
  readonly executionState: ClassExecutionState | null | undefined;
  readonly actualStartAt?: DateStringNullable;
  readonly actualEndAt?: DateStringNullable;
  readonly scheduledEndAt?: DateStringNullable;
  readonly scheduledStartAt?: DateStringNullable;
  readonly durationMinutes?: number | null;
}

function resolveScheduledEndAt(input: ScheduleInstanceDisplayInput): Date | null {
  if (input.scheduledEndAt) {
    return input.scheduledEndAt instanceof Date ? input.scheduledEndAt : new Date(input.scheduledEndAt);
  }
  if (!input.scheduledStartAt || !input.durationMinutes) {
    return null;
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

  const result = resolveClassInstanceDashboardStatus(outcome, executionState, actualStartAt, actualEndAt, {
    scheduledEndAt,
    missedGraceMinutes: options?.missedGraceMinutes ?? DEFAULT_MISSED_GRACE_MINUTES,
    now: options?.now,
  });
  return isScheduleInstanceDisplayStatus(result) ? result : ClassOutcome.Pending;
}
