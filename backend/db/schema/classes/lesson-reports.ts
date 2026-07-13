import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { classInstances } from "@/backend/db/schema/classes/scheduling";
import { attendanceEvaluationEnum, lessonReportStatusEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import { LessonReportStatus } from "@/backend/enum";

/**
 * Lesson Reports table.
 *
 * Tracks teacher-submitted lesson reports for completed class instances, with
 * a review workflow (PENDING_REVIEW → APPROVED | REJECTED).
 *
 * Database-level Constraints:
 * - UNIQUE Index `lesson_reports_class_instance_id_unique_idx`: Enforces at most
 *   one report per class instance.
 * - UNIQUE Index `lesson_reports_idempotency_key_unique_idx`: Idempotency guard
 *   for report submission.
 * - CHECK Constraint `lesson_reports_completion_percentage_chk`: Enforces
 *   `completion_percentage` is between 0 and 100.
 * - CHECK Constraint `lesson_reports_review_consistency_chk`: Enforces that
 *   rejected reports have a rejection reason while approved reports do not.
 */
export const lessonReports = pgTable(
  "lesson_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classInstanceId: uuid("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    lessonDate: timestamp("lesson_date", { withTimezone: true, precision: 3 }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    attendanceEvaluation: attendanceEvaluationEnum("attendance_evaluation").notNull(),
    teacherNotes: text("teacher_notes"),
    completionPercentage: integer("completion_percentage").notNull().default(0),
    status: lessonReportStatusEnum("status").notNull().default(LessonReportStatus.PENDING_REVIEW),
    submittedByUserId: uuid("submitted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, precision: 3 }),
    rejectionReason: text("rejection_reason"),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex("lesson_reports_class_instance_id_unique_idx").on(table.classInstanceId),
    uniqueIndex("lesson_reports_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("lesson_reports_status_idx").on(table.status),
    index("lesson_reports_teacher_id_idx").on(table.teacherId),
    index("lesson_reports_student_id_idx").on(table.studentId),
    check(
      "lesson_reports_completion_percentage_chk",
      sql`${table.completionPercentage} >= 0 AND ${table.completionPercentage} <= 100`
    ),
    check(
      "lesson_reports_review_consistency_chk",
      sql`(${table.status} != 'REJECTED' OR ${table.rejectionReason} IS NOT NULL) AND (${table.status} != 'APPROVED' OR ${table.rejectionReason} IS NULL)`
    ),
  ]
);
