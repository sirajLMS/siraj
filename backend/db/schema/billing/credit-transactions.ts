import { sql } from "drizzle-orm";
import {
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
import { payments } from "@/backend/db/schema/billing/billing";
import { classInstances } from "@/backend/db/schema/classes/scheduling";
import { creditAdjustmentTypeEnum, creditReasonEnum } from "@/backend/db/schema/enums";
import { students } from "@/backend/db/schema/students/students";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import { CreditAdjustmentType } from "@/backend/enum";

export const creditTransactions = createTable(
  "credit_transactions",
  {
    id: uuidColumn("id"),
    studentId: uuidDefaultColumn("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    // Relaxed from NOT NULL to nullable for the hour-based parallel ledger:
    // a row carries EITHER classes (changeAmount) OR hours (changeAmountHours),
    // never both — enforced by the XOR CHECK constraint below.
    changeAmount: integerColumn("change_amount"),
    // Hours ledger amount (numeric(12,2) on PG; TEXT on SQLite).
    // NULL for legacy class-count rows; non-null for hour-based rows.
    changeAmountHours: numericColumn("change_amount_hours", { precision: 12, scale: 2 }),
    reason: creditReasonEnum("reason").notNull(),
    sourcePaymentId: uuidDefaultColumn("source_payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),
    classInstanceId: uuidDefaultColumn("class_instance_id").references(() => classInstances.id, {
      onDelete: "set null",
    }),
    notes: textColumn("notes"),
    creditedByUserId: uuidDefaultColumn("credited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
    // Credit-adjustment bookkeeping: the adjustment kind plus the carryover
    // metadata consumed by the carryover settlement flow. Defaults keep
    // existing purchase/deduction/refund rows unchanged.
    adjustmentType: creditAdjustmentTypeEnum("adjustment_type")
      .notNull()
      .default(CreditAdjustmentType.ADD)
      .$type<CreditAdjustmentType>(),
    carryoverTeacherId: uuidDefaultColumn("carryover_teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    // PG-only: `date` column has no dialect-aware helper — degraded to TEXT
    // (ISO date strings, YYYY-MM-DD), same as teachers.date_of_birth.
    carryoverFromDate: textColumn("carryover_from_date"),
    carryoverToDate: textColumn("carryover_to_date"),
    carryoverPaymentDate: textColumn("carryover_payment_date"),
    // Operator-internal plain-text note (accounting-only): stored verbatim —
    // not rich-text sanitized and never rendered on student/parent surfaces.
    internalNotes: textColumn("internal_notes"),
  },
  table => [
    uniqueIndex("credit_transactions_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("credit_transactions_student_id_idx").on(table.studentId),
    index("credit_transactions_reason_idx").on(table.reason),
    index("credit_transactions_class_instance_id_idx").on(table.classInstanceId),
    index("credit_transactions_created_at_idx").on(table.createdAt),
    index("credit_transactions_source_payment_id_idx").on(table.sourcePaymentId),
    index("credit_transactions_credited_by_user_id_idx").on(table.creditedByUserId),
    index("credit_transactions_student_change_hours_idx").on(table.studentId, table.changeAmountHours),
    index("credit_transactions_adjustment_type_idx").on(table.adjustmentType),
    index("credit_transactions_carryover_teacher_id_idx").on(table.carryoverTeacherId),
    checkConstraint(
      "credit_transactions_change_amount_xor_chk",
      sql`((${table.changeAmount} IS NOT NULL AND ${table.changeAmountHours} IS NULL) OR (${table.changeAmount} IS NULL AND ${table.changeAmountHours} IS NOT NULL))`,
      sql`((${table.changeAmount} IS NOT NULL AND ${table.changeAmountHours} IS NULL) OR (${table.changeAmount} IS NULL AND ${table.changeAmountHours} IS NOT NULL))`
    ),
  ]
);
