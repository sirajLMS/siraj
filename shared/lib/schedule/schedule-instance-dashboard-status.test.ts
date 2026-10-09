import { describe, expect, test } from "bun:test";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import {
  computeDailyScheduleMetricsFromRows,
  DEFAULT_MISSED_GRACE_MINUTES,
  isClassInstancePastMissedGrace,
  matchesDashboardMetricFilter,
  resolveClassInstanceDashboardStatus,
} from "@/shared/lib/schedule/schedule-instance-dashboard-status";

describe("schedule-instance-dashboard-status", () => {
  test("RUNNING execution state maps to running, not pending", () => {
    const status = resolveClassInstanceDashboardStatus(ClassOutcome.PENDING, ClassExecutionState.RUNNING);
    expect(status).toBe(ClassExecutionState.RUNNING);
    expect(
      matchesDashboardMetricFilter(
        { outcome: ClassOutcome.PENDING, executionState: ClassExecutionState.RUNNING },
        "pending"
      )
    ).toBeFalse();
    expect(
      matchesDashboardMetricFilter(
        { outcome: ClassOutcome.PENDING, executionState: ClassExecutionState.RUNNING },
        "running"
      )
    ).toBeTrue();
  });

  test("COMPLETED maps to outcome for display and metrics", () => {
    expect(resolveClassInstanceDashboardStatus(ClassOutcome.TAKEN, ClassExecutionState.COMPLETED)).toBe(
      ClassOutcome.TAKEN
    );
    expect(resolveClassInstanceDashboardStatus(ClassOutcome.ABSENT, ClassExecutionState.COMPLETED)).toBe(
      ClassOutcome.ABSENT
    );
    expect(
      matchesDashboardMetricFilter(
        { outcome: ClassOutcome.ABSENT, executionState: ClassExecutionState.COMPLETED },
        "absent"
      )
    ).toBeTrue();
    expect(
      matchesDashboardMetricFilter(
        { outcome: ClassOutcome.ABSENT, executionState: ClassExecutionState.COMPLETED },
        "taken"
      )
    ).toBeFalse();
  });

  test("ACTIVATED with active timestamps maps to running", () => {
    const startAt = new Date("2028-01-01T10:00:00Z");
    expect(
      resolveClassInstanceDashboardStatus(ClassOutcome.PENDING, ClassExecutionState.ACTIVATED, startAt, null)
    ).toBe(ClassExecutionState.RUNNING);
  });

  test("NOT_ACTIVATED + PENDING past missed grace maps to ABSENT", () => {
    const scheduledEndAt = new Date("2028-01-01T10:00:00Z");
    const now = new Date(scheduledEndAt.getTime() + (DEFAULT_MISSED_GRACE_MINUTES + 1) * 60_000);

    expect(
      resolveClassInstanceDashboardStatus(
        ClassOutcome.PENDING,
        ClassExecutionState.NOT_ACTIVATED,
        undefined,
        undefined,
        {
          scheduledEndAt,
          now,
        }
      )
    ).toBe(ClassOutcome.ABSENT);

    expect(
      isClassInstancePastMissedGrace(
        {
          outcome: ClassOutcome.PENDING,
          executionState: ClassExecutionState.NOT_ACTIVATED,
          scheduledEndAt,
        },
        { now }
      )
    ).toBeTrue();
  });

  test("NOT_ACTIVATED + PENDING within missed grace stays PENDING", () => {
    const scheduledEndAt = new Date("2028-01-01T10:00:00Z");
    const now = new Date(scheduledEndAt.getTime() + 5 * 60_000);

    expect(
      resolveClassInstanceDashboardStatus(
        ClassOutcome.PENDING,
        ClassExecutionState.NOT_ACTIVATED,
        undefined,
        undefined,
        {
          scheduledEndAt,
          now,
          missedGraceMinutes: DEFAULT_MISSED_GRACE_MINUTES,
        }
      )
    ).toBe(ClassOutcome.PENDING);
  });

  test("computeDailyScheduleMetricsFromRows aligns status counts", () => {
    const metrics = computeDailyScheduleMetricsFromRows([
      {
        outcome: ClassOutcome.PENDING,
        executionState: ClassExecutionState.NOT_ACTIVATED,
        classType: "REGULAR",
      },
      {
        outcome: ClassOutcome.PENDING,
        executionState: ClassExecutionState.RUNNING,
        classType: "REGULAR",
      },
      {
        outcome: ClassOutcome.TAKEN,
        executionState: ClassExecutionState.COMPLETED,
        classType: "TRIAL",
      },
      {
        outcome: ClassOutcome.ABSENT,
        executionState: ClassExecutionState.COMPLETED,
        classType: "REGULAR",
      },
    ]);

    expect(metrics.total).toBe(4);
    expect(metrics.pending).toBe(1);
    expect(metrics.running).toBe(1);
    expect(metrics.taken).toBe(1);
    expect(metrics.absent).toBe(1);
    expect(metrics.regular).toBe(3);
    expect(metrics.trial).toBe(1);
  });

  test("computeDailyScheduleMetricsFromRows counts past-due pending rows as absent", () => {
    const scheduledEndAt = new Date("2028-01-01T10:00:00Z");
    const now = new Date(scheduledEndAt.getTime() + (DEFAULT_MISSED_GRACE_MINUTES + 1) * 60_000);

    const metrics = computeDailyScheduleMetricsFromRows(
      [
        {
          outcome: ClassOutcome.PENDING,
          executionState: ClassExecutionState.NOT_ACTIVATED,
          scheduledEndAt,
          classType: "REGULAR",
        },
      ],
      { now }
    );

    expect(metrics.pending).toBe(0);
    expect(metrics.absent).toBe(1);
  });

  test("computeDailyScheduleMetricsFromRows handles numeric timestamps and large batches", () => {
    const scheduledEndAtMs = Date.parse("2028-01-01T10:00:00Z");
    const rows = Array.from({ length: 1000 }, (_, i) => ({
      outcome: i % 2 === 0 ? ClassOutcome.PENDING : ClassOutcome.TAKEN,
      executionState: i % 2 === 0 ? ClassExecutionState.NOT_ACTIVATED : ClassExecutionState.COMPLETED,
      scheduledEndAt: scheduledEndAtMs as unknown as Date,
      classType: i % 3 === 0 ? "REGULAR" : i % 3 === 1 ? "TRIAL" : "ADVANCE",
      isRescheduled: i % 5 === 0,
      isFrozen: i % 7 === 0,
    }));

    const metrics = computeDailyScheduleMetricsFromRows(rows);

    expect(metrics.total).toBe(1000);
    expect(metrics.pending).toBe(500);
    expect(metrics.taken).toBe(500);
    expect(metrics.regular).toBe(334);
    expect(metrics.trial).toBe(333);
    expect(metrics.advance).toBe(333);
    expect(metrics.rescheduled).toBe(200);
    expect(metrics.suspended).toBe(143);
  });
});
