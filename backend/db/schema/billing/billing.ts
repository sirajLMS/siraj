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
import { userPaymentMethods } from "@/backend/db/schema/billing/user-payment-methods";
import { currencyCodeEnum, invoiceStatusEnum, invoiceTypeEnum, paymentMethodTypeEnum } from "@/backend/db/schema/enums";
import { parents } from "@/backend/db/schema/parents/parents";
import { students } from "@/backend/db/schema/students/students";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/backend/enum";
import type { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type {
  PaymentMethodTransactionSnapshot,
  PaymentProofTransactionSnapshot,
} from "@/backend/types/billing/payment-method.types";

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
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
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
    index("invoices_due_date_idx").on(table.dueDate),
    index("invoices_paid_date_idx").on(table.paidDate),
    index("invoices_created_by_user_id_idx").on(table.createdByUserId),
    index("invoices_email_sent_at_idx").on(table.emailSentAt),
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
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    paymentDate: timestamp("payment_date", { withTimezone: true, precision: 3 }).notNull(),
    userPaymentMethodId: uuid("user_payment_method_id").references(() => userPaymentMethods.id, {
      onDelete: "set null",
    }),
    paymentMethodType: paymentMethodTypeEnum("payment_method_type").notNull().$type<PaymentMethodType>(),
    paymentMethodSnapshot: jsonb("payment_method_snapshot")
      .$type<PaymentMethodTransactionSnapshot | PaymentProofTransactionSnapshot>()
      .notNull(),
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
    index("payments_user_payment_method_id_idx").on(table.userPaymentMethodId),
    index("payments_payment_method_type_idx").on(table.paymentMethodType),
    uniqueIndex("payments_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("payments_payment_date_idx").on(table.paymentDate),
    index("payments_created_at_idx").on(table.createdAt),
  ]
);

export const currencyExchangeRates = pgTable(
  "currency_exchange_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromCurrency: currencyCodeEnum("from_currency").notNull().$type<CurrencyCode>(),
    toCurrency: currencyCodeEnum("to_currency").notNull().$type<CurrencyCode>(),
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
    index("currency_exchange_rates_effective_date_idx").on(table.effectiveDate),
    index("currency_exchange_rates_created_at_idx").on(table.createdAt),
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
    fromCurrency: currencyCodeEnum("from_currency").notNull().$type<CurrencyCode>(),
    toCurrency: currencyCodeEnum("to_currency").notNull().$type<CurrencyCode>(),
    oldRate: numeric("old_rate", { precision: 12, scale: 6 }),
    newRate: numeric("new_rate", { precision: 12, scale: 6 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("currency_exchange_audit_from_to_idx").on(table.fromCurrency, table.toCurrency),
    index("currency_exchange_audit_logs_created_at_idx").on(table.createdAt),
    index("currency_exchange_audit_logs_changed_by_user_id_idx").on(table.changedByUserId),
  ]
);

/**
 * Currency Hedges table.
 * Tracks platform exposure to different currencies for risk management.
 */
export const currencyHedges = pgTable(
  "currency_hedges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    hedgeType: varchar("hedge_type", { length: 20 }).notNull(), // e.g., 'LONG', 'SHORT'
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("currency_hedges_currency_idx").on(table.currency),
    index("currency_hedges_hedge_type_idx").on(table.hedgeType),
    index("currency_hedges_created_at_idx").on(table.createdAt),
  ]
);
