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

/**
 * Converts a `DateLike` timestamp to epoch milliseconds without instantiating
 * `Date` objects when given string ISO dates, numbers, or timestamps, avoiding GC allocations.
 */
function toEpochMs(value: DateLike | number | undefined): number | null {
  if (!value) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
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

  const endAtMs = toEpochMs(row.scheduledEndAt);
  if (endAtMs === null) {
    return false;
  }

  const graceMinutes = options?.missedGraceMinutes ?? DEFAULT_MISSED_GRACE_MINUTES;
  const nowMs = options?.now ? options.now.getTime() : Date.now();
  const missedDeadline = endAtMs + graceMinutes * 60_000;

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
    const startAtMs = toEpochMs(actualStartAt);
    const endAtMs = toEpochMs(actualEndAt);
    if (startAtMs !== null && endAtMs === null) {
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
    missedGraceMinutes: options?.missedGraceMinutes,
    now: options?.now,
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

const METRIC_KEYS: readonly DailyScheduleMetricFilterKey[] = [
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
];

/**
 * Single-pass O(N) daily schedule metrics computation.
 *
 * Resolves each row's dashboard status once per row and checks class type and flags directly,
 * avoiding quadratic metric filter checks and repeated status resolution allocations.
 */
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

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;

    if (row.classType === "REGULAR") counts.regular++;
    else if (row.classType === "TRIAL") counts.trial++;
    else if (row.classType === "ADVANCE") counts.advance++;

    if (row.isRescheduled === true) counts.rescheduled++;
    if (row.isFrozen === true) counts.suspended++;

    const status = resolveClassInstanceDashboardStatusFromRow(row, options);
    switch (status) {
      case "TAKEN":
        counts.taken++;
        break;
      case "PENDING":
        counts.pending++;
        break;
      case "ABSENT":
        counts.absent++;
        break;
      case "LEAVE":
        counts.leave++;
        break;
      case "ACTIVATED":
        counts.activated++;
        break;
      case "RUNNING":
        counts.running++;
        break;
    }
  }

  return counts;
}
