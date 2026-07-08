const ClassOutcomeValues = {
  PENDING: "PENDING",
  TAKEN: "TAKEN",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
} as const;

const ClassExecutionStateValues = {
  NOT_ACTIVATED: "NOT_ACTIVATED",
  ACTIVATED: "ACTIVATED",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
} as const;

export const DEFAULT_MISSED_GRACE_MINUTES = 15;

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

function toDate(value: DateLike | undefined): Date | null {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value : new Date(value);
}

export function isClassInstancePastMissedGrace(
  row: ClassInstanceDashboardStatusInput,
  options?: ClassInstanceStatusResolveOptions
): boolean {
  const normalizedOutcome = row.outcome ?? ClassOutcomeValues.PENDING;
  const normalizedExecutionState = row.executionState ?? ClassExecutionStateValues.NOT_ACTIVATED;

  if (
    normalizedExecutionState !== ClassExecutionStateValues.NOT_ACTIVATED ||
    normalizedOutcome !== ClassOutcomeValues.PENDING
  ) {
    return false;
  }

  const endAt = toDate(row.scheduledEndAt);
  if (!endAt) {
    return false;
  }

  const graceMinutes = options?.missedGraceMinutes ?? DEFAULT_MISSED_GRACE_MINUTES;
  const now = options?.now ?? new Date();
  const missedDeadline = endAt.getTime() + graceMinutes * 60_000;

  return now.getTime() > missedDeadline;
}

export function resolveClassInstanceDashboardStatus(
  outcome: OutcomeLike,
  executionState: ExecutionStateLike,
  actualStartAt?: DateLike,
  actualEndAt?: DateLike,
  options?: ClassInstanceStatusResolveOptions & { scheduledEndAt?: DateLike }
): ClassInstanceDashboardStatus {
  const normalizedOutcome = (outcome ?? ClassOutcomeValues.PENDING) as ClassInstanceDashboardStatus;
  const normalizedExecutionState = (executionState ??
    ClassExecutionStateValues.NOT_ACTIVATED) as ClassInstanceDashboardStatus;

  if (normalizedExecutionState === ClassExecutionStateValues.RUNNING) {
    return ClassExecutionStateValues.RUNNING;
  }

  if (normalizedExecutionState === ClassExecutionStateValues.COMPLETED) {
    return normalizedOutcome;
  }

  if (normalizedExecutionState === ClassExecutionStateValues.ACTIVATED) {
    const startAt = toDate(actualStartAt);
    const endAt = toDate(actualEndAt);
    if (startAt && !endAt) {
      return ClassExecutionStateValues.RUNNING;
    }
    return ClassExecutionStateValues.ACTIVATED;
  }

  if (
    isClassInstancePastMissedGrace(
      { outcome: normalizedOutcome, executionState: normalizedExecutionState, scheduledEndAt: options?.scheduledEndAt },
      options
    )
  ) {
    return ClassOutcomeValues.ABSENT;
  }

  return normalizedOutcome;
}

export function resolveClassInstanceDashboardStatusFromRow(
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
      return dashboardStatus === ClassOutcomeValues.TAKEN;
    case "pending":
      return dashboardStatus === ClassOutcomeValues.PENDING;
    case "absent":
      return dashboardStatus === ClassOutcomeValues.ABSENT;
    case "leave":
      return dashboardStatus === ClassOutcomeValues.LEAVE;
    case "activated":
      return dashboardStatus === ClassExecutionStateValues.ACTIVATED;
    case "running":
      return dashboardStatus === ClassExecutionStateValues.RUNNING;
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
      return dashboardStatusMatchesMetric(resolveClassInstanceDashboardStatusFromRow(row, options), key);
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
    for (const key of METRIC_KEYS) {
      if (key === "total") {
        continue;
      }
      if (matchesDashboardMetricFilter(row, key, options)) {
        counts[key] += 1;
      }
    }
  }

  return counts;
}
