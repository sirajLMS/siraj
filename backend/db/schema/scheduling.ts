import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  classExecutionStateEnum,
  classOutcomeEnum,
  classTypeEnum,
  dayOfWeekEnum,
  dstMigrationResultEnum,
  leaveRequesterTypeEnum,
  leaveRequestStatusEnum,
} from "./enums";
import { students } from "./students";
import { teachers } from "./teachers";
import { users } from "./users";

export const recurringSchedules = pgTable(
  "recurring_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    durationMinutes: integer("duration_minutes").notNull(),
    defaultStartTime: time("default_start_time").notNull(),
    timezone: varchar("timezone", { length: 100 }).notNull(),
    effectiveFrom: date("effective_from"),
    effectiveUntil: date("effective_until"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("recurring_schedules_student_id_idx").on(table.studentId),
    index("recurring_schedules_teacher_id_idx").on(table.teacherId),
  ]
);

export const recurringScheduleDays = pgTable(
  "recurring_schedule_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recurringScheduleId: uuid("recurring_schedule_id")
      .notNull()
      .references(() => recurringSchedules.id, { onDelete: "restrict" }),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  table => [uniqueIndex("recurring_schedule_days_schedule_day_idx").on(table.recurringScheduleId, table.dayOfWeek)]
);

export const classInstances = pgTable(
  "class_instances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    recurringScheduleId: uuid("recurring_schedule_id").references(() => recurringSchedules.id, {
      onDelete: "set null",
    }),
    originalClassId: uuid("original_class_id").references((): AnyPgColumn => classInstances.id, {
      onDelete: "set null",
    }),
    scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true, precision: 3 }).notNull(),
    scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true, precision: 3 }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    classType: classTypeEnum("class_type").notNull(),
    outcome: classOutcomeEnum("outcome").notNull().default("PENDING"),
    executionState: classExecutionStateEnum("execution_state").notNull().default("NOT_ACTIVATED"),
    isRescheduled: boolean("is_rescheduled").notNull().default(false),
    isFrozen: boolean("is_frozen").notNull().default(false),
    zoomMeetingUrl: varchar("zoom_meeting_url", { length: 1024 }),
    activatedAt: timestamp("activated_at", { withTimezone: true, precision: 3 }),
    activatedByUserId: uuid("activated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    forceActivated: boolean("force_activated").notNull().default(false),
    forceActivatedByUserId: uuid("force_activated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    actualStartAt: timestamp("actual_start_at", { withTimezone: true, precision: 3 }),
    actualEndAt: timestamp("actual_end_at", { withTimezone: true, precision: 3 }),
    quotaDeducted: boolean("quota_deducted").notNull().default(false),
    // Rate snapshot — captured at class completion, overridable by admin
    rateAmount: numeric("rate_amount", { precision: 12, scale: 2 }),
    rateCurrency: varchar("rate_currency", { length: 10 }),
    isRateOverridden: boolean("is_rate_overridden").notNull().default(false),
    remarks: text("remarks"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("class_instances_scheduled_start_at_idx").on(table.scheduledStartAt),
    index("class_instances_teacher_scheduled_idx").on(table.teacherId, table.scheduledStartAt),
    index("class_instances_student_scheduled_idx").on(table.studentId, table.scheduledStartAt),
    index("class_instances_original_class_id_idx").on(table.originalClassId),
    index("class_instances_class_type_idx").on(table.classType),
    index("class_instances_outcome_idx").on(table.outcome),
    index("class_instances_execution_state_idx").on(table.executionState),
    index("class_instances_frozen_idx").on(table.isFrozen).where(sql`${table.isFrozen} = true`),
    index("class_instances_rescheduled_idx").on(table.isRescheduled).where(sql`${table.isRescheduled} = true`),
    check(
      "class_instances_state_machine_chk",
      sql`
        (${table.executionState} != 'COMPLETED' OR ${table.outcome} != 'PENDING') AND
        (${table.executionState} != 'NOT_ACTIVATED' OR ${table.actualStartAt} IS NULL) AND
        (${table.forceActivated} = false OR ${table.forceActivatedByUserId} IS NOT NULL) AND
        (${table.outcome} != 'TAKEN' OR ${table.actualStartAt} IS NOT NULL) AND
        (${table.isRateOverridden} = false OR ${table.rateAmount} IS NOT NULL)
      `
    ),
    // NOTE: Overlap prevention requires a raw SQL migration (requires btree_gist extension):
    // ALTER TABLE class_instances ADD CONSTRAINT class_instances_no_overlap_chk
    // EXCLUDE USING gist (teacher_id WITH =, tstzrange(scheduled_start_at, scheduled_end_at) WITH &&);
  ]
);

export const classStatusEvents = pgTable(
  "class_status_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classInstanceId: uuid("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "restrict" }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    fromState: jsonb("from_state"),
    toState: jsonb("to_state"),
    description: text("description"),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("class_status_events_class_instance_id_idx").on(table.classInstanceId),
    index("class_status_events_instance_created_idx").on(table.classInstanceId, table.createdAt),
  ]
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classInstanceId: uuid("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "restrict" }),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requesterType: leaveRequesterTypeEnum("requester_type").notNull(),
    reason: text("reason"),
    status: leaveRequestStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true, precision: 3 }),
    processedByUserId: uuid("processed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  table => [index("leave_requests_class_instance_id_idx").on(table.classInstanceId)]
);

export const leaveQuotaUsage = pgTable(
  "leave_quota_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id").references(() => teachers.id, { onDelete: "restrict" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "restrict" }),
    periodYear: smallint("period_year").notNull(),
    periodMonth: smallint("period_month").notNull(),
    usedCount: integer("used_count").notNull().default(0),
    maxAllowed: integer("max_allowed").notNull().default(2),
  },
  table => [
    uniqueIndex("leave_quota_teacher_period_idx")
      .on(table.teacherId, table.periodYear, table.periodMonth)
      .where(sql`${table.teacherId} IS NOT NULL`),
    uniqueIndex("leave_quota_student_period_idx")
      .on(table.studentId, table.periodYear, table.periodMonth)
      .where(sql`${table.studentId} IS NOT NULL`),
    check(
      "leave_quota_usage_teacher_student_xor_chk",
      sql`(${table.teacherId} IS NOT NULL AND ${table.studentId} IS NULL) OR (${table.teacherId} IS NULL AND ${table.studentId} IS NOT NULL)`
    ),
  ]
);

export const dstMigrationRuns = pgTable("dst_migration_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  runByUserId: uuid("run_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  offsetMinutes: integer("offset_minutes").notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
});

export const dstMigrationEntries = pgTable(
  "dst_migration_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => dstMigrationRuns.id, { onDelete: "cascade" }),
    classInstanceId: uuid("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "restrict" }),
    result: dstMigrationResultEnum("result").notNull(),
    conflictDetail: text("conflict_detail"),
  },
  table => [index("dst_migration_entries_run_id_idx").on(table.runId)]
);
