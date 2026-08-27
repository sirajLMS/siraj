import { sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db/dialect";
import {
  booleanColumn,
  checkConstraint,
  createTable,
  index,
  integerColumn,
  numericColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { classInstances } from "@/backend/db/schema/classes/scheduling";
import { appLanguageEnum, genderEnum, studentStatusEnum } from "@/backend/db/schema/enums";
import { parents } from "@/backend/db/schema/parents/parents";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";

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
 *   COALESCE(students.timezone_override, parent_user.timezone, academy default)
 * When timezone_override IS NULL, inherit from parent user record.
 * booking_timezone on class_instances is a booking snapshot only — NOT used for UI localization.
 */
export const students = createTable(
  "students",
  {
    id: uuidColumn("id"),
    parentId: uuidDefaultColumn("parent_id").references(() => parents.id, { onDelete: "cascade" }),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    primaryTeacherId: uuidDefaultColumn("primary_teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    name: varcharColumn("name", { length: 255 }).notNull(),
    avatarUrl: varcharColumn("avatar_url", { length: 1024 }),
    dateOfBirth: timestampColumn("date_of_birth"),
    gender: genderEnum("gender"),
    language: appLanguageEnum("language"),
    timezoneOverride: varcharColumn("timezone_override", { length: 100 }),
    status: studentStatusEnum("status").notNull(),
    classesTotal: integerColumn("classes_total").notNull().default(0),
    classesRemaining: integerColumn("classes_remaining").notNull().default(0),
    // Credit-hours parallel balances (numeric(12,2) on PG; TEXT on SQLite).
    // Mirror classesTotal/classesRemaining for hour-billed academies.
    creditHoursTotal: numericColumn("credit_hours_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    creditHoursRemaining: numericColumn("credit_hours_remaining", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    version: integerColumn("version").notNull().default(0),
    // NOTE: PostgreSQL triggers automatically recalculate hoursPerWeek (SUM(duration_minutes)/60 of active days)
    // whenever recurring_schedules or recurring_schedule_days are inserted, updated, or deleted.
    // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric semantics
    // via the text representation — monetary arithmetic should be performed at the app layer
    // using a decimal library rather than SQL arithmetic.
    hoursPerWeek: textColumn("hours_per_week").notNull().default("0"),
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("students_parent_id_idx").on(table.parentId),
    index("students_user_id_idx").on(table.userId),
    index("students_primary_teacher_id_idx").on(table.primaryTeacherId),
    index("students_status_idx").on(table.status),
    // PG-only: GIN full-text search index + GiST trigram index (pg_trgm extension).
    // SQLite has no equivalent — text search degrades to LIKE queries at the repo layer.
    ...(!isSqlite()
      ? [
          index("idx_students_name_fts").using("gin", sql`to_tsvector('simple', ${table.name})`),
          index("idx_students_name_trgm").using("gist", table.name.op("gist_trgm_ops")),
        ]
      : []),
    uniqueIndex("students_idempotency_key_unique_idx").on(table.idempotencyKey),
    uniqueIndex("students_user_id_unique_idx").on(table.userId),
    checkConstraint(
      "students_classes_remaining_chk",
      sql`${table.classesRemaining} >= 0`,
      sql`${table.classesRemaining} >= 0`
    ),
    checkConstraint("students_classes_total_chk", sql`${table.classesTotal} >= 0`, sql`${table.classesTotal} >= 0`),
    checkConstraint(
      "students_credit_hours_remaining_chk",
      sql`${table.creditHoursRemaining} >= 0`,
      sql`${table.creditHoursRemaining} >= 0`
    ),
    checkConstraint(
      "students_credit_hours_total_chk",
      sql`${table.creditHoursTotal} >= 0`,
      sql`${table.creditHoursTotal} >= 0`
    ),
    // PG-only CHECK: calls the is_valid_timezone() UDF. SQLite cannot register
    // JS UDFs via libsql — timezone validation is handled at the app layer.
    checkConstraint(
      "students_timezone_override_chk",
      sql`${table.timezoneOverride} IS NULL OR is_valid_timezone(${table.timezoneOverride})`,
      null
    ),
    index("students_pagination_idx").on(table.createdAt, table.id),
    index("idx_students_filter_mobile").on(table.status, table.primaryTeacherId, table.dateOfBirth),
    index("idx_students_parent_status").on(table.parentId, table.status),
    index("idx_students_status_created").on(table.status, table.createdAt),
    index("students_language_idx").on(table.language),
    index("students_date_of_birth_idx").on(table.dateOfBirth),
    index("students_updated_at_idx").on(table.updatedAt),
    index("students_primary_teacher_id_status_idx").on(table.primaryTeacherId, table.status),
  ]
);

/**
 * Student Status History table.
 * Records all status transitions for students for auditing and state machine enforcement.
 */
export const studentStatusHistory = createTable(
  "student_status_history",
  {
    id: uuidColumn("id"),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    oldStatus: studentStatusEnum("old_status"),
    newStatus: studentStatusEnum("new_status").notNull(),
    changedByUserId: uuidDefaultColumn("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
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
export const studentProgress = createTable(
  "student_progress",
  {
    id: uuidColumn("id"),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "restrict" }),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    topicsCovered: textColumn("topics_covered").notNull(),
    homeworkAssigned: textColumn("homework_assigned"),
    notes: textColumn("notes"),
    parentVisible: booleanColumn("parent_visible").notNull().default(true),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("student_progress_student_id_idx").on(table.studentId),
    index("student_progress_class_instance_id_idx").on(table.classInstanceId),
    index("student_progress_teacher_id_idx").on(table.teacherId),
    uniqueIndex("student_progress_student_class_uniq_idx").on(table.studentId, table.classInstanceId),
    index("student_progress_parent_visible_idx").on(table.parentVisible),
    index("student_progress_created_at_idx").on(table.createdAt),
  ]
);

export const teacherAssignments = createTable(
  "teacher_assignments",
  {
    id: uuidColumn("id"),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    assignedAt: timestampColumn("assigned_at").notNull(),
    assignedByUserId: uuidDefaultColumn("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    endedAt: timestampColumn("ended_at"),
  },
  table => [
    index("teacher_assignments_student_id_idx").on(table.studentId),
    index("teacher_assignments_teacher_id_idx").on(table.teacherId),
    index("teacher_assignments_ended_at_idx").on(table.endedAt),
    index("teacher_assignments_assigned_by_user_id_idx").on(table.assignedByUserId),
  ]
);
