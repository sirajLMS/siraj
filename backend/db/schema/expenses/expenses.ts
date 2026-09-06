import { sql } from "drizzle-orm";
import {
  checkConstraint,
  createTable,
  index,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { currencyCodeEnum, expenseTypeEnum } from "@/backend/db/schema/enums";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import type { ExpenseType } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Expense ledger table — the canonical store for all outgoing money.
 * Manual rows (operational spend) carry `sourceEntity = null`; settlement
 * flows write rows with `sourceEntity = 'carryover_balances'` plus the
 * provenance id of the originating record. Rows are never hard-deleted:
 * removal sets `deletedAt`/`deletedByUserId`/`deletedReason` so reporting
 * and audit consumers can still reconstruct history.
 *
 * Monetary values are exact-decimal strings stored as text (no float drift,
 * no dialect differences). `expenseDate` is the accounting month in
 * YYYY-MM form, enforced by a database CHECK constraint on PostgreSQL.
 */
export const expenses = createTable(
  "expenses",
  {
    id: uuidColumn("id"),
    // Nullable — set for Salaries (always) and some Logistics (reimbursement).
    teacherId: uuidDefaultColumn("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
    // Snapshot at creation time — survives teacher rename / deactivation.
    teacherName: varcharColumn("teacher_name", { length: 200 }),
    title: varcharColumn("title", { length: 200 }).notNull(),
    type: expenseTypeEnum("type").notNull().$type<ExpenseType>(),
    expenseValue: textColumn("expense_value").notNull(),
    expenseCurrency: currencyCodeEnum("expense_currency").notNull().$type<CurrencyCode>(),
    // ISO calendar date (YYYY-MM-DD) of the real-world payout.
    paymentDate: textColumn("payment_date").notNull(),
    // Accounting month (YYYY-MM) the expense belongs to.
    expenseDate: varcharColumn("expense_date", { length: 7 }).notNull(),
    note: textColumn("note"),
    // Provenance — null for manual entries, the source table name otherwise.
    sourceEntity: varcharColumn("source_entity", { length: 64 }),
    sourceEntityId: uuidDefaultColumn("source_entity_id"),
    createdByUserId: uuidDefaultColumn("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    deletedAt: timestampColumn("deleted_at"),
    deletedByUserId: uuidDefaultColumn("deleted_by_user_id").references(() => users.id, { onDelete: "set null" }),
    deletedReason: varcharColumn("deleted_reason", { length: 500 }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("expenses_teacher_id_idx").on(table.teacherId),
    index("expenses_type_idx").on(table.type),
    index("expenses_payment_date_idx").on(table.paymentDate),
    index("expenses_expense_date_idx").on(table.expenseDate),
    index("expenses_source_entity_idx").on(table.sourceEntity),
    index("expenses_source_entity_id_idx").on(table.sourceEntityId),
    index("expenses_created_by_user_id_idx").on(table.createdByUserId),
    index("expenses_deleted_at_idx").on(table.deletedAt),
    // Composite index for the most common filter (type + expense month).
    index("expenses_type_expense_date_idx").on(table.type, table.expenseDate),
    // PostgreSQL regex check keeps expenseDate in YYYY-MM form at the DB
    // layer; SQLite has no regex engine, so the check is PG-only.
    checkConstraint("expenses_expense_date_format_chk", sql`${table.expenseDate} ~ '^\\d{4}-\\d{2}$'`, null),
  ]
);
