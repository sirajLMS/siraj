import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

export const DEFAULT_MISSED_GRACE_MINUTES = 15;

type DailyScheduleMetricFilterKey =
  | "total"
  | "regular"
  | "trial"
  | "advance"
  | "rescheduled"
  | "suspended"
  | "taken"
  | "pending"
  | "activated"
  | "running"
  | "absent"
  | "leave";

export type DateLike = Date | string | null;
export type OutcomeLike = string | null | undefined;
export type ExecutionStateLike = string | null | undefined;

export type ClassInstanceDashboardStatus =
  | "PENDING"
  | "TAKEN"
  | "ABSENT"
  | "LEAVE"
  | "NOT_ACTIVATED"
  | "ACTIVATED"
  | "RUNNING"
  | "COMPLETED";

export interface ClassInstanceDashboardStatusInput {
  readonly outcome: OutcomeLike;
  readonly executionState: ExecutionStateLike;
  readonly actualStartAt?: DateLike;
  readonly actualEndAt?: DateLike;
  readonly scheduledEndAt?: DateLike;
}

export interface ClassInstanceMetricRow extends ClassInstanceDashboardStatusInput {
  readonly classType?: string | null;
  readonly isRescheduled?: boolean | null;
  readonly isFrozen?: boolean | null;
}

export interface ClassInstanceStatusResolveOptions {
  readonly missedGraceMinutes?: number;
  readonly now?: Date;
}

const DASHBOARD_STATUS_VALUES: ReadonlySet<string> = new Set<string>([
  ClassOutcome.PENDING,
  ClassOutcome.TAKEN,
  ClassOutcome.ABSENT,
  ClassOutcome.LEAVE,
  ClassExecutionState.NOT_ACTIVATED,
  ClassExecutionState.ACTIVATED,
  ClassExecutionState.RUNNING,
  ClassExecutionState.COMPLETED,
]);

function isClassInstanceDashboardStatus(value: string): value is ClassInstanceDashboardStatus {
  return DASHBOARD_STATUS_VALUES.has(value);
}

const METRIC_FILTER_KEY_VALUES: ReadonlySet<string> = new Set<string>([
  "total",
  "regular",
  "trial",
  "advance",
  "rescheduled",
  "suspended",
  "taken",
  "pending",
  "activated",
  "running",
  "absent",
  "leave",
]);

function isDailyScheduleMetricFilterKey(value: string): value is DailyScheduleMetricFilterKey {
  return METRIC_FILTER_KEY_VALUES.has(value);
}

function toEpochMs(value: DateLike | undefined): number | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

export function isClassInstancePastMissedGrace(
  row: ClassInstanceDashboardStatusInput,
  options?: ClassInstanceStatusResolveOptions
): boolean {
  const normalizedOutcome: string = row.outcome ?? ClassOutcome.PENDING;
  const normalizedExecutionState: string = row.executionState ?? ClassExecutionState.NOT_ACTIVATED;

  if (normalizedExecutionState !== "NOT_ACTIVATED" || normalizedOutcome !== "PENDING") {
    return false;
  }

  const endMs = toEpochMs(row.scheduledEndAt);
  if (endMs === null) {
    return false;
  }

  const graceMinutes = options?.missedGraceMinutes ?? DEFAULT_MISSED_GRACE_MINUTES;
  const nowMs = options?.now ? options.now.getTime() : Date.now();
  const missedDeadline = endMs + graceMinutes * 60_000;

  return nowMs > missedDeadline;
}

export function resolveClassInstanceDashboardStatus(
  outcome: OutcomeLike,
  executionState: ExecutionStateLike,
  actualStartAt?: DateLike,
  actualEndAt?: DateLike,
  options?: ClassInstanceStatusResolveOptions & { scheduledEndAt?: DateLike }
): ClassInstanceDashboardStatus {
  const normalizedOutcome: string = outcome ?? ClassOutcome.PENDING;
  const normalizedExecutionState: string = executionState ?? ClassExecutionState.NOT_ACTIVATED;

  if (normalizedExecutionState === "RUNNING") {
    return "RUNNING";
  }

  if (normalizedExecutionState === "COMPLETED") {
    return isClassInstanceDashboardStatus(normalizedOutcome) ? normalizedOutcome : "PENDING";
  }

  if (normalizedExecutionState === "ACTIVATED") {
    const startMs = toEpochMs(actualStartAt);
    const endMs = toEpochMs(actualEndAt);
    if (startMs !== null && endMs === null) {
      return "RUNNING";
    }
    return "ACTIVATED";
  }

  if (
    isClassInstancePastMissedGrace(
      { outcome: normalizedOutcome, executionState: normalizedExecutionState, scheduledEndAt: options?.scheduledEndAt },
      options
    )
  ) {
    return "ABSENT";
  }

  return isClassInstanceDashboardStatus(normalizedOutcome) ? normalizedOutcome : "PENDING";
}

function resolveClassInstanceDashboardStatusFromRow(
  row: ClassInstanceDashboardStatusInput,
  options?: ClassInstanceStatusResolveOptions
): ClassInstanceDashboardStatus {
  return resolveClassInstanceDashboardStatus(row.outcome, row.executionState, row.actualStartAt, row.actualEndAt, {
    scheduledEndAt: row.scheduledEndAt,
    ...options,
  });
}

function dashboardStatusMatchesMetric(
  dashboardStatus: ClassInstanceDashboardStatus,
  metricFilter: DailyScheduleMetricFilterKey
): boolean {
  switch (metricFilter) {
    case "taken":
      return dashboardStatus === "TAKEN";
    case "pending":
      return dashboardStatus === "PENDING";
    case "absent":
      return dashboardStatus === "ABSENT";
    case "leave":
      return dashboardStatus === "LEAVE";
    case "activated":
      return dashboardStatus === "ACTIVATED";
    case "running":
      return dashboardStatus === "RUNNING";
    default:
      return false;
  }
}

export function matchesDashboardMetricFilter(
  row: ClassInstanceMetricRow,
  metricFilter: string | null | undefined,
  options?: ClassInstanceStatusResolveOptions
): boolean {
  if (!metricFilter || metricFilter === "total") {
    return true;
  }

  if (!isDailyScheduleMetricFilterKey(metricFilter)) {
    return true;
  }

  switch (metricFilter) {
    case "regular":
      return row.classType === "REGULAR";
    case "trial":
      return row.classType === "TRIAL";
    case "advance":
      return row.classType === "ADVANCE";
    case "rescheduled":
      return row.isRescheduled === true;
    case "suspended":
      return row.isFrozen === true;
    case "taken":
    case "pending":
    case "absent":
    case "leave":
    case "activated":
    case "running":
      return dashboardStatusMatchesMetric(resolveClassInstanceDashboardStatusFromRow(row, options), metricFilter);
    default:
      return true;
  }
}

export interface DailyScheduleMetricsCounts {
  total: number;
  regular: number;
  trial: number;
  advance: number;
  rescheduled: number;
  suspended: number;
  taken: number;
  pending: number;
  activated: number;
  running: number;
  absent: number;
  leave: number;
}

export function computeDailyScheduleMetricsFromRows(
  rows: readonly ClassInstanceMetricRow[],
  options?: ClassInstanceStatusResolveOptions
): DailyScheduleMetricsCounts {
  const counts: DailyScheduleMetricsCounts = {
    total: rows.length,
    regular: 0,
    trial: 0,
    advance: 0,
    rescheduled: 0,
    suspended: 0,
    taken: 0,
    pending: 0,
    activated: 0,
    running: 0,
    absent: 0,
    leave: 0,
  };

  for (const row of rows) {
    if (row.classType === "REGULAR") {
      counts.regular += 1;
    } else if (row.classType === "TRIAL") {
      counts.trial += 1;
    } else if (row.classType === "ADVANCE") {
      counts.advance += 1;
    }

    if (row.isRescheduled === true) {
      counts.rescheduled += 1;
    }
    if (row.isFrozen === true) {
      counts.suspended += 1;
    }

    const status = resolveClassInstanceDashboardStatusFromRow(row, options);
    switch (status) {
      case "TAKEN":
        counts.taken += 1;
        break;
      case "PENDING":
        counts.pending += 1;
        break;
      case "ABSENT":
        counts.absent += 1;
        break;
      case "LEAVE":
        counts.leave += 1;
        break;
      case "ACTIVATED":
        counts.activated += 1;
        break;
      case "RUNNING":
        counts.running += 1;
        break;
    }
  }

  return counts;
}
