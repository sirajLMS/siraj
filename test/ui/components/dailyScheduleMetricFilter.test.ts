import { describe, expect, test } from "bun:test";
import { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/dashboard/types/schedule";
import {
  matchesDailyScheduleMetricFilter,
  resolveDailyScheduleMetricFilter,
} from "@/frontend/views/dashboard/dashboard/utils/dailyScheduleMetricFilter";

const sampleRow = (overrides: Partial<DailyScheduleRow>): DailyScheduleRow => ({
  id: "1",
  yourTime: "10:00 AM",
  teacherTime: null,
  studentTime: null,
  duration: 60,
  status: null,
  outcome: ClassOutcome.Pending,
  executionState: ClassExecutionState.NotActivated,
  student: { id: "s1", name: "Student" },
  teacher: { id: "t1", name: "Teacher" },
  ...overrides,
});

describe("dailyScheduleMetricFilter", () => {
  test("resolveDailyScheduleMetricFilter maps total and empty to null", () => {
    expect(resolveDailyScheduleMetricFilter(null)).toBeNull();
    expect(resolveDailyScheduleMetricFilter("total")).toBeNull();
    expect(resolveDailyScheduleMetricFilter("taken")).toBe("taken");
  });

  test("matchesDailyScheduleMetricFilter filters by dashboard status", () => {
    const pendingRow = sampleRow({});
    const takenRow = sampleRow({
      outcome: ClassOutcome.Taken,
      executionState: ClassExecutionState.Completed,
    });
    const runningRow = sampleRow({
      outcome: ClassOutcome.Pending,
      executionState: ClassExecutionState.Running,
    });

    expect(matchesDailyScheduleMetricFilter(pendingRow, null)).toBeTrue();
    expect(matchesDailyScheduleMetricFilter(pendingRow, "pending")).toBeTrue();
    expect(matchesDailyScheduleMetricFilter(takenRow, "pending")).toBeFalse();
    expect(matchesDailyScheduleMetricFilter(takenRow, "taken")).toBeTrue();
    expect(matchesDailyScheduleMetricFilter(runningRow, "running")).toBeTrue();
    expect(matchesDailyScheduleMetricFilter(runningRow, "pending")).toBeFalse();
    expect(matchesDailyScheduleMetricFilter(runningRow, "taken")).toBeFalse();
  });
});
