import {
  createTable,
  index,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { classInstances } from "@/backend/db/schema/classes/scheduling";
import { currencyCodeEnum, rateSourceEnum, teacherDueStatusEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";
import { teacherPayments } from "@/backend/db/schema/teachers/teacher-payments";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import { type RateSource, TeacherDueStatus } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Teacher Dues table.
 * Tracks per-lesson earnings accrued to a teacher when a lesson report is approved.
 * One due per class instance (uniqueness enforced via `teacher_dues_class_instance_id_unique_idx`).
 */
export const teacherDues = createTable(
  "teacher_dues",
  {
    id: uuidColumn("id"),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id as never, { onDelete: "cascade" }),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id as never, { onDelete: "cascade" }),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id as never, { onDelete: "cascade" }),
    // PG-only: `numeric` column has no dialect-aware helper — degraded to TEXT.
    // SQLite uses NUMERIC column affinity; precision/scale enforced at app layer.
    hours: textColumn("hours").notNull(),
    amount: textColumn("amount").notNull(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    // Denormalized from `class_instances.rate_source` at due-creation time so the
    // high-traffic dues list can show which precedence tier the rate came from
    // without joining back to `class_instances`. See `rate-resolver.service.ts`.
    rateSource: rateSourceEnum("rate_source").$type<RateSource>(),
    status: teacherDueStatusEnum("status").notNull().default(TeacherDueStatus.PENDING).$type<TeacherDueStatus>(),
    approvedByUserId: uuidDefaultColumn("approved_by_user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "cascade" }),
    approvedAt: timestampColumn("approved_at").notNull().defaultNow(),
    teacherPaymentId: uuidDefaultColumn("teacher_payment_id").references(() => teacherPayments.id as never, {
      onDelete: "set null",
    }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    uniqueIndex("teacher_dues_class_instance_id_unique_idx").on(table.classInstanceId),
    index("teacher_dues_teacher_id_idx").on(table.teacherId),
    index("teacher_dues_status_idx").on(table.status),
    index("teacher_dues_approved_at_idx").on(table.approvedAt),
    index("teacher_dues_student_id_idx").on(table.studentId),
    index("teacher_dues_teacher_payment_id_idx").on(table.teacherPaymentId),
    index("teacher_dues_approved_by_user_id_idx").on(table.approvedByUserId),
    index("teacher_dues_currency_idx").on(table.currency),
    index("teacher_dues_rate_source_idx").on(table.rateSource),
  ]
);
