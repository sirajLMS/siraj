import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type ClassInstanceStatusResolveOptions,
  DEFAULT_MISSED_GRACE_MINUTES,
  resolveClassInstanceDashboardStatus,
} from "@/shared/lib/schedule/schedule-instance-dashboard-status";

export type ScheduleInstanceDisplayStatus = ClassOutcome | ClassExecutionState;

const DISPLAY_STATUS_VALUES: ReadonlySet<string> = new Set<string>([
  ...(Object.values(ClassOutcome) as readonly string[]),
  ...(Object.values(ClassExecutionState) as readonly string[]),
]);

function isScheduleInstanceDisplayStatus(value: string): value is ScheduleInstanceDisplayStatus {
  return DISPLAY_STATUS_VALUES.has(value);
}

type DateLike = Date | string | null;

export interface ScheduleInstanceDisplayInput {
  readonly outcome: ClassOutcome | null | undefined;
  readonly executionState: ClassExecutionState | null | undefined;
  readonly actualStartAt?: DateLike;
  readonly actualEndAt?: DateLike;
  readonly scheduledEndAt?: DateLike;
  readonly scheduledStartAt?: DateLike;
  readonly durationMinutes?: number | null;
}

function resolveScheduledEndAt(input: ScheduleInstanceDisplayInput): DateLike | undefined {
  let scheduledEndAt: DateLike | undefined = input.scheduledEndAt ?? undefined;
  if (!scheduledEndAt && input.scheduledStartAt && input.durationMinutes) {
    const startAt = input.scheduledStartAt instanceof Date ? input.scheduledStartAt : new Date(input.scheduledStartAt);
    scheduledEndAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);
  }
  return scheduledEndAt;
}

export function resolveScheduleInstanceDisplayStatus(
  outcome: ClassOutcome | null | undefined,
  executionState: ClassExecutionState | null | undefined,
  actualStartAt?: DateLike,
  actualEndAt?: DateLike,
  options?: ClassInstanceStatusResolveOptions & {
    scheduledEndAt?: DateLike;
    scheduledStartAt?: DateLike;
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

  const status = resolveClassInstanceDashboardStatus(outcome, executionState, actualStartAt, actualEndAt, {
    scheduledEndAt,
    missedGraceMinutes: options?.missedGraceMinutes ?? DEFAULT_MISSED_GRACE_MINUTES,
    now: options?.now,
  });
  return isScheduleInstanceDisplayStatus(status) ? status : ClassOutcome.Pending;
}
