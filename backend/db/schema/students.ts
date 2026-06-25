import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { appLanguageEnum, genderEnum, studentStatusEnum } from "./enums";
import { parents } from "./parents";
import { classInstances } from "./scheduling";
import { teachers } from "./teachers";
import { users } from "./users";

/**
 * Students table.
 *
 * Database-level Constraints & Triggers:
 * - CHECK Constraint `students_classes_remaining_chk`: Enforces `classes_remaining >= 0`.
 * - CHECK Constraint `students_classes_total_chk`: Enforces `classes_total >= 0`.
 * - CHECK Constraint `students_timezone_override_chk`: Enforces valid timezone if provided.
 * - Triggers `trg_recalc_hours_recurring_schedules` and `trg_recalc_hours_recurring_schedule_days`:
 *   Automatically recalculate `hours_per_week` (sum of duration of active schedule days) when schedules or schedule days change.
 * - Trigger `trg_enforce_student_status_transition`: Enforces valid state machine transitions for student status
 *   and logs transitions to `student_status_history`.
 *
 * Row-Level Security (RLS) Policies:
 * - Enabled on the `students` table.
 * - Policies:
 *   - `students_select_policy`: Restricts parent users to selecting only their own children.
 *   - `students_insert_policy`: Restricts parent users to inserting student records only under their own parent ID.
 *   - `students_update_policy`: Restricts parent users to updating only their own student records.
 *   - `students_delete_policy`: Restricts parent users to deleting only their own student records.
 *   Administrators or teachers (whose user IDs do not exist in the `parents` table) bypass these policies.
 *
 * Student effective timezone for schedule display:
 *   COALESCE(students.timezone_override, parents.timezone, academy default)
 * When timezone_override IS NULL, inherit from parent record.
 * booking_timezone on class_instances is a booking snapshot only — NOT used for UI localization.
 */
export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    primaryTeacherId: uuid("primary_teacher_id").references(() => teachers.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    avatarUrl: varchar("avatar_url", { length: 1024 }),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true, precision: 3 }),
    gender: genderEnum("gender"),
    language: appLanguageEnum("language"),
    timezoneOverride: varchar("timezone_override", { length: 100 }),
    status: studentStatusEnum("status").notNull(),
    classesTotal: integer("classes_total").notNull().default(0),
    classesRemaining: integer("classes_remaining").notNull().default(0),
    version: integer("version").notNull().default(0),
    // NOTE: PostgreSQL triggers automatically recalculate hoursPerWeek (SUM(duration_minutes)/60 of active days)
    // whenever recurring_schedules or recurring_schedule_days are inserted, updated, or deleted.
    hoursPerWeek: numeric("hours_per_week", { precision: 5, scale: 2 }).notNull().default("0"),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("students_parent_id_idx").on(table.parentId),
    index("students_primary_teacher_id_idx").on(table.primaryTeacherId),
    index("students_status_idx").on(table.status),
    index("idx_students_name_fts").using("gin", sql`to_tsvector('simple', ${table.name})`),
    index("idx_students_name_trgm").using("gist", table.name.op("gist_trgm_ops")),
    uniqueIndex("students_idempotency_key_unique_idx").on(table.idempotencyKey),
    check("students_classes_remaining_chk", sql`${table.classesRemaining} >= 0`),
    check("students_classes_total_chk", sql`${table.classesTotal} >= 0`),
    check(
      "students_timezone_override_chk",
      sql`${table.timezoneOverride} IS NULL OR is_valid_timezone(${table.timezoneOverride})`
    ),
    index("students_pagination_idx").on(table.createdAt, table.id),
    index("idx_students_filter_mobile").on(table.status, table.primaryTeacherId, table.dateOfBirth),
    index("idx_students_parent_status").on(table.parentId, table.status),
    index("idx_students_status_created").on(table.status, table.createdAt),
  ]
);

/**
 * Student Status History table.
 * Records all status transitions for students for auditing and state machine enforcement.
 */
export const studentStatusHistory = pgTable(
  "student_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    oldStatus: studentStatusEnum("old_status"),
    newStatus: studentStatusEnum("new_status").notNull(),
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("student_status_history_student_id_idx").on(table.studentId),
    index("student_status_history_changed_by_user_id_idx").on(table.changedByUserId),
  ]
);

/**
 * Student Progress table.
 * Records academic progress, topics covered, and homework for specific class instances.
 *
 * Row-Level Security (RLS) Policies:
 * - Enabled on the `student_progress` table.
 * - Policies:
 *   - `student_progress_teacher_policy`: Allows teachers to manage progress for students they teach.
 *   - `student_progress_parent_policy`: Allows parents to view progress for their children if `parent_visible` is true.
 */
export const studentProgress = pgTable(
  "student_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classInstanceId: uuid("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "restrict" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    topicsCovered: text("topics_covered").notNull(),
    homeworkAssigned: text("homework_assigned"),
    notes: text("notes"),
    parentVisible: boolean("parent_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("student_progress_student_id_idx").on(table.studentId),
    index("student_progress_class_instance_id_idx").on(table.classInstanceId),
    index("student_progress_teacher_id_idx").on(table.teacherId),
    uniqueIndex("student_progress_student_class_uniq_idx").on(table.studentId, table.classInstanceId),
  ]
);

export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, precision: 3 }).notNull(),
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, { onDelete: "set null" }),
    endedAt: timestamp("ended_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("teacher_assignments_student_id_idx").on(table.studentId),
    index("teacher_assignments_teacher_id_idx").on(table.teacherId),
  ]
);
