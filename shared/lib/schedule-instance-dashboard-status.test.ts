import { describe, expect, test } from "bun:test";
import { ClassExecutionState, ClassOutcome } from "@/shared/lib/enum";
import {
  computeDailyScheduleMetricsFromRows,
  matchesDashboardMetricFilter,
  resolveClassInstanceDashboardStatus,
} from "@/shared/lib/schedule-instance-dashboard-status";

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
});
