import {
  booleanColumn,
  createTable,
  index,
  integerColumn,
  jsonbColumn,
  numericColumn,
  primaryKey,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { userPaymentMethods } from "@/backend/db/schema/billing/user-payment-methods";
import { packagePlans } from "@/backend/db/schema/billing/package-plans";
import {
  currencyCodeEnum,
  invoiceStatusEnum,
  invoiceTypeEnum,
  paymentGatewayEnum,
  paymentMethodTypeEnum,
} from "@/backend/db/schema/enums";
import { parents } from "@/backend/db/schema/parents/parents";
import { students } from "@/backend/db/schema/students/students";
import { users } from "@/backend/db/schema/users/users";
import type { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type { PaymentGateway } from "@/backend/enum/billing/package-plan.enum";
import type { PaymentMethodTransactionSnapshot, PaymentProofTransactionSnapshot } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
export const invoices = createTable(
  "invoices",
  {
    id: uuidColumn("id"),
    parentId: uuidDefaultColumn("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    studentId: uuidDefaultColumn("student_id").references(() => students.id, { onDelete: "restrict" }),
    issueDate: textColumn("issue_date").notNull(), // date -> text (ISO string)
    dueDate: textColumn("due_date").notNull(), // date -> text (ISO string)
    paidDate: textColumn("paid_date"), // date -> text (ISO string)
    amount: textColumn("amount").notNull(), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    status: invoiceStatusEnum("status").notNull(),
    invoiceType: invoiceTypeEnum("invoice_type").notNull(),
    // Hours granted via this invoice (denormalized from the payment row for
    // fast filtering). NULL for legacy class/monthly/manual invoices.
    creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 }),
    version: integerColumn("version").notNull().default(0),
    exchangeRateSnapshot: textColumn("exchange_rate_snapshot"), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    exchangeRateSource: varcharColumn("exchange_rate_source", { length: 50 }),
    createdByUserId: uuidDefaultColumn("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    emailSentAt: timestampColumn("email_sent_at"),
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
    deletedAt: timestampColumn("deleted_at"),
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

export const invoiceCoverageMonths = createTable(
  "invoice_coverage_months",
  {
    invoiceId: uuidDefaultColumn("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    year: integerColumn("year").notNull(), // smallint -> integer (both return number)
    month: integerColumn("month").notNull(), // smallint -> integer (both return number)
  },
  table => [primaryKey({ columns: [table.invoiceId, table.year, table.month] })]
);

export const payments = createTable(
  "payments",
  {
    id: uuidColumn("id"),
    invoiceId: uuidDefaultColumn("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    amount: textColumn("amount").notNull(), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    paymentDate: timestampColumn("payment_date").notNull(),
    userPaymentMethodId: uuidDefaultColumn("user_payment_method_id").references(() => userPaymentMethods.id, {
      onDelete: "set null",
    }),
    paymentMethodType: paymentMethodTypeEnum("payment_method_type").notNull().$type<PaymentMethodType>(),
    paymentMethodSnapshot: jsonbColumn<PaymentMethodTransactionSnapshot | PaymentProofTransactionSnapshot>(
      "payment_method_snapshot"
    ).notNull(),
    transactionId: varcharColumn("transaction_id", { length: 255 }),
    // Accounting credit-hours extension columns (all nullable/defaulted for
    // full backward compatibility with existing payment rows).
    packagePlanId: uuidDefaultColumn("package_plan_id").references(() => packagePlans.id, {
      onDelete: "set null",
    }),
    paymentGateway: paymentGatewayEnum("payment_gateway")
      .notNull()
      .default("NONE")
      .$type<PaymentGateway>(),
    creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 }),
    isPaidStatusOn: booleanColumn("is_paid_status_on").notNull().default(false),
    paymentNote: textColumn("payment_note"),
    gatewayResponse: textColumn("gateway_response"),
    refundedAmount: textColumn("refunded_amount").notNull().default("0.00"), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    exchangeRateSnapshot: textColumn("exchange_rate_snapshot"), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    exchangeRateSource: varcharColumn("exchange_rate_source", { length: 50 }),
    idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("payments_invoice_id_idx").on(table.invoiceId),
    index("payments_transaction_id_idx").on(table.transactionId),
    index("payments_user_payment_method_id_idx").on(table.userPaymentMethodId),
    index("payments_payment_method_type_idx").on(table.paymentMethodType),
    index("payments_package_plan_id_idx").on(table.packagePlanId),
    index("payments_payment_gateway_idx").on(table.paymentGateway),
    index("payments_is_paid_status_on_idx").on(table.isPaidStatusOn),
    uniqueIndex("payments_idempotency_key_unique_idx").on(table.idempotencyKey),
    index("payments_payment_date_idx").on(table.paymentDate),
    index("payments_created_at_idx").on(table.createdAt),
  ]
);

export const currencyExchangeRates = createTable(
  "currency_exchange_rates",
  {
    id: uuidColumn("id"),
    fromCurrency: currencyCodeEnum("from_currency").notNull().$type<CurrencyCode>(),
    toCurrency: currencyCodeEnum("to_currency").notNull().$type<CurrencyCode>(),
    rate: textColumn("rate").notNull(), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    source: varcharColumn("source", { length: 50 }),
    providerResponse: jsonbColumn("provider_response"),
    effectiveDate: timestampColumn("effective_date").notNull(),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
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
export const currencyExchangeAuditLogs = createTable(
  "currency_exchange_audit_logs",
  {
    id: uuidColumn("id"),
    fromCurrency: currencyCodeEnum("from_currency").notNull().$type<CurrencyCode>(),
    toCurrency: currencyCodeEnum("to_currency").notNull().$type<CurrencyCode>(),
    oldRate: textColumn("old_rate"), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    newRate: textColumn("new_rate").notNull(), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    source: varcharColumn("source", { length: 50 }).notNull(),
    changedByUserId: uuidDefaultColumn("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestampColumn("created_at").notNull(),
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
export const currencyHedges = createTable(
  "currency_hedges",
  {
    id: uuidColumn("id"),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    amount: textColumn("amount").notNull(), // numeric/decimal -> text for SQLite (precision-preserving); PG keeps numeric
    hedgeType: varcharColumn("hedge_type", { length: 20 }).notNull(), // e.g., 'LONG', 'SHORT'
    notes: textColumn("notes"),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("currency_hedges_currency_idx").on(table.currency),
    index("currency_hedges_hedge_type_idx").on(table.hedgeType),
    index("currency_hedges_created_at_idx").on(table.createdAt),
  ]
);
