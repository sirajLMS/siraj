import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
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
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    durationMinutes: integer("duration_minutes").notNull(),
    defaultStartTime: time("default_start_time").notNull(),
    timezone: varchar("timezone", { length: 100 }).notNull(),
    effectiveFrom: date("effective_from"),
    effectiveUntil: date("effective_until"),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
  },
  table => [
    index("recurring_schedules_student_id_idx").on(table.studentId),
    index("recurring_schedules_teacher_id_idx").on(table.teacherId),
  ]
);

export const recurringScheduleDays = pgTable(
  "recurring_schedule_days",
  {
    id: serial("id").primaryKey(),
    recurringScheduleId: integer("recurring_schedule_id")
      .notNull()
      .references(() => recurringSchedules.id, { onDelete: "cascade" }),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  table => [uniqueIndex("recurring_schedule_days_schedule_day_idx").on(table.recurringScheduleId, table.dayOfWeek)]
);

export const classInstances = pgTable(
  "class_instances",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    recurringScheduleId: integer("recurring_schedule_id").references(() => recurringSchedules.id, {
      onDelete: "set null",
    }),
    originalClassId: bigint("original_class_id", { mode: "bigint" }).references((): AnyPgColumn => classInstances.id, {
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
    activatedByUserId: integer("activated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    forceActivated: boolean("force_activated").notNull().default(false),
    forceActivatedByUserId: integer("force_activated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    actualStartAt: timestamp("actual_start_at", { withTimezone: true, precision: 3 }),
    actualEndAt: timestamp("actual_end_at", { withTimezone: true, precision: 3 }),
    // Rate snapshot — captured at class completion, overridable by admin
    rateAmount: numeric("rate_amount", { precision: 12, scale: 2 }),
    rateCurrency: varchar("rate_currency", { length: 10 }),
    isRateOverridden: boolean("is_rate_overridden").notNull().default(false),
    remarks: text("remarks"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
  },
  table => [
    index("class_instances_scheduled_start_at_idx").on(table.scheduledStartAt),
    index("class_instances_teacher_scheduled_idx").on(table.teacherId, table.scheduledStartAt),
    index("class_instances_student_scheduled_idx").on(table.studentId, table.scheduledStartAt),
    index("class_instances_original_class_id_idx").on(table.originalClassId),
    index("class_instances_metrics_idx").on(
      table.executionState,
      table.outcome,
      table.isFrozen,
      table.isRescheduled,
      table.classType
    ),
  ]
);

export const classStatusEvents = pgTable(
  "class_status_events",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
    classInstanceId: bigint("class_instance_id", { mode: "bigint" })
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    fromState: jsonb("from_state"),
    toState: jsonb("to_state"),
    description: text("description"),
    actorUserId: integer("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
  },
  table => [index("class_status_events_class_instance_id_idx").on(table.classInstanceId)]
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: serial("id").primaryKey(),
    classInstanceId: bigint("class_instance_id", { mode: "bigint" })
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    requestedByUserId: integer("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requesterType: leaveRequesterTypeEnum("requester_type").notNull(),
    reason: text("reason"),
    status: leaveRequestStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    processedAt: timestamp("processed_at", { precision: 3 }),
    processedByUserId: integer("processed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  table => [index("leave_requests_class_instance_id_idx").on(table.classInstanceId)]
);

export const leaveQuotaUsage = pgTable(
  "leave_quota_usage",
  {
    id: serial("id").primaryKey(),
    teacherId: integer("teacher_id").references(() => teachers.id, { onDelete: "cascade" }),
    studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
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
  ]
);

export const dstMigrationRuns = pgTable("dst_migration_runs", {
  id: serial("id").primaryKey(),
  runByUserId: integer("run_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  offsetMinutes: integer("offset_minutes").notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { precision: 3 }).notNull(),
});

export const dstMigrationEntries = pgTable(
  "dst_migration_entries",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id")
      .notNull()
      .references(() => dstMigrationRuns.id, { onDelete: "cascade" }),
    classInstanceId: bigint("class_instance_id", { mode: "bigint" })
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    result: dstMigrationResultEnum("result").notNull(),
    conflictDetail: text("conflict_detail"),
  },
  table => [index("dst_migration_entries_run_id_idx").on(table.runId)]
);
