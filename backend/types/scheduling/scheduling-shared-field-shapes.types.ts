import type {
  ClassSessionMetrics,
  EffectiveMeetingReturnType,
  RecurringScheduleDetailReturnType,
} from "@/backend/types";
import type { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

/**
 * Shared 9-field shape common to both RecurringScheduleDetailReturnType
 * and RecurringScheduleListItem. Derived via Pick to avoid re-declaration drift.
 * Fields: id, studentId, studentName, teacherId, teacherName, durationMinutes,
 * defaultStartTime, hourlyRate, rateCurrency.
 */
export type RecurringScheduleSharedShape = Pick<
  RecurringScheduleDetailReturnType,
  | "id"
  | "studentId"
  | "studentName"
  | "teacherId"
  | "teacherName"
  | "durationMinutes"
  | "defaultStartTime"
  | "hourlyRate"
  | "rateCurrency"
>;

/**
 * Shared shape for metrics objects that expose `pending`, `rescheduled`,
 * and `leave` integer fields alongside an optional `id` string field.
 * Derived from `ClassSessionMetrics` which is a superset; `RescheduleTrackingMetrics`
 * has the same fields (with non-optional `id`) and is structurally compatible.
 */
export type MetricsSharedShape = Pick<ClassSessionMetrics, "id" | "pending" | "rescheduled" | "leave">;

/** Options to control `id` nullability in {@link classSessionMetricsFields}. */
export interface MetricsFieldOptions {
  /** When true, `id` is nullable (e.g. DailyScheduleMetrics). */
  readonly idNullable?: boolean;
}

/**
 * Shared shape covering the fields common to objects that expose
 * class execution state: DailyScheduleList, StatusTrackingScheduleRow,
 * and WeeklyScheduleClass.
 */
export interface ClassExecutionFieldShape {
  readonly executionState?: ClassExecutionState | null;
  readonly outcome?: ClassOutcome | null;
  readonly isFrozen: boolean;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingReturnType | null;
}

/**
 * Options to control nullability of the shared execution fields, since
 * {@link WeeklyScheduleClassPothosObject} marks `executionState` and `outcome`
 * as nullable, while the others do not.
 */
export interface ClassExecutionFieldOptions {
  readonly executionStateNullable?: boolean;
  readonly outcomeNullable?: boolean;
}
