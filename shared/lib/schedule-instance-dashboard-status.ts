import { ClassExecutionState, ClassOutcome } from "@/shared/lib/enum";

export type DailyScheduleMetricFilterKey =
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
export type OutcomeLike = ClassOutcome | string | null | undefined;
export type ExecutionStateLike = ClassExecutionState | string | null | undefined;

export type ClassInstanceDashboardStatus = ClassOutcome | ClassExecutionState.ACTIVATED | ClassExecutionState.RUNNING;

export interface ClassInstanceDashboardStatusInput {
  readonly outcome: OutcomeLike;
  readonly executionState: ExecutionStateLike;
  readonly actualStartAt?: DateLike;
  readonly actualEndAt?: DateLike;
}

export interface ClassInstanceMetricRow extends ClassInstanceDashboardStatusInput {
  readonly classType?: string | null;
  readonly isRescheduled?: boolean | null;
  readonly isFrozen?: boolean | null;
}

function toDate(value: DateLike | undefined): Date | null {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value : new Date(value);
}

export function resolveClassInstanceDashboardStatus(
  outcome: OutcomeLike,
  executionState: ExecutionStateLike,
  actualStartAt?: DateLike,
  actualEndAt?: DateLike
): ClassInstanceDashboardStatus {
  const normalizedOutcome = (outcome ?? ClassOutcome.PENDING) as ClassOutcome;
  const normalizedExecutionState = (executionState ?? ClassExecutionState.NOT_ACTIVATED) as ClassExecutionState;

  if (normalizedExecutionState === ClassExecutionState.RUNNING) {
    return ClassExecutionState.RUNNING;
  }

  if (normalizedExecutionState === ClassExecutionState.COMPLETED) {
    return normalizedOutcome;
  }

  if (normalizedExecutionState === ClassExecutionState.ACTIVATED) {
    const startAt = toDate(actualStartAt);
    const endAt = toDate(actualEndAt);
    if (startAt && !endAt) {
      return ClassExecutionState.RUNNING;
    }
    return ClassExecutionState.ACTIVATED;
  }

  return normalizedOutcome;
}

export function resolveClassInstanceDashboardStatusFromRow(
  row: ClassInstanceDashboardStatusInput
): ClassInstanceDashboardStatus {
  return resolveClassInstanceDashboardStatus(row.outcome, row.executionState, row.actualStartAt, row.actualEndAt);
}

function dashboardStatusMatchesMetric(
  dashboardStatus: ClassInstanceDashboardStatus,
  metricFilter: DailyScheduleMetricFilterKey
): boolean {
  switch (metricFilter) {
    case "taken":
      return dashboardStatus === ClassOutcome.TAKEN;
    case "pending":
      return dashboardStatus === ClassOutcome.PENDING;
    case "absent":
      return dashboardStatus === ClassOutcome.ABSENT;
    case "leave":
      return dashboardStatus === ClassOutcome.LEAVE;
    case "activated":
      return dashboardStatus === ClassExecutionState.ACTIVATED;
    case "running":
      return dashboardStatus === ClassExecutionState.RUNNING;
    default:
      return false;
  }
}

export function matchesDashboardMetricFilter(
  row: ClassInstanceMetricRow,
  metricFilter: string | null | undefined
): boolean {
  if (!metricFilter || metricFilter === "total") {
    return true;
  }

  const key = metricFilter as DailyScheduleMetricFilterKey;

  switch (key) {
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
      return dashboardStatusMatchesMetric(resolveClassInstanceDashboardStatusFromRow(row), key);
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

export function computeDailyScheduleMetricsFromRows(
  rows: readonly ClassInstanceMetricRow[]
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
    for (const key of METRIC_KEYS) {
      if (key === "total") {
        continue;
      }
      if (matchesDashboardMetricFilter(row, key)) {
        counts[key] += 1;
      }
    }
  }

  return counts;
}
