import { sql } from "drizzle-orm";
import { check, index, integer, numeric, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { appLanguageEnum, genderEnum, studentStatusEnum } from "./enums";
import { parents } from "./parents";
import { teachers } from "./teachers";
import { users } from "./users";

/**
 * Students table.
 * 
 * Database-level Constraints & Triggers:
 * - CHECK Constraint `students_classes_remaining_chk`: Enforces `classes_remaining >= 0`.
 * - CHECK Constraint `students_classes_total_chk`: Enforces `classes_total >= 0`.
 * - Triggers `trg_recalc_hours_recurring_schedules` and `trg_recalc_hours_recurring_schedule_days`:
 *   Automatically recalculate `hours_per_week` (sum of duration of active schedule days) when schedules or schedule days change.
 * 
 * Row-Level Security (RLS) Policies:
 * - Enabled on the `students` table.
 * - Policies:
 *   - `students_select_policy`: Restricts parent users to selecting only their own children.
 *   - `students_insert_policy`: Restricts parent users to inserting student records only under their own parent ID.
 *   - `students_update_policy`: Restricts parent users to updating only their own student records.
 *   - `students_delete_policy`: Restricts parent users to deleting only their own student records.
 *   Administrators or teachers (whose user IDs do not exist in the `parents` table) bypass these policies.
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
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true, precision: 3 }),
    gender: genderEnum("gender"),
    language: appLanguageEnum("language"),
    status: studentStatusEnum("status").notNull(),
    classesTotal: integer("classes_total").notNull().default(0),
    classesRemaining: integer("classes_remaining").notNull().default(0),
    // NOTE: PostgreSQL triggers automatically recalculate hoursPerWeek (SUM(duration_minutes)/60 of active days)
    // whenever recurring_schedules or recurring_schedule_days are inserted, updated, or deleted.
    hoursPerWeek: numeric("hours_per_week", { precision: 5, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("students_parent_id_idx").on(table.parentId),
    index("students_primary_teacher_id_idx").on(table.primaryTeacherId),
    index("students_status_idx").on(table.status),
    index("idx_students_name_fts").using("gin", sql`to_tsvector('simple', ${table.name})`),
    index("idx_students_name_trgm").using("gist", table.name.op("gist_trgm_ops")),
    check("students_classes_remaining_chk", sql`${table.classesRemaining} >= 0`),
    check("students_classes_total_chk", sql`${table.classesTotal} >= 0`),
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
