import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { invoiceStatusEnum, invoiceTypeEnum, paymentMethodEnum } from "@/backend/db/schema/enums";
import { parents } from "@/backend/db/schema/parents";
import { students } from "@/backend/db/schema/students";
import { users } from "@/backend/db/schema/users";

// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "restrict" }),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    status: invoiceStatusEnum("status").notNull(),
    invoiceType: invoiceTypeEnum("invoice_type").notNull(),
    version: integer("version").notNull().default(0),
    exchangeRateSnapshot: numeric("exchange_rate_snapshot", { precision: 12, scale: 6 }),
    exchangeRateSource: varchar("exchange_rate_source", { length: 50 }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true, precision: 3 }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("invoices_parent_id_idx").on(table.parentId),
    index("invoices_student_id_idx").on(table.studentId),
    index("invoices_status_due_date_idx").on(table.status, table.dueDate),
    uniqueIndex("invoices_idempotency_key_unique_idx").on(table.idempotencyKey),
  ]
);

export const invoiceCoverageMonths = pgTable(
  "invoice_coverage_months",
  {
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    year: smallint("year").notNull(),
    month: smallint("month").notNull(),
  },
  table => [primaryKey({ columns: [table.invoiceId, table.year, table.month] })]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true, precision: 3 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    transactionId: varchar("transaction_id", { length: 255 }),
    gatewayResponse: text("gateway_response"),
    refundedAmount: numeric("refunded_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
    exchangeRateSnapshot: numeric("exchange_rate_snapshot", { precision: 12, scale: 6 }),
    exchangeRateSource: varchar("exchange_rate_source", { length: 50 }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("payments_invoice_id_idx").on(table.invoiceId),
    index("payments_transaction_id_idx").on(table.transactionId),
    uniqueIndex("payments_idempotency_key_unique_idx").on(table.idempotencyKey),
  ]
);

export const currencyExchangeRates = pgTable(
  "currency_exchange_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromCurrency: varchar("from_currency", { length: 10 }).notNull(),
    toCurrency: varchar("to_currency", { length: 10 }).notNull(),
    rate: numeric("rate", { precision: 12, scale: 6 }).notNull(),
    source: varchar("source", { length: 50 }),
    providerResponse: jsonb("provider_response"),
    effectiveDate: timestamp("effective_date", { withTimezone: true, precision: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("currency_exchange_rates_from_to_idx").on(table.fromCurrency, table.toCurrency),
    uniqueIndex("currency_exchange_rates_effective_unique_idx").on(
      table.fromCurrency,
      table.toCurrency,
      table.effectiveDate
    ),
  ]
);

/**
 * Currency Exchange Audit Logs table.
 * Records all changes to exchange rates for financial auditing.
 */
export const currencyExchangeAuditLogs = pgTable(
  "currency_exchange_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromCurrency: varchar("from_currency", { length: 10 }).notNull(),
    toCurrency: varchar("to_currency", { length: 10 }).notNull(),
    oldRate: numeric("old_rate", { precision: 12, scale: 6 }),
    newRate: numeric("new_rate", { precision: 12, scale: 6 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("currency_exchange_audit_from_to_idx").on(table.fromCurrency, table.toCurrency)]
);

/**
 * Currency Hedges table.
 * Tracks platform exposure to different currencies for risk management.
 */
export const currencyHedges = pgTable(
  "currency_hedges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    currency: varchar("currency", { length: 10 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    hedgeType: varchar("hedge_type", { length: 20 }).notNull(), // e.g., 'LONG', 'SHORT'
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("currency_hedges_currency_idx").on(table.currency)]
);
