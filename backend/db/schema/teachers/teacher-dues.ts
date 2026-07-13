import { index, numeric, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { classInstances } from "@/backend/db/schema/classes/scheduling";
import { currencyCodeEnum, teacherDueStatusEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";
import { teacherPayments } from "@/backend/db/schema/teachers/teacher-payments";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import { type CurrencyCode, TeacherDueStatus } from "@/backend/enum";

/**
 * Teacher Dues table.
 * Tracks per-lesson earnings accrued to a teacher when a lesson report is approved.
 * One due per class instance (uniqueness enforced via `teacher_dues_class_instance_id_unique_idx`).
 */
export const teacherDues = pgTable(
  "teacher_dues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classInstanceId: uuid("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    hours: numeric("hours", { precision: 8, scale: 2 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    status: teacherDueStatusEnum("status").notNull().default(TeacherDueStatus.PENDING),
    approvedByUserId: uuid("approved_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    approvedAt: timestamp("approved_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    teacherPaymentId: uuid("teacher_payment_id").references(() => teacherPayments.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex("teacher_dues_class_instance_id_unique_idx").on(table.classInstanceId),
    index("teacher_dues_teacher_id_idx").on(table.teacherId),
    index("teacher_dues_status_idx").on(table.status),
    index("teacher_dues_approved_at_idx").on(table.approvedAt),
  ]
);
