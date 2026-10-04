import { sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { checkConstraint, index, uniqueIndex } from "@/backend/db/schema/__shared__/dialectAwareBuilder";

/**
 * Structural column references for the `recurring_schedules` extras builder.
 * Only the columns referenced by its indexes and CHECK constraints are declared.
 */
type RecurringSchedulesExtrasTable = {
  studentId: PgColumn;
  teacherId: PgColumn;
  timezoneId: PgColumn;
  subjectId: PgColumn;
  quotaId: PgColumn;
  deletedAt: PgColumn;
  effectiveFrom: PgColumn;
  effectiveUntil: PgColumn;
  createdAt: PgColumn;
  updatedAt: PgColumn;
  timezone: PgColumn;
};

export function buildRecurringSchedulesExtras(table: RecurringSchedulesExtrasTable) {
  return [
    index("recurring_schedules_student_id_idx").on(table.studentId),
    index("recurring_schedules_teacher_id_idx").on(table.teacherId),
    index("recurring_schedules_timezone_id_idx").on(table.timezoneId),
    index("recurring_schedules_subject_id_idx").on(table.subjectId),
    index("recurring_schedules_quota_id_idx").on(table.quotaId),
    index("recurring_schedules_deleted_at_idx").on(table.deletedAt),
    index("recurring_schedules_effective_from_idx").on(table.effectiveFrom),
    index("recurring_schedules_effective_until_idx").on(table.effectiveUntil),
    index("recurring_schedules_created_at_idx").on(table.createdAt),
    index("recurring_schedules_updated_at_idx").on(table.updatedAt),
    index("recurring_schedules_teacher_id_deleted_at_idx").on(table.teacherId, table.deletedAt),
    index("recurring_schedules_student_id_deleted_at_idx").on(table.studentId, table.deletedAt),
    // PG-only CHECK: calls the is_valid_timezone() UDF. SQLite cannot register
    // JS UDFs via libsql — timezone validation is handled at the app layer.
    checkConstraint("recurring_schedules_timezone_chk", sql`is_valid_timezone(${table.timezone})`, null),
  ];
}

/**
 * Structural column references for the `class_instances` extras builders.
 * The index and CHECK builders are split so each stays within the per-function
 * line budget while sharing this single column contract.
 */
type ClassInstanceExtrasTable = {
  id: PgColumn;
  scheduledStartAt: PgColumn;
  teacherId: PgColumn;
  studentId: PgColumn;
  originalClassId: PgColumn;
  subjectId: PgColumn;
  classType: PgColumn;
  outcome: PgColumn;
  idempotencyKey: PgColumn;
  executionState: PgColumn;
  ondemandStatus: PgColumn;
  isFrozen: PgColumn;
  isRescheduled: PgColumn;
  recurringScheduleId: PgColumn;
  carryoverBalanceId: PgColumn;
  userMeetingConfigId: PgColumn;
  meetingProviderId: PgColumn;
  activatedByUserId: PgColumn;
  forceActivatedByUserId: PgColumn;
  bookingTimezoneId: PgColumn;
  createdAt: PgColumn;
  updatedAt: PgColumn;
  actualStartAt: PgColumn;
  actualEndAt: PgColumn;
  activatedAt: PgColumn;
  quotaDeducted: PgColumn;
  payrollCredited: PgColumn;
  isRateOverridden: PgColumn;
  rateSource: PgColumn;
  rateAmount: PgColumn;
  calculationStatus: PgColumn;
  teacherPaidAmount: PgColumn;
  payrollCalculatedAt: PgColumn;
  deletedAt: PgColumn;
  forceActivated: PgColumn;
  schedulingMode: PgColumn;
  isPartialPercentage: PgColumn;
  calculatedDuration: PgColumn;
};

function buildClassInstanceIndexes(table: ClassInstanceExtrasTable) {
  return [
    index("class_instances_scheduled_start_at_idx").on(table.scheduledStartAt),
    index("class_instances_teacher_scheduled_idx").on(table.teacherId, table.scheduledStartAt),
    index("class_instances_student_scheduled_idx").on(table.studentId, table.scheduledStartAt),
    index("class_instances_original_class_id_idx").on(table.originalClassId),
    index("class_instances_subject_id_idx").on(table.subjectId),
    index("class_instances_class_type_idx").on(table.classType),
    index("class_instances_outcome_idx").on(table.outcome),
    uniqueIndex("class_instances_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("class_instances_execution_state_idx").on(table.executionState),
    index("class_instances_ondemand_status_idx").on(table.ondemandStatus),
    index("class_instances_frozen_idx").on(table.isFrozen).where(sql`${table.isFrozen} = true`),
    index("class_instances_rescheduled_idx").on(table.isRescheduled).where(sql`${table.isRescheduled} = true`),
    index("class_instances_recurring_schedule_id_idx").on(table.recurringScheduleId),
    index("class_instances_carryover_balance_id_idx").on(table.carryoverBalanceId),
    index("class_instances_user_meeting_config_id_idx").on(table.userMeetingConfigId),
    index("class_instances_meeting_provider_id_idx").on(table.meetingProviderId),
    index("class_instances_activated_by_user_id_idx").on(table.activatedByUserId),
    index("class_instances_force_activated_by_user_id_idx").on(table.forceActivatedByUserId),
    index("class_instances_booking_timezone_id_idx").on(table.bookingTimezoneId),
    index("class_instances_created_at_idx").on(table.createdAt),
    index("class_instances_updated_at_idx").on(table.updatedAt),
    index("class_instances_actual_start_at_idx").on(table.actualStartAt),
    index("class_instances_actual_end_at_idx").on(table.actualEndAt),
    index("class_instances_activated_at_idx").on(table.activatedAt),
    index("class_instances_quota_deducted_idx").on(table.quotaDeducted),
    index("class_instances_payroll_credited_idx").on(table.payrollCredited),
    index("class_instances_is_rate_overridden_idx").on(table.isRateOverridden),
    index("class_instances_rate_source_idx").on(table.rateSource),
    index("class_instances_calculation_status_idx").on(table.calculationStatus),
    index("class_instances_teacher_paid_amount_idx").on(table.teacherPaidAmount),
    index("class_instances_payroll_calculated_at_idx").on(table.payrollCalculatedAt),
    index("class_instances_teacher_status_scheduled_idx").on(
      table.teacherId,
      table.calculationStatus,
      table.scheduledStartAt
    ),
    index("class_instances_deleted_at_idx").on(table.deletedAt),
    index("class_instances_teacher_state_start_idx").on(table.teacherId, table.executionState, table.scheduledStartAt),
    index("class_instances_student_state_start_idx").on(table.studentId, table.executionState, table.scheduledStartAt),
    index("class_instances_state_start_idx").on(table.executionState, table.scheduledStartAt),
    uniqueIndex("class_instances_original_class_uniq_idx")
      .on(table.originalClassId)
      .where(sql`${table.originalClassId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
  ];
}

function buildClassInstanceStateMachineCheck(table: ClassInstanceExtrasTable) {
  return checkConstraint(
    "class_instances_state_machine_chk",
    sql`
      (${table.executionState} != 'COMPLETED' OR ${table.outcome} != 'PENDING') AND
      (${table.executionState} != 'NOT_ACTIVATED' OR ${table.actualStartAt} IS NULL) AND
      (${table.forceActivated} = false OR ${table.forceActivatedByUserId} IS NOT NULL) AND
      (${table.outcome} != 'TAKEN' OR ${table.actualStartAt} IS NOT NULL) AND
      (${table.isRateOverridden} = false OR ${table.rateAmount} IS NOT NULL) AND
      (${table.executionState} NOT IN ('ON_DEMAND_PENDING_CREDITS', 'ON_DEMAND_CONFLICT_HELD', 'ON_DEMAND_NO_CREDITS_CANCELLED', 'ON_DEMAND_NO_CREDITS_ABSENT') OR ${table.schedulingMode} = 'ON_DEMAND')
    `,
    sql`
      (${table.executionState} != 'COMPLETED' OR ${table.outcome} != 'PENDING') AND
      (${table.executionState} != 'NOT_ACTIVATED' OR ${table.actualStartAt} IS NULL) AND
      (${table.forceActivated} = false OR ${table.forceActivatedByUserId} IS NOT NULL) AND
      (${table.outcome} != 'TAKEN' OR ${table.actualStartAt} IS NOT NULL) AND
      (${table.isRateOverridden} = false OR ${table.rateAmount} IS NOT NULL) AND
      (${table.executionState} NOT IN ('ON_DEMAND_PENDING_CREDITS', 'ON_DEMAND_CONFLICT_HELD', 'ON_DEMAND_NO_CREDITS_CANCELLED', 'ON_DEMAND_NO_CREDITS_ABSENT') OR ${table.schedulingMode} = 'ON_DEMAND')
    `
  );
}

function buildClassInstanceOnDemandStatusCheck(table: ClassInstanceExtrasTable) {
  return checkConstraint(
    "class_instances_ondemand_status_scheduling_mode_chk",
    sql`
      (${table.ondemandStatus} IS NULL AND ${table.schedulingMode} != 'ON_DEMAND') OR
      (${table.ondemandStatus} IS NOT NULL AND ${table.schedulingMode} = 'ON_DEMAND')
    `,
    sql`
      (${table.ondemandStatus} IS NULL AND ${table.schedulingMode} != 'ON_DEMAND') OR
      (${table.ondemandStatus} IS NOT NULL AND ${table.schedulingMode} = 'ON_DEMAND')
    `
  );
}

function buildClassInstanceRescheduleChecks(table: ClassInstanceExtrasTable) {
  return [
    checkConstraint(
      "class_instances_reschedule_not_self_chk",
      sql`${table.originalClassId} IS NULL OR ${table.originalClassId} != ${table.id}`,
      sql`${table.originalClassId} IS NULL OR ${table.originalClassId} != ${table.id}`
    ),
    checkConstraint(
      "class_instances_rescheduled_no_quota_chk",
      sql`${table.isRescheduled} = false OR ${table.quotaDeducted} = false`,
      sql`${table.isRescheduled} = false OR ${table.quotaDeducted} = false`
    ),
    checkConstraint(
      "class_instances_rescheduled_no_complete_chk",
      sql`${table.isRescheduled} = false OR (${table.executionState} != 'COMPLETED' OR ${table.outcome} != 'TAKEN')`,
      sql`${table.isRescheduled} = false OR (${table.executionState} != 'COMPLETED' OR ${table.outcome} != 'TAKEN')`
    ),
  ];
}

function buildClassInstancePayrollChecks(table: ClassInstanceExtrasTable) {
  return [
    checkConstraint(
      "class_instances_partial_percentage_chk",
      sql`
        (${table.calculationStatus} != 'PARTIALLY' OR ${table.isPartialPercentage} IS NOT NULL) AND
        (${table.calculationStatus} = 'PARTIALLY' OR ${table.isPartialPercentage} IS NULL) AND
        (${table.isPartialPercentage} IS NULL OR (${table.isPartialPercentage} >= 0 AND ${table.isPartialPercentage} <= 100))
      `,
      sql`
        (${table.calculationStatus} != 'PARTIALLY' OR ${table.isPartialPercentage} IS NOT NULL) AND
        (${table.calculationStatus} = 'PARTIALLY' OR ${table.isPartialPercentage} IS NULL) AND
        (${table.isPartialPercentage} IS NULL OR (${table.isPartialPercentage} >= 0 AND ${table.isPartialPercentage} <= 100))
      `
    ),
    checkConstraint(
      "class_instances_calculated_status_amount_chk",
      sql`
        (${table.calculationStatus} != 'REFUND' OR ${table.teacherPaidAmount} = '0') AND
        (${table.calculationStatus} != 'CALCULATED' OR ${table.calculatedDuration} IS NOT NULL)
      `,
      sql`
        (${table.calculationStatus} != 'REFUND' OR ${table.teacherPaidAmount} = '0') AND
        (${table.calculationStatus} != 'CALCULATED' OR ${table.calculatedDuration} IS NOT NULL)
      `
    ),
  ];
}

export function buildClassInstanceExtras(table: ClassInstanceExtrasTable) {
  return [
    ...buildClassInstanceIndexes(table),
    buildClassInstanceStateMachineCheck(table),
    buildClassInstanceOnDemandStatusCheck(table),
    ...buildClassInstanceRescheduleChecks(table),
    ...buildClassInstancePayrollChecks(table),
  ];
}

type ClassStatusEventsExtrasTable = {
  classInstanceId: PgColumn;
  createdAt: PgColumn;
  eventType: PgColumn;
  actorUserId: PgColumn;
};

export function buildClassStatusEventsExtras(table: ClassStatusEventsExtrasTable) {
  return [
    index("class_status_events_class_instance_id_idx").on(table.classInstanceId),
    index("class_status_events_instance_created_idx").on(table.classInstanceId, table.createdAt),
    index("class_status_events_event_type_idx").on(table.eventType),
    index("class_status_events_actor_user_id_idx").on(table.actorUserId),
  ];
}

type LeaveRequestsExtrasTable = {
  classInstanceId: PgColumn;
  requestedByUserId: PgColumn;
  processedByUserId: PgColumn;
  status: PgColumn;
  requesterType: PgColumn;
  createdAt: PgColumn;
  processedAt: PgColumn;
};

export function buildLeaveRequestsExtras(table: LeaveRequestsExtrasTable) {
  return [
    index("leave_requests_class_instance_id_idx").on(table.classInstanceId),
    index("leave_requests_requested_by_user_id_idx").on(table.requestedByUserId),
    index("leave_requests_processed_by_user_id_idx").on(table.processedByUserId),
    index("leave_requests_status_idx").on(table.status),
    index("leave_requests_requester_type_idx").on(table.requesterType),
    index("leave_requests_created_at_idx").on(table.createdAt),
    index("leave_requests_processed_at_idx").on(table.processedAt),
    uniqueIndex("leave_requests_pending_class_instance_unique_idx")
      .on(table.classInstanceId)
      .where(sql`status = 'PENDING'`),
  ];
}

type LeaveQuotaUsageExtrasTable = {
  teacherId: PgColumn;
  studentId: PgColumn;
  periodYear: PgColumn;
  periodMonth: PgColumn;
};

export function buildLeaveQuotaUsageExtras(table: LeaveQuotaUsageExtrasTable) {
  return [
    uniqueIndex("leave_quota_teacher_period_idx")
      .on(table.teacherId, table.periodYear, table.periodMonth)
      .where(sql`${table.teacherId} IS NOT NULL`),
    uniqueIndex("leave_quota_student_period_idx")
      .on(table.studentId, table.periodYear, table.periodMonth)
      .where(sql`${table.studentId} IS NOT NULL`),
    index("leave_quota_usage_period_year_period_month_idx").on(table.periodYear, table.periodMonth),
    checkConstraint(
      "leave_quota_usage_teacher_student_xor_chk",
      sql`(${table.teacherId} IS NOT NULL AND ${table.studentId} IS NULL) OR (${table.teacherId} IS NULL AND ${table.studentId} IS NOT NULL)`,
      sql`(${table.teacherId} IS NOT NULL AND ${table.studentId} IS NULL) OR (${table.teacherId} IS NULL AND ${table.studentId} IS NOT NULL)`
    ),
  ];
}
