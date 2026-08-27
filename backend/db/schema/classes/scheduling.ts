import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { coreScheduleColumns } from "@/backend/db/schema/__shared__/columnHelpers";
import {
  booleanColumn,
  checkConstraint,
  createTable,
  index,
  integerColumn,
  jsonbColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { quotas } from "@/backend/db/schema/billing/quotas";
import { classSubjects } from "@/backend/db/schema/classes/class-subject";
import {
  billedUnitEnum,
  classExecutionStateEnum,
  classOutcomeEnum,
  classTypeEnum,
  currencyCodeEnum,
  dayOfWeekEnum,
  dstMigrationResultEnum,
  leaveRequesterTypeEnum,
  leaveRequestStatusEnum,
  leaveRequestTypeEnum,
  onDemandNoCreditsOutcomeEnum,
  onDemandStatusEnum,
  rateSourceEnum,
  schedulingModeEnum,
} from "@/backend/db/schema/enums";

import { meetingProviders } from "@/backend/db/schema/meeting/meeting-providers";
import { userMeetingConfigs } from "@/backend/db/schema/meeting/user-meeting-configs";
import { timezones } from "@/backend/db/schema/shared/timezones";
import { students } from "@/backend/db/schema/students/students";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import type { RateSource } from "@/backend/enum";
import type { MeetingConfigSnapshot } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Recurring Schedules table.
 *
 * Database-level Constraints & Triggers:
 * - CHECK Constraint `recurring_schedules_timezone_chk`: Enforces that `timezone` matches a valid IANA timezone name (via `is_valid_timezone(timezone)`).
 * - Trigger `trg_recalc_hours_recurring_schedules`: Recalculates student `hours_per_week` on schedule insertions, updates, or deletes.
 *
 * Row-Level Security (RLS) Policies:
 * - Enabled for soft deletes: filters out records where `deleted_at IS NOT NULL` for SELECT/UPDATE.
 */
export const recurringSchedules = createTable(
  "recurring_schedules",
  {
    id: uuidColumn("id"),
    ...coreScheduleColumns({
      students: () => students,
      teachers: () => teachers,
      classSubjects: () => classSubjects,
    }),
    avatarUrl: varcharColumn("avatar_url", { length: 1024 }),
    durationMinutes: integerColumn("duration_minutes").notNull(),
    // PG-only: time — stored as TEXT on SQLite (drizzle returns string for both).
    defaultStartTime: textColumn("default_start_time").notNull(),
    timezoneId: integerColumn("timezone_id").references(() => timezones.id),
    timezone: varcharColumn("timezone", { length: 100 }).notNull(),
    utcOffsetSnapshot: integerColumn("utc_offset_snapshot"), // Offset in minutes at time of schedule creation/update
    // Recurring-class-level hourly rate (highest non-override precedence tier).
    // Nullable: when NULL, the rate falls back to `class_subjects.hourly_rate`
    // then `teachers.hourly_rate`. See `rate-resolver.service.ts`.
    // PG-only: numeric(12,2) — stored as TEXT on SQLite (drizzle returns string for both).
    hourlyRate: textColumn("hourly_rate"),
    rateCurrency: currencyCodeEnum("rate_currency").$type<CurrencyCode>(),
    // PG-only: date — stored as TEXT on SQLite (drizzle returns string for both).
    effectiveFrom: textColumn("effective_from"),
    effectiveUntil: textColumn("effective_until"),
    quotaId: uuidDefaultColumn("quota_id").references(() => quotas.id, { onDelete: "set null" }),
    earmarkedClasses: integerColumn("earmarked_classes"),
    schedulingMode: schedulingModeEnum("scheduling_mode").notNull().default("NUMBER_OF_CLASSES"),
    generationHorizonWeeks: integerColumn("generation_horizon_weeks"),
    ondemandNoCreditsOutcome: onDemandNoCreditsOutcomeEnum("ondemand_no_credits_outcome"),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
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
  ]
);

/**
 * Recurring Schedule Days table.
 *
 * Database-level Constraints & Triggers:
 * - Trigger `trg_recalc_hours_recurring_schedule_days`: Recalculates student `hours_per_week` on schedule day insertions, updates, or deletes.
 */
export const recurringScheduleDays = createTable(
  "recurring_schedule_days",
  {
    id: uuidColumn("id"),
    recurringScheduleId: uuidDefaultColumn("recurring_schedule_id")
      .notNull()
      .references(() => recurringSchedules.id, { onDelete: "restrict" }),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    // PG-only: time — stored as TEXT on SQLite (drizzle returns string for both).
    startTime: textColumn("start_time").notNull(),
    isActive: booleanColumn("is_active").notNull().default(true),
  },
  table => [
    uniqueIndex("recurring_schedule_days_schedule_day_idx").on(table.recurringScheduleId, table.dayOfWeek),
    index("recurring_schedule_days_recurring_schedule_id_idx").on(table.recurringScheduleId),
  ]
);

/**
 * Class Instances table.
 *
 * Database-level Constraints & Triggers:
 * - UNIQUE Index `class_instances_original_class_uniq_idx`: Partial unique index enforcing at most one active rescheduled instance per class.
 * - CHECK Constraint `class_instances_state_machine_chk`: Validates allowed state transitions and values.
 * - CHECK Constraint `class_instances_reschedule_not_self_chk`: Enforces `original_class_id IS NULL OR original_class_id != id` (cannot reschedule to self).
 * - CHECK Constraint `class_instances_rescheduled_no_quota_chk`: Enforces `is_rescheduled = false OR quota_deducted = false`.
 * - CHECK Constraint `class_instances_rescheduled_no_complete_chk`: Enforces `is_rescheduled = false OR (execution_state != 'COMPLETED' OR outcome != 'TAKEN')`.
 *
 * NOTE: High-level business rules (Quota deduction, Overlap prevention, Teacher assignment integrity, Rescheduling logic)
 * are now enforced in the application layer via `SchedulingRepository` to reduce database trigger depth and deadlock risk (Issue #10).
 *
 * Row-Level Security (RLS) Policies:
 * - Enabled for soft deletes: filters out records where `deleted_at IS NOT NULL` for SELECT/UPDATE.
 */
export const classInstances = createTable(
  "class_instances",
  {
    id: uuidColumn("id"),
    ...coreScheduleColumns({
      students: () => students,
      teachers: () => teachers,
      classSubjects: () => classSubjects,
    }),
    recurringScheduleId: uuidDefaultColumn("recurring_schedule_id").references(() => recurringSchedules.id, {
      onDelete: "set null",
    }),
    // Self-reference — explicit `AnyPgColumn` return type annotation breaks the
    // circular type inference (TS7022) that would otherwise make `classInstances`
    // implicitly `any` because `originalClassId` references `classInstances.id`.
    originalClassId: uuidDefaultColumn("original_class_id").references((): AnyPgColumn => classInstances.id, {
      onDelete: "set null",
    }),
    scheduledStartAt: timestampColumn("scheduled_start_at").notNull(),
    scheduledEndAt: timestampColumn("scheduled_end_at").notNull(),
    bookingTimezoneId: integerColumn("booking_timezone_id").references(() => timezones.id),
    bookingTimezone: varcharColumn("booking_timezone", { length: 100 }), // Snapshot of IANA ID at booking
    bookingUtcOffset: integerColumn("booking_utc_offset"), // Snapshot of UTC offset in minutes at booking
    durationMinutes: integerColumn("duration_minutes").notNull(),
    classType: classTypeEnum("class_type").notNull(),
    outcome: classOutcomeEnum("outcome").notNull().default("PENDING"),
    executionState: classExecutionStateEnum("execution_state").notNull().default("NOT_ACTIVATED"),
    // Billing discriminator for the credit-hours ledger extension.
    // NULL = legacy class-credit instance (deductForBooking path).
    // HOUR_CREDIT = instance consumes students.creditHoursRemaining via
    // CreditService.deductHoursForBooking (intentional v1 scaffolding — the
    // writer arrives with Plan 6 `student.billingMode`; see plan outcome notes).
    billedUnit: billedUnitEnum("billed_unit"),
    isRescheduled: booleanColumn("is_rescheduled").notNull().default(false),
    isFrozen: booleanColumn("is_frozen").notNull().default(false),
    meetingJoinUrl: varcharColumn("meeting_join_url", { length: 1024 }),
    userMeetingConfigId: uuidDefaultColumn("user_meeting_config_id").references(() => userMeetingConfigs.id, {
      onDelete: "set null",
    }),
    meetingProviderId: uuidDefaultColumn("meeting_provider_id").references(() => meetingProviders.id, {
      onDelete: "set null",
    }),
    meetingConfigSnapshot: jsonbColumn<MeetingConfigSnapshot>("meeting_config_snapshot"),
    activatedAt: timestampColumn("activated_at"),
    activatedByUserId: uuidDefaultColumn("activated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    forceActivated: booleanColumn("force_activated").notNull().default(false),
    forceActivatedByUserId: uuidDefaultColumn("force_activated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actualStartAt: timestampColumn("actual_start_at"),
    actualEndAt: timestampColumn("actual_end_at"),
    quotaDeducted: booleanColumn("quota_deducted").notNull().default(false),
    schedulingMode: schedulingModeEnum("scheduling_mode").notNull().default("NUMBER_OF_CLASSES"),
    ondemandStatus: onDemandStatusEnum("ondemand_status"),
    payrollCredited: booleanColumn("payroll_credited").notNull().default(false),
    // Rate snapshot — captured at class completion, overridable by admin
    // PG-only: numeric(12,2) — stored as TEXT on SQLite (drizzle returns string for both).
    rateAmount: textColumn("rate_amount"),
    rateCurrency: currencyCodeEnum("rate_currency").$type<CurrencyCode>(),
    isRateOverridden: booleanColumn("is_rate_overridden").notNull().default(false),
    // Which precedence tier the snapshot was resolved from (TEACHER | SUBJECT |
    // RECURRING | OVERRIDE). Set when the snapshot is captured at booking time
    // and again at approval. See `rate-resolver.service.ts`.
    rateSource: rateSourceEnum("rate_source").$type<RateSource>(),
    remarks: textColumn("remarks"),
    adminNotes: textColumn("admin_notes"),
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
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
    index("class_instances_deleted_at_idx").on(table.deletedAt),
    index("class_instances_teacher_state_start_idx").on(table.teacherId, table.executionState, table.scheduledStartAt),
    index("class_instances_student_state_start_idx").on(table.studentId, table.executionState, table.scheduledStartAt),
    index("class_instances_state_start_idx").on(table.executionState, table.scheduledStartAt),
    uniqueIndex("class_instances_original_class_uniq_idx")
      .on(table.originalClassId)
      .where(sql`${table.originalClassId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
    checkConstraint(
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
    ),
    checkConstraint(
      "class_instances_ondemand_status_scheduling_mode_chk",
      sql`
        (${table.ondemandStatus} IS NULL AND ${table.schedulingMode} != 'ON_DEMAND') OR
        (${table.ondemandStatus} IS NOT NULL AND ${table.schedulingMode} = 'ON_DEMAND')
      `,
      sql`
        (${table.ondemandStatus} IS NULL AND ${table.schedulingMode} != 'ON_DEMAND') OR
        (${table.ondemandStatus} IS NOT NULL AND ${table.schedulingMode} = 'ON_DEMAND')
      `
    ),
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
  ]
);

export const classStatusEvents = createTable(
  "class_status_events",
  {
    id: uuidColumn("id"),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "restrict" }),
    eventType: varcharColumn("event_type", { length: 50 }).notNull(),
    fromState: jsonbColumn("from_state"),
    toState: jsonbColumn("to_state"),
    description: textColumn("description"),
    actorUserId: uuidDefaultColumn("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestampColumn("created_at").notNull(),
  },
  table => [
    index("class_status_events_class_instance_id_idx").on(table.classInstanceId),
    index("class_status_events_instance_created_idx").on(table.classInstanceId, table.createdAt),
    index("class_status_events_event_type_idx").on(table.eventType),
    index("class_status_events_actor_user_id_idx").on(table.actorUserId),
  ]
);

export const leaveRequests = createTable(
  "leave_requests",
  {
    id: uuidColumn("id"),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "restrict" }),
    requestedByUserId: uuidDefaultColumn("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requesterType: leaveRequesterTypeEnum("requester_type").notNull(),
    requestType: leaveRequestTypeEnum("request_type"),
    proposedStartAt: timestampColumn("proposed_start_at"),
    reason: textColumn("reason"),
    status: leaveRequestStatusEnum("status").notNull(),
    createdAt: timestampColumn("created_at").notNull(),
    processedAt: timestampColumn("processed_at"),
    processedByUserId: uuidDefaultColumn("processed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  table => [
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
  ]
);

/**
 * Leave Quota Usage table.
 * Tracks student and teacher leave usage per calendar month.
 *
 * Database-level Constraints & Triggers:
 * - CHECK Constraint `leave_quota_usage_teacher_student_xor_chk`: Enforces XOR relationship (must associate with either a teacher or a student, but not both).
 * - Trigger `trg_enforce_leave_quota_limits` BEFORE INSERT OR UPDATE:
 *   - Dynamically resolves maximum allowed monthly leaves from `system_settings` (via keys `teacher_max_leaves` or `student_max_leaves`, defaulting to 2 if not found).
 *   - Blocks inserts/updates if the `used_count` exceeds the allowed limit.
 */
export const leaveQuotaUsage = createTable(
  "leave_quota_usage",
  {
    id: uuidColumn("id"),
    teacherId: uuidDefaultColumn("teacher_id").references(() => teachers.id, { onDelete: "restrict" }),
    studentId: uuidDefaultColumn("student_id").references(() => students.id, { onDelete: "restrict" }),
    // PG-only: smallint — stored as INTEGER on SQLite (drizzle returns number for both).
    periodYear: integerColumn("period_year").notNull(),
    // PG-only: smallint — stored as INTEGER on SQLite (drizzle returns number for both).
    periodMonth: integerColumn("period_month").notNull(),
    usedCount: integerColumn("used_count").notNull().default(0),
  },
  table => [
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
  ]
);

export const dstMigrationRuns = createTable(
  "dst_migration_runs",
  {
    id: uuidColumn("id"),
    runByUserId: uuidDefaultColumn("run_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    offsetMinutes: integerColumn("offset_minutes").notNull(),
    description: varcharColumn("description", { length: 255 }),
    createdAt: timestampColumn("created_at").notNull(),
  },
  table => [index("dst_migration_runs_created_at_idx").on(table.createdAt)]
);

export const dstMigrationEntries = createTable(
  "dst_migration_entries",
  {
    id: uuidColumn("id"),
    runId: uuidDefaultColumn("run_id")
      .notNull()
      .references(() => dstMigrationRuns.id, { onDelete: "cascade" }),
    recurringScheduleId: uuidDefaultColumn("recurring_schedule_id")
      .notNull()
      .references(() => recurringSchedules.id, { onDelete: "restrict" }),
    result: dstMigrationResultEnum("result").notNull(),
    conflictDetail: textColumn("conflict_detail"),
  },
  table => [
    index("dst_migration_entries_run_id_idx").on(table.runId),
    index("dst_migration_entries_recurring_schedule_id_idx").on(table.recurringScheduleId),
    index("dst_migration_entries_result_idx").on(table.result),
  ]
);

export const classInstancePerformance = createTable(
  "class_instance_performance",
  {
    id: uuidColumn("id"),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .unique()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    engagementScore: integerColumn("engagement_score"),
    assessmentProgress: integerColumn("assessment_progress"),
    assessmentTotal: integerColumn("assessment_total"),
    focusLevel: varcharColumn("focus_level", { length: 50 }),
    sessionHealth: varcharColumn("session_health", { length: 50 }),
    heatmapData: jsonbColumn<number[]>("heatmap_data"),
    latencyMs: integerColumn("latency_ms"),
    authorizationLabel: varcharColumn("authorization_label", { length: 100 }),
    attendanceRate: integerColumn("attendance_rate"),
    avgGrade: varcharColumn("avg_grade", { length: 10 }),
    lastClassDaysAgo: integerColumn("last_class_days_ago"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("class_instance_performance_created_at_idx").on(table.createdAt),
    index("class_instance_performance_updated_at_idx").on(table.updatedAt),
  ]
);
