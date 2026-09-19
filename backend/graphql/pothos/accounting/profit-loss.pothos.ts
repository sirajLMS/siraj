import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { PothosObjectFieldBuilder, PothosObjectRef } from "@/backend/graphql/pothos/shared/builder-types";
import {
  CalculationStatusPothosEnum,
  CurrencyCodePothosObject,
  ExpenseTypePothosEnum,
  PaymentMethodTypePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  FxWarning,
  ProfitLossExpenseRow,
  ProfitLossExpensesPage,
  ProfitLossIncomePage,
  ProfitLossIncomeRow,
  ProfitLossPaymentRow,
  ProfitLossPaymentsPage,
  ProfitLossReport,
  ProfitLossSummary,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/** Shared field map for the FX aggregate: dominant original currency and FX-excluded row count. */
function fxAggregateCommonFields<Aggregate extends { dominantCurrency: CurrencyCode; excludedRowCount: number }>(
  t: PothosObjectFieldBuilder<Aggregate>
) {
  return {
    dominantCurrency: t.field({
      type: CurrencyCodePothosObject,
      resolve: aggregate => aggregate.dominantCurrency,
    }),
    excludedRowCount: t.field({ type: "Int", resolve: aggregate => aggregate.excludedRowCount }),
  };
}

/**
 * Registers a tab-page aggregate object type: the FX-common fields plus the tab's
 * sum field and any tab-specific extras (e.g. per-type row counts on Expenses).
 */
function tabAggregateType<Aggregate extends { dominantCurrency: CurrencyCode; excludedRowCount: number }>(
  name: string,
  sumField: keyof Aggregate & string,
  extraFields: (t: PothosObjectFieldBuilder<Aggregate>) => Record<string, unknown>
) {
  return gqlSchemaBuilder.objectRef<Aggregate>(name).implement({
    fields: t => ({
      id: t.field({ type: "ID", resolve: () => `profit-loss-${name.toLowerCase()}-aggregate` }),
      [sumField]: t.field({ type: "String", resolve: aggregate => String(aggregate[sumField]) }),
      ...fxAggregateCommonFields<Aggregate>(t),
      ...extraFields(t),
    }),
  });
}

/**
 * Shared field map for a tab page: a stable synthetic id (Apollo cache
 * normalization), the row list, and the month-wide total row count.
 */
function tabPageFields<Row>(
  t: PothosObjectFieldBuilder<{ rows: readonly Row[]; totalCount: number }>,
  pageId: string,
  rowsType: PothosObjectRef<Row>
) {
  return {
    id: t.field({ type: "ID", resolve: () => pageId }),
    rows: t.field({ type: [rowsType], resolve: page => page.rows }),
    totalCount: t.field({ type: "Int", resolve: page => page.totalCount }),
  };
}

// ─── Payments Tab: Row ──────────────────────────────────────────────────────

export const ProfitLossPaymentRowPothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossPaymentRow>("ProfitLossPaymentRow")
  .implement({
    description:
      "One completed class session in the Payments tab: joined teacher, student, and subject display fields, the student-side charge, the manual credit subtraction, and the teacher-side amount converted into the target currency (null when the FX rate is missing)",
    fields: t => ({
      id: t.field({ type: "ID", resolve: row => row.instanceId }),
      instanceId: t.exposeID("instanceId"),
      scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
      teacherName: t.exposeString("teacherName"),
      studentName: t.exposeString("studentName"),
      subjectName: t.exposeString("subjectName"),
      durationMinutes: t.exposeInt("durationMinutes"),
      studentPaidAmount: t.exposeString("studentPaidAmount"),
      studentPaidCurrency: t.expose("studentPaidCurrency", { type: CurrencyCodePothosObject }),
      convertedAmount: t.exposeString("convertedAmount", { nullable: true }),
      manualSubtractCredits: t.exposeString("manualSubtractCredits", { nullable: true }),
      manualSubtractCreditsCurrency: t.expose("manualSubtractCreditsCurrency", {
        type: CurrencyCodePothosObject,
        nullable: true,
      }),
      calculationStatus: t.expose("calculationStatus", { type: CalculationStatusPothosEnum }),
    }),
  });

// ─── Payments Tab: Page ─────────────────────────────────────────────────────

const ProfitLossPaymentsAggregateObject = tabAggregateType<ProfitLossPaymentsPage["aggregate"]>(
  "ProfitLossPaymentsAggregate",
  "totalPayments",
  t => ({ totalOriginalCurrency: t.field({ type: "String", resolve: a => a.totalOriginalCurrency }) })
);

export const ProfitLossPaymentsPagePothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossPaymentsPage>("ProfitLossPaymentsPage")
  .implement({
    description:
      "One page of the Payments tab plus aggregates over the whole accounting month; rows whose FX rate is missing are excluded from the sums and counted instead",
    fields: t => ({
      ...tabPageFields(t, "profit-loss-payments-page", ProfitLossPaymentRowPothosObject),
      aggregate: t.field({
        type: ProfitLossPaymentsAggregateObject,
        resolve: page => page.aggregate,
      }),
    }),
  });

// ─── Expenses Tab: Row ─────────────────────────────────────────────────────

export const ProfitLossExpenseRowPothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossExpenseRow>("ProfitLossExpenseRow")
  .implement({
    description:
      "One expense-ledger row with the teacher name resolved for salary payouts and the amount converted into the target currency (null when the FX rate is missing)",
    fields: t => ({
      id: t.exposeID("id"),
      title: t.exposeString("title"),
      type: t.expose("type", { type: ExpenseTypePothosEnum }),
      teacherName: t.exposeString("teacherName", { nullable: true }),
      expenseValue: t.exposeString("expenseValue"),
      expenseCurrency: t.expose("expenseCurrency", { type: CurrencyCodePothosObject }),
      convertedAmount: t.exposeString("convertedAmount", { nullable: true }),
      paymentDate: t.expose("paymentDate", { type: "DateTime" }),
      sourceEntity: t.exposeString("sourceEntity", { nullable: true }),
      sourceEntityId: t.exposeID("sourceEntityId", { nullable: true }),
      note: t.exposeString("note", { nullable: true }),
    }),
  });

// ─── Expenses Tab: Page ─────────────────────────────────────────────────────

const ProfitLossExpensesAggregateObject = tabAggregateType<ProfitLossExpensesPage["aggregate"]>(
  "ProfitLossExpensesAggregate",
  "totalExpenses",
  t => ({
    rowCountByType: t.field({ type: "JSON", resolve: aggregate => aggregate.rowCountByType }),
  })
);

export const ProfitLossExpensesPagePothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossExpensesPage>("ProfitLossExpensesPage")
  .implement({
    description:
      "One page of the Expenses tab plus aggregates over the whole accounting month, including per-type row counts",
    fields: t => ({
      ...tabPageFields(t, "profit-loss-expenses-page", ProfitLossExpenseRowPothosObject),
      aggregate: t.field({
        type: ProfitLossExpensesAggregateObject,
        resolve: page => page.aggregate,
      }),
    }),
  });

// ─── Income Payments Tab: Row ───────────────────────────────────────────────

export const ProfitLossIncomeRowPothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossIncomeRow>("ProfitLossIncomeRow")
  .implement({
    description:
      "One income payment with the joined student and parent display fields, package and invoice provenance, and the amount converted into the target currency (null when the FX rate is missing)",
    fields: t => ({
      id: t.field({ type: "ID", resolve: row => row.paymentId }),
      paymentId: t.exposeID("paymentId"),
      paymentDate: t.expose("paymentDate", { type: "DateTime" }),
      studentName: t.exposeString("studentName"),
      parentName: t.exposeString("parentName", { nullable: true }),
      amount: t.exposeString("amount"),
      currency: t.expose("currency", { type: CurrencyCodePothosObject }),
      convertedAmount: t.exposeString("convertedAmount", { nullable: true }),
      paymentMethodType: t.expose("paymentMethodType", { type: PaymentMethodTypePothosEnum }),
      packageName: t.exposeString("packageName", { nullable: true }),
      invoiceId: t.exposeID("invoiceId", { nullable: true }),
    }),
  });

// ─── Income Payments Tab: Page ──────────────────────────────────────────────

const ProfitLossIncomeAggregateObject = tabAggregateType<ProfitLossIncomePage["aggregate"]>(
  "ProfitLossIncomeAggregate",
  "totalIncomePayments",
  () => ({})
);

export const ProfitLossIncomePagePothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossIncomePage>("ProfitLossIncomePage")
  .implement({
    description:
      "One page of the Income Payments tab plus aggregates over the whole accounting month; rows whose FX rate is missing are excluded from the sums and counted instead",
    fields: t => ({
      ...tabPageFields(t, "profit-loss-income-page", ProfitLossIncomeRowPothosObject),
      aggregate: t.field({
        type: ProfitLossIncomeAggregateObject,
        resolve: page => page.aggregate,
      }),
    }),
  });

// ─── Summary ───────────────────────────────────────────────────────────────

export const ProfitLossSummaryPothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossSummary>("ProfitLossSummary")
  .implement({
    description:
      "Four-row executive summary over the selected month, all amounts as precision-safe decimal strings in the target currency; the margin is null when there is no payments base to divide by",
    fields: t => ({
      id: t.field({ type: "ID", resolve: () => "profit-loss-summary" }),
      totalIncomePayments: t.exposeString("totalIncomePayments"),
      totalPayments: t.exposeString("totalPayments"),
      totalExpenses: t.exposeString("totalExpenses"),
      netProfit: t.exposeString("netProfit"),
      netProfitMargin: t.exposeString("netProfitMargin", { nullable: true }),
      currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    }),
  });

// ─── FX Warning ─────────────────────────────────────────────────────────────

export const FxWarningPothosObject = gqlSchemaBuilder.objectRef<FxWarning>("FxWarning").implement({
  description:
    "FX-missing exclusion grouped by currency pair, powering the report's warning banner: rows kept in their original currency because no exchange rate was available",
  fields: t => ({
    id: t.field({
      type: "ID",
      resolve: warning => `${warning.originalCurrency}-${warning.targetCurrency}`,
    }),
    originalCurrency: t.expose("originalCurrency", { type: CurrencyCodePothosObject }),
    targetCurrency: t.expose("targetCurrency", { type: CurrencyCodePothosObject }),
    rowCount: t.exposeInt("rowCount"),
  }),
});

// ─── Report ────────────────────────────────────────────────────────────────

export const ProfitLossReportPothosObject = gqlSchemaBuilder.objectRef<ProfitLossReport>("ProfitLossReport").implement({
  description:
    "Read-only profit & loss payload for one accounting month: the three tab pages, the executive summary, and the FX-exclusion warnings, all converted into the selected target currency",
  fields: t => ({
    id: t.field({ type: "ID", resolve: report => `${report.month}-${report.currency}` }),
    month: t.exposeString("month"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    paymentsPage: t.expose("paymentsPage", { type: ProfitLossPaymentsPagePothosObject }),
    expensesPage: t.expose("expensesPage", { type: ProfitLossExpensesPagePothosObject }),
    incomePaymentsPage: t.expose("incomePaymentsPage", { type: ProfitLossIncomePagePothosObject }),
    profitsSummary: t.expose("profitsSummary", { type: ProfitLossSummaryPothosObject }),
    fxWarnings: t.expose("fxWarnings", { type: [FxWarningPothosObject] }),
  }),
});
