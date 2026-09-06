import {
  booleanColumn,
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
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Carryover Balances table.
 * Aggregate settlement artefact: groups already-audited class instances into a
 * single payable record per teacher, then converts into an expense when the
 * real-world payout happens. It does not re-compute payroll.
 */
export const carryoverBalances = createTable(
  "carryover_balances",
  {
    id: uuidColumn("id"),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    studentsCount: integerColumn("students_count"),
    studentsText: varcharColumn("students_text", { length: 500 }),
    // Total billable hours across the aggregated sessions. Monetary-like exact
    // decimals are stored as text to preserve precision across dialects.
    totalDuration: textColumn("total_duration"),
    // Aggregate amount owed to the teacher, in teacherCurrency.
    payable: textColumn("payable").notNull(),
    teacherCurrency: currencyCodeEnum("teacher_currency").notNull().$type<CurrencyCode>(),
    // Amount paid so far. Equals `payable` once isPaid = true; "0" otherwise.
    paid: textColumn("paid").notNull().default("0"),
    fromDate: textColumn("from_date"),
    toDate: textColumn("to_date"),
    // Operator-supplied at bulk-to-expense time.
    paymentDate: textColumn("payment_date"),
    // Snapshot at creation time — refresh deferred to a future plan.
    isDisabledTeacher: booleanColumn("is_disabled_teacher").notNull().default(false),
    isPaid: booleanColumn("is_paid").notNull().default(false),
    // Link to the expense row created by bulk-to-expense. Plain (non-FK) column -
    // the expenses table is owned by a later module.
    expenseId: uuidDefaultColumn("expense_id"),
    note: textColumn("note"),
    createdByUserId: uuidDefaultColumn("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    paidByUserId: uuidDefaultColumn("paid_by_user_id").references(() => users.id, { onDelete: "set null" }),
    paidAt: timestampColumn("paid_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("carryover_balances_teacher_id_idx").on(table.teacherId),
    index("carryover_balances_is_paid_idx").on(table.isPaid),
    index("carryover_balances_payment_date_idx").on(table.paymentDate),
    index("carryover_balances_from_to_idx").on(table.fromDate, table.toDate),
    index("carryover_balances_is_disabled_teacher_idx").on(table.isDisabledTeacher),
    index("carryover_balances_expense_id_idx").on(table.expenseId),
    index("carryover_balances_created_by_user_id_idx").on(table.createdByUserId),
    // Uniqueness so a carryover can only be linked to one expense. No WHERE
    // clause needed: both dialects treat distinct NULLs as non-conflicting in
    // unique indexes, so unpaid rows (expense_id IS NULL) never collide.
    uniqueIndex("carryover_balances_expense_id_unique_idx").on(table.expenseId),
  ]
);

/**
 * Carryover Balance Items table.
 * One row per aggregated class instance: snapshots the session's amount,
 * currency and calculation status at carryover-create time so deletion can
 * revert sessions to their prior state, plus the converted amount in the
 * carryover's dominant currency.
 */
export const carryoverBalanceItems = createTable(
  "carryover_balance_items",
  {
    id: uuidColumn("id"),
    carryoverId: uuidDefaultColumn("carryover_id")
      .notNull()
      .references(() => carryoverBalances.id, { onDelete: "cascade" }),
    classInstanceId: uuidDefaultColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    // Snapshot of the session's amount + currency at carryover-create time.
    originalAmount: textColumn("original_amount").notNull(),
    originalCurrency: currencyCodeEnum("original_currency").notNull().$type<CurrencyCode>(),
    // Snapshot of the session's calculation status at carryover-create time
    // (so delete can revert to the prior state).
    originalStatus: varcharColumn("original_status", { length: 32 }).notNull(),
    // Snapshot of the session's partial-pay percentage. The class_instances
    // CHECK ties is_partial_percentage to the PARTIALLY status, so the link
    // transition clears the live column and this snapshot feeds the revert.
    originalPartialPercentage: integerColumn("original_partial_percentage"),
    // Converted amount in the carryover's dominant currency (NULL when
    // originalCurrency = teacherCurrency — no conversion needed).
    convertedAmount: textColumn("converted_amount"),
    convertedCurrency: currencyCodeEnum("converted_currency").$type<CurrencyCode>(),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [
    index("carryover_balance_items_carryover_id_idx").on(table.carryoverId),
    index("carryover_balance_items_class_instance_id_idx").on(table.classInstanceId),
  ]
);
