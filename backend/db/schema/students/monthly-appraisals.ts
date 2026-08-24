import {
  createTable,
  index,
  integerColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { students } from "@/backend/db/schema/students/students";
import { teachers } from "@/backend/db/schema/teachers/teachers";

/**
 * Monthly Appraisals table.
 *
 * Stores a teacher-authored monthly rubric per (student, teacher, month) with
 * nullable 1–5 grade + comment pairs for Behavior, Attendance, Punctuality, and
 * Overall Appraisal, plus a required Learning Targets text field.
 *
 * Design (F1):
 * - `month` is stored as a timestamp (first-of-month, e.g. 2026-08-01T00:00:00Z).
 *   The service layer normalizes any submitted month value to the first day of
 *   its month before insert so the unique key stays stable.
 * - Grade columns are plain `integer` (range 1..5 enforced at the service layer
 *   via Zod + service validation; no DB-level CHECK to preserve cross-dialect
 *   parity with SQLite).
 * - UNIQUE (studentId, teacherId, month) enables idempotent upsert by key.
 *
 * Tenancy / ownership is enforced at the service layer (2.2) — the schema does
 * not encode RLS policies on this table; ownership flows from
 * `teacher.teaches(student)` + `parent.owns(student)` checks at the service.
 */
export const monthlyAppraisals = createTable(
  "monthly_appraisals",
  {
    id: uuidColumn("id"),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    month: timestampColumn("month").notNull(),
    behaviorGrade: integerColumn("behavior_grade"),
    behaviorComment: textColumn("behavior_comment"),
    attendanceGrade: integerColumn("attendance_grade"),
    attendanceComment: textColumn("attendance_comment"),
    punctualityGrade: integerColumn("punctuality_grade"),
    punctualityComment: textColumn("punctuality_comment"),
    overallGrade: integerColumn("overall_grade"),
    overallComment: textColumn("overall_comment"),
    learningTargets: textColumn("learning_targets").notNull(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("monthly_appraisals_student_teacher_month_unique_idx").on(
      table.studentId,
      table.teacherId,
      table.month
    ),
    index("monthly_appraisals_student_id_idx").on(table.studentId),
    index("monthly_appraisals_teacher_id_idx").on(table.teacherId),
    index("monthly_appraisals_month_idx").on(table.month),
    index("monthly_appraisals_created_at_idx").on(table.createdAt),
  ]
);
