import { sql } from "drizzle-orm";
import {
  checkConstraint,
  createTable,
  index,
  integerColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
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
export const lessonReports = createTable(
  "lesson_reports",
  {
    id: uuidColumn("id"),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    lessonDate: timestampColumn("lesson_date").notNull(),
    durationMinutes: integerColumn("duration_minutes").notNull(),
    attendanceEvaluation: attendanceEvaluationEnum("attendance_evaluation").notNull(),
    teacherNotes: textColumn("teacher_notes"),
    studentNotes: textColumn("student_notes"),
    completionPercentage: integerColumn("completion_percentage").notNull().default(0),
    status: lessonReportStatusEnum("status").notNull().default(LessonReportStatus.PENDING_REVIEW),
    submittedByUserId: uuidDefaultColumn("submitted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    submittedAt: timestampColumn("submitted_at").notNull().defaultNow(),
    reviewedByUserId: uuidDefaultColumn("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestampColumn("reviewed_at"),
    rejectionReason: textColumn("rejection_reason"),
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("lesson_reports_class_instance_id_unique_idx").on(table.classInstanceId),
    uniqueIndex("lesson_reports_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("lesson_reports_status_idx").on(table.status),
    index("lesson_reports_teacher_id_idx").on(table.teacherId),
    index("lesson_reports_student_id_idx").on(table.studentId),
    index("lesson_reports_submitted_by_user_id_idx").on(table.submittedByUserId),
    index("lesson_reports_reviewed_by_user_id_idx").on(table.reviewedByUserId),
    index("lesson_reports_submitted_at_idx").on(table.submittedAt),
    index("lesson_reports_reviewed_at_idx").on(table.reviewedAt),
    index("lesson_reports_lesson_date_idx").on(table.lessonDate),
    index("lesson_reports_attendance_evaluation_idx").on(table.attendanceEvaluation),
    index("lesson_reports_status_submitted_at_idx").on(table.status, table.submittedAt),
    index("lesson_reports_teacher_id_status_idx").on(table.teacherId, table.status),
    index("lesson_reports_student_id_status_idx").on(table.studentId, table.status),
    checkConstraint(
      "lesson_reports_completion_percentage_chk",
      sql`${table.completionPercentage} >= 0 AND ${table.completionPercentage} <= 100`,
      sql`${table.completionPercentage} >= 0 AND ${table.completionPercentage} <= 100`
    ),
    checkConstraint(
      "lesson_reports_review_consistency_chk",
      sql`(${table.status} != 'REJECTED' OR ${table.rejectionReason} IS NOT NULL) AND (${table.status} != 'APPROVED' OR ${table.rejectionReason} IS NULL)`,
      sql`(${table.status} != 'REJECTED' OR ${table.rejectionReason} IS NOT NULL) AND (${table.status} != 'APPROVED' OR ${table.rejectionReason} IS NULL)`
    ),
  ]
);
