# Plan 7 — Profit & Loss Dashboard: Implementation

> Companion to `specs.md`. Describes how the Siraj LMS gains a
> read-only executive P&L dashboard at `/accounting/profits`, backed
> by a single `profitLossReport` GraphQL query that aggregates data
> from Plans 1, 2, 3, 5, and 6.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Next.js 16 App Router                          │
│                                                                            │
│   /accounting/profits                                                       │
│   ┌───────────────────────────────────────────────────────────┐             │
│   │ ProfitLossDashboard                                       │             │
│   │  ┌──────────────────────────────────────────────────────┐ │             │
│   │  │ GlobalFilterBar (Month YYYY-MM + Currency)            │ │             │
│   │  └──────────────────────────────────────────────────────┘ │             │
│   │  ┌──────────────────────────────────────────────────────┐ │             │
│   │  │ Tabs: [Payments] [Expenses] [Income Payments] [Profits]│            │
│   │  └──────────────────────────────────────────────────────┘ │             │
│   │  ┌──────────────────────────────────────────────────────┐ │             │
│   │  │ Active Tab Content (DataGrid + Footer + Export CSV)   │ │             │
│   │  └──────────────────────────────────────────────────────┘ │             │
│   │  - Apollo useQuery(PROFIT_LOSS_REPORT, { variables })     │             │
│   └────────────────────────────────┬──────────────────────────┘             │
└─────────────────────────────────────┼──────────────────────────────────────┘
                                      │ GraphQL (Pothos) — SINGLE query
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          GraphQL Layer (Pothos)                              │
│   Query: profitLossReport(month, currency, pagination) → ProfitLossReport  │
│     .paymentsPage        → ProfitLossPaymentsPage                          │
│     .expensesPage        → ProfitLossExpensesPage                          │
│     .incomePaymentsPage  → ProfitLossIncomePage                            │
│     .profitsSummary      → ProfitLossSummary                               │
│     .fxWarnings          → [FxWarning]                                     │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                Service Layer (ProfitLossService)                             │
│   getReport(actorUserId, month, currency, pagination, tErrors)             │
│     - getPaymentsPage(month, currency, pagination)    → sessions + sum     │
│     - getExpensesPage(month, currency, pagination)    → expenses + sum     │
│     - getIncomePaymentsPage(month, currency, pagination) → payments + sum │
│     - getProfitsSummary(month, currency)              → 4-row summary      │
│     - collectFxWarnings(rows)                          → FxWarning[]       │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ Drizzle ORM (read-only queries)
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL (READ-ONLY)                              │
│   class_instances  (Plan 3) — filter COMPLETED sessions in month          │
│   credit_transactions  (Plan 2) — manual subtract credits per session    │
│   expenses  (Plan 6) — filter expenseDate = month, deletedAt IS NULL      │
│   payments  (Plan 1) — filter createdAt month = selected month            │
│   carryover_balances  (Plan 5) — for source-chip drill-down only          │
│   teachers + students + users + class_subjects  (existing, joined)         │
└────────────────────────────────────────────────────────────────────────────┘
```

**Design principle:** Read-only aggregation. No mutations. No schema
changes. The dashboard reads from existing tables (Plans 1, 2, 3, 5,
6) and produces a single `ProfitLossReport` payload via one GraphQL
query.

---

## 2. Data Model

### 2.1 New permission: `ACCOUNTING_PROFITS_VIEW`

**File:** `backend/enum/permissions/permission.enum.ts`

```ts
// LMS — Accounting / P&L (Plan 7)
ACCOUNTING_PROFITS_VIEW = "accounting.profits_view",
```

Add to the seed `permission-groups` so the "Accounting" / "Finance
Manager" group gets it by default. **No `_MANAGE` permission is
defined** — the dashboard is read-only (AC-8.3).

### 2.2 No schema changes

This plan introduces **no new tables and no new columns**. All data
comes from:
- `class_instances` (Plan 3 columns: `calculatedDuration`,
  `teacherPaidAmount`, `teacherPaidCurrency`, `calculationStatus`,
  `scheduledStartAt`, `executionState`, `outcome`).
- `credit_transactions` (Plan 2: `adjustmentType = Subtract`,
  `classInstanceId`).
- `expenses` (Plan 6: `expenseDate`, `expenseValue`, `expenseCurrency`,
  `type`, `sourceEntity`, `sourceEntityId`, `deletedAt`).
- `payments` (Plan 1: `amount`, `currency`, `createdAt`, `studentId`,
  `paymentMethodType`).
- `carryover_balances` (Plan 5: for the "From Carryover" source chip
  drill-down only).
- Existing `teachers`, `students`, `users`, `class_subjects`,
  `invoices`, `payment_catalogs` for joins.

### 2.3 Database indexes (verify / add)

Confirm the following indexes exist (added by Plans 1, 3, 5, 6):

- `class_instances_scheduled_start_at_idx` (existing).
- `class_instances_calculation_status_idx` (Plan 3 §0.4).
- `class_instances_teacher_status_scheduled_idx` (Plan 3 §0.4).
- `expenses_expense_date_idx` (Plan 6 §2.3).
- `expenses_type_expense_date_idx` (Plan 6 §2.3 composite).
- `expenses_deleted_at_idx` (Plan 6 §2.3).
- `payments_created_at_idx` (Plan 1 / existing).
- `credit_transactions_class_instance_id_idx` (Plan 2 / existing).

If any are missing, add them via an additive migration. Otherwise, no
migration is needed for this plan.

---

## 3. Service Layer

**File:** `backend/services/accounting/profit-loss.service.ts`

### 3.1 New input/output types

**File:** `backend/types/accounting/profit-loss.types.ts`

```ts
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ExpenseType } from "@/backend/enum";

export interface ProfitLossInput {
  month: string;        // YYYY-MM
  currency: CurrencyCode; // target currency for aggregates
}

export interface ProfitLossPagination {
  paymentsLimit?: number;
  paymentsOffset?: number;
  expensesLimit?: number;
  expensesOffset?: number;
  incomePaymentsLimit?: number;
  incomePaymentsOffset?: number;
}

export interface ProfitLossPaymentRow {
  instanceId: string;
  scheduledStartAt: string;
  teacherName: string;
  studentName: string;
  subjectName: string;
  durationMinutes: number;
  studentPaidAmount: string;
  studentPaidCurrency: CurrencyCode;
  // Converted amount in the target currency (NULL when FX rate missing).
  convertedAmount: string | null;
  manualSubtractCredits: string | null;
  manualSubtractCreditsCurrency: CurrencyCode | null;
  calculationStatus: string;
}

export interface ProfitLossPaymentsPage {
  rows: ProfitLossPaymentRow[];
  totalCount: number;
  aggregate: {
    totalPayments: string;       // in target currency
    totalOriginalCurrency: string; // dominant original currency sum
    dominantCurrency: CurrencyCode;
    excludedRowCount: number;     // FX-missing rows
  };
}

export interface ProfitLossExpenseRow {
  id: string;
  title: string;
  type: ExpenseType;
  teacherName: string | null;
  expenseValue: string;
  expenseCurrency: CurrencyCode;
  convertedAmount: string | null;
  paymentDate: string;
  sourceEntity: string | null;
  sourceEntityId: string | null;
  note: string | null;
}

export interface ProfitLossExpensesPage {
  rows: ProfitLossExpenseRow[];
  totalCount: number;
  aggregate: {
    totalExpenses: string;
    dominantCurrency: CurrencyCode;
    excludedRowCount: number;
    rowCountByType: Record<ExpenseType, number>;
  };
}

export interface ProfitLossIncomeRow {
  paymentId: string;
  paymentDate: string;
  studentName: string;
  parentName: string | null;
  amount: string;
  currency: CurrencyCode;
  convertedAmount: string | null;
  paymentMethodType: string;
  packageName: string | null;
  invoiceId: string | null;
}

export interface ProfitLossIncomePage {
  rows: ProfitLossIncomeRow[];
  totalCount: number;
  aggregate: {
    totalIncomePayments: string;
    dominantCurrency: CurrencyCode;
    excludedRowCount: number;
  };
}

export interface ProfitLossSummary {
  totalIncomePayments: string;
  totalPayments: string;
  totalExpenses: string;
  netProfit: string;
  netProfitMargin: string | null; // percentage string, e.g. "12.5"
  currency: CurrencyCode;
}

export interface FxWarning {
  originalCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rowCount: number;
}

export interface ProfitLossReport {
  month: string;
  currency: CurrencyCode;
  paymentsPage: ProfitLossPaymentsPage;
  expensesPage: ProfitLossExpensesPage;
  incomePaymentsPage: ProfitLossIncomePage;
  profitsSummary: ProfitLossSummary;
  fxWarnings: FxWarning[];
}
```

### 3.2 `getReport` (top-level orchestrator)

```ts
export async function getReport(
  actorUserId: string,
  input: ProfitLossInput,
  pagination: ProfitLossPagination,
  tErrors: ErrorsLabels,
): Promise<ProfitLossReport> {
  await requirePermission(actorUserId, AppPermission.ACCOUNTING_PROFITS_VIEW, tErrors);
  validateMonth(input.month, tErrors);

  const [paymentsPage, expensesPage, incomePaymentsPage] = await Promise.all([
    getPaymentsPage(input, pagination, tErrors),
    getExpensesPage(input, pagination, tErrors),
    getIncomePaymentsPage(input, pagination, tErrors),
  ]);

  const profitsSummary = composeProfitsSummary(
    input.currency,
    paymentsPage.aggregate,
    expensesPage.aggregate,
    incomePaymentsPage.aggregate,
  );

  const fxWarnings = collectFxWarnings([
    paymentsPage.rows, expensesPage.rows, incomePaymentsPage.rows,
  ], input.currency);

  logger.info("P&L report generated", {
    actorUserId, month: input.month, currency: input.currency,
    paymentsCount: paymentsPage.rows.length,
    expensesCount: expensesPage.rows.length,
    incomePaymentsCount: incomePaymentsPage.rows.length,
  });

  return {
    month: input.month,
    currency: input.currency,
    paymentsPage,
    expensesPage,
    incomePaymentsPage,
    profitsSummary,
    fxWarnings,
  };
}
```

### 3.3 `getPaymentsPage` (Earned Revenue)

```ts
async function getPaymentsPage(
  input: ProfitLossInput,
  pagination: ProfitLossPagination,
  tErrors: ErrorsLabels,
): Promise<ProfitLossPaymentsPage> {
  const { rows, totalCount } = await ClassInstanceRepository.findProfitLossPayments({
    month: input.month,
    limit: pagination.paymentsLimit ?? 50,
    offset: pagination.paymentsOffset ?? 0,
  });

  // Fetch manual subtract credits per session in one batched query.
  const instanceIds = rows.map((r) => r.instanceId);
  const subtractCreditsByInstance = await CreditTransactionRepository
    .findSubtractCreditsByInstanceIds(instanceIds);

  // FX conversion (in-process, not in the SQL query — simpler).
  const convertedRows = await Promise.all(rows.map(async (r) => {
    const subtract = subtractCreditsByInstance.get(r.instanceId) ?? null;
    const convertedAmount = await convertCurrency(
      r.studentPaidAmount, r.studentPaidCurrency, input.currency,
    );
    return {
      ...r,
      convertedAmount,
      manualSubtractCredits: subtract?.amount ?? null,
      manualSubtractCreditsCurrency: subtract?.currency ?? null,
    };
  }));

  const { sum, dominantCurrency, excludedRowCount } = aggregateWithFx(
    convertedRows, (r) => r.studentPaidAmount, (r) => r.studentPaidCurrency,
    input.currency,
  );

  return {
    rows: convertedRows,
    totalCount,
    aggregate: {
      totalPayments: sum,
      totalOriginalCurrency: sum, // for clarity in v1 — same as `sum`
      dominantCurrency,
      excludedRowCount,
    },
  };
}
```

`ClassInstanceRepository.findProfitLossPayments` runs a single SQL
query:

```sql
SELECT ci.id, ci.scheduled_start_at, ci.calculated_duration,
       ci.teacher_paid_amount, ci.teacher_paid_currency, ci.calculation_status,
       u_t.display_name AS teacher_name,
       u_s.display_name AS student_name,
       cs.name AS subject_name
FROM class_instances ci
JOIN teachers t ON t.id = ci.teacher_id
JOIN users u_t ON u_t.id = t.user_id
JOIN students st ON st.id = ci.student_id
JOIN users u_s ON u_s.id = st.user_id
LEFT JOIN class_subjects cs ON cs.id = ci.class_subject_id
WHERE ci.execution_state = 'COMPLETED'
  AND ci.calculation_status IN ('Calculated', 'Partially', 'Refund', 'Waiting Paid', 'Paid')
  AND to_char(ci.scheduled_start_at, 'YYYY-MM') = $1
  AND ci.deleted_at IS NULL
ORDER BY ci.scheduled_start_at DESC
LIMIT $2 OFFSET $3;
```

### 3.4 `getExpensesPage`

```ts
async function getExpensesPage(
  input: ProfitLossInput,
  pagination: ProfitLossPagination,
  tErrors: ErrorsLabels,
): Promise<ProfitLossExpensesPage> {
  const { rows, totalCount } = await ExpenseRepository.findProfitLossExpenses({
    month: input.month,
    limit: pagination.expensesLimit ?? 50,
    offset: pagination.expensesOffset ?? 0,
  });

  const convertedRows = await Promise.all(rows.map(async (r) => ({
    ...r,
    convertedAmount: await convertCurrency(
      r.expenseValue, r.expenseCurrency, input.currency,
    ),
  })));

  const { sum, dominantCurrency, excludedRowCount } = aggregateWithFx(
    convertedRows, (r) => r.expenseValue, (r) => r.expenseCurrency,
    input.currency,
  );
  const rowCountByType = countBy(rows, (r) => r.type);

  return {
    rows: convertedRows,
    totalCount,
    aggregate: {
      totalExpenses: sum,
      dominantCurrency,
      excludedRowCount,
      rowCountByType,
    },
  };
}
```

`ExpenseRepository.findProfitLossExpenses`:

```sql
SELECT e.id, e.title, e.type, e.teacher_name, e.expense_value,
       e.expense_currency, e.payment_date, e.source_entity, e.source_entity_id,
       e.note
FROM expenses e
WHERE e.expense_date = $1
  AND e.deleted_at IS NULL
ORDER BY e.payment_date DESC
LIMIT $2 OFFSET $3;
```

### 3.5 `getIncomePaymentsPage`

```ts
async function getIncomePaymentsPage(
  input: ProfitLossInput,
  pagination: ProfitLossPagination,
  tErrors: ErrorsLabels,
): Promise<ProfitLossIncomePage> {
  const { rows, totalCount } = await PaymentRepository.findProfitLossIncome({
    month: input.month,
    limit: pagination.incomePaymentsLimit ?? 50,
    offset: pagination.incomePaymentsOffset ?? 0,
  });

  const convertedRows = await Promise.all(rows.map(async (r) => ({
    ...r,
    convertedAmount: await convertCurrency(
      r.amount, r.currency, input.currency,
    ),
  })));

  const { sum, dominantCurrency, excludedRowCount } = aggregateWithFx(
    convertedRows, (r) => r.amount, (r) => r.currency,
    input.currency,
  );

  return {
    rows: convertedRows,
    totalCount,
    aggregate: {
      totalIncomePayments: sum,
      dominantCurrency,
      excludedRowCount,
    },
  };
}
```

`PaymentRepository.findProfitLossIncome`:

```sql
SELECT p.id AS payment_id, p.created_at AS payment_date, p.amount, p.currency,
       p.payment_method_type,
       u_s.display_name AS student_name,
       u_p.display_name AS parent_name,
       pc.name AS package_name,
       i.id AS invoice_id
FROM payments p
JOIN students st ON st.id = p.student_id
JOIN users u_s ON u_s.id = st.user_id
LEFT JOIN parents pa ON pa.id = st.parent_id
LEFT JOIN users u_p ON u_p.id = pa.user_id
LEFT JOIN payment_catalogs pc ON pc.id = p.payment_catalog_id
LEFT JOIN invoices i ON i.id = p.invoice_id
WHERE to_char(p.created_at, 'YYYY-MM') = $1
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;
```

### 3.6 `composeProfitsSummary`

```ts
function composeProfitsSummary(
  currency: CurrencyCode,
  paymentsAggregate: ProfitLossPaymentsPage["aggregate"],
  expensesAggregate: ProfitLossExpensesPage["aggregate"],
  incomeAggregate: ProfitLossIncomePage["aggregate"],
): ProfitLossSummary {
  const totalPayments = Number(paymentsAggregate.totalPayments);
  const totalExpenses = Number(expensesAggregate.totalExpenses);
  const totalIncome = Number(incomeAggregate.totalIncomePayments);
  const netProfit = totalPayments - totalExpenses;
  const netProfitMargin = totalPayments > 0
    ? ((netProfit / totalPayments) * 100).toFixed(1)
    : null;

  return {
    totalIncomePayments: totalIncome.toFixed(2),
    totalPayments: totalPayments.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    netProfit: netProfit.toFixed(2),
    netProfitMargin,
    currency,
  };
}
```

### 3.7 Helpers

- `convertCurrency(amount, from, to)` → uses the existing
  `FxService.getLatestRate(from, to)`; returns `null` when the rate is
  missing (so the row is excluded from the aggregate via
  `aggregateWithFx`).
- `aggregateWithFx(rows, getAmount, getCurrency, targetCurrency)` →
  walks the rows, converts each amount, sums the converted values (or
  skips the row when `convertCurrency` returned null), returns
  `{ sum, dominantCurrency, excludedRowCount }`.
- `collectFxWarnings(allRows, targetCurrency)` → groups the excluded
  rows by `(originalCurrency, targetCurrency)` and returns
  `[{ originalCurrency, targetCurrency, rowCount }]`.
- `validateMonth(month, tErrors)` → regex `^\d{4}-\d{2}$` + range
  check (`month` 1–12); rejects with `MONTH_INVALID`.

---

## 4. GraphQL Layer (Pothos)

### 4.1 New types

**File:** `backend/graphql/pothos/accounting/profit-loss.pothos.ts`

```ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

export const ProfitLossPaymentRowPothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossPaymentRow>("ProfitLossPaymentRow")
  .implement({
    fields: (t) => ({
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
        type: CurrencyCodePothosObject, nullable: true,
      }),
      calculationStatus: t.exposeString("calculationStatus"),
    }),
  });

export const ProfitLossPaymentsPagePothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossPaymentsPage>("ProfitLossPaymentsPage")
  .implement({
    fields: (t) => ({
      rows: t.field({ type: [ProfitLossPaymentRowPothosObject], resolve: (p) => p.rows }),
      totalCount: t.exposeInt("totalCount"),
      totalPayments: t.exposeString("totalPayments"),
      dominantCurrency: t.expose("dominantCurrency", { type: CurrencyCodePothosObject }),
      excludedRowCount: t.exposeInt("excludedRowCount"),
    }),
  });

// (similar object types for Expenses / Income / Summary / FxWarning — abbreviated)

export const ProfitLossSummaryPothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossSummary>("ProfitLossSummary")
  .implement({
    fields: (t) => ({
      totalIncomePayments: t.exposeString("totalIncomePayments"),
      totalPayments: t.exposeString("totalPayments"),
      totalExpenses: t.exposeString("totalExpenses"),
      netProfit: t.exposeString("netProfit"),
      netProfitMargin: t.exposeString("netProfitMargin", { nullable: true }),
      currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    }),
  });

export const FxWarningPothosObject = gqlSchemaBuilder
  .objectRef<FxWarning>("FxWarning")
  .implement({
    fields: (t) => ({
      originalCurrency: t.expose("originalCurrency", { type: CurrencyCodePothosObject }),
      targetCurrency: t.expose("targetCurrency", { type: CurrencyCodePothosObject }),
      rowCount: t.exposeInt("rowCount"),
    }),
  });

export const ProfitLossReportPothosObject = gqlSchemaBuilder
  .objectRef<ProfitLossReport>("ProfitLossReport")
  .implement({
    fields: (t) => ({
      month: t.exposeString("month"),
      currency: t.expose("currency", { type: CurrencyCodePothosObject }),
      paymentsPage: t.field({ type: ProfitLossPaymentsPagePothosObject, resolve: (r) => r.paymentsPage }),
      expensesPage: t.field({ type: ProfitLossExpensesPagePothosObject, resolve: (r) => r.expensesPage }),
      incomePaymentsPage: t.field({ type: ProfitLossIncomePagePothosObject, resolve: (r) => r.incomePaymentsPage }),
      profitsSummary: t.field({ type: ProfitLossSummaryPothosObject, resolve: (r) => r.profitsSummary }),
      fxWarnings: t.field({ type: [FxWarningPothosObject], resolve: (r) => r.fxWarnings }),
    }),
  });
```

### 4.2 New query (single, multi-tab)

**File:** `backend/graphql/query/accounting/profit-loss.query.ts`

```ts
gqlSchemaBuilder.queryField("profitLossReport", (t) =>
  t.field({
    type: ProfitLossReportPothosObject,
    description: "Single-query P&L dashboard payload (4 tabs + summary).",
    authScopes: { permission: AppPermission.ACCOUNTING_PROFITS_VIEW },
    args: {
      month: t.arg.string({ required: true }),        // YYYY-MM
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      paymentsLimit: t.arg.int({ required: false, defaultValue: 50 }),
      paymentsOffset: t.arg.int({ required: false, defaultValue: 0 }),
      expensesLimit: t.arg.int({ required: false, defaultValue: 50 }),
      expensesOffset: t.arg.int({ required: false, defaultValue: 0 }),
      incomePaymentsLimit: t.arg.int({ required: false, defaultValue: 50 }),
      incomePaymentsOffset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ProfitLossService.getReport(
        actorUserId,
        { month: args.month, currency: args.currency },
        {
          paymentsLimit: args.paymentsLimit ?? 50,
          paymentsOffset: args.paymentsOffset ?? 0,
          expensesLimit: args.expensesLimit ?? 50,
          expensesOffset: args.expensesOffset ?? 0,
          incomePaymentsLimit: args.incomePaymentsLimit ?? 50,
          incomePaymentsOffset: args.incomePaymentsOffset ?? 0,
        },
        ctx.t().errorsTranslations,
      );
    },
  })
);
```

> **Note on AC-7.5 (per-tab pagination):** When the user clicks "next
> page" on a single tab, the frontend issues a follow-up
> `profitLossReport` query with `paymentsLimit: 50, paymentsOffset:
> 50` (for example) and `expensesLimit: 0, incomePaymentsLimit: 0`
> — effectively fetching only the Payments tab's next slice. The
> aggregates are not recomputed (the server still computes them, but
> the client uses the cached values from the first fetch). A future
> optimization: split into per-tab queries; deferred for v1.

### 4.3 CSV export endpoints

**Files:** `app/api/profit-loss/payments/export/route.ts`,
`app/api/profit-loss/expenses/export/route.ts`,
`app/api/profit-loss/income/export/route.ts`,
`app/api/profit-loss/summary/export/route.ts` — four thin Next.js
Route Handlers, each calling `ProfitLossService.getReport(...)` with
`limit: 10_000` on the relevant tab and serializing to CSV.

---

## 5. Frontend

### 5.1 Apollo documents

**File:** `frontend/common/graphql/sharedDocuments/billing/profit-loss.documents.ts`

```ts
import { gql } from "@apollo/client";

export const PROFIT_LOSS_REPORT_QUERY = gql`
  query ProfitLossReport(
    $month: String!
    $currency: CurrencyCode!
    $paymentsLimit: Int
    $paymentsOffset: Int
    $expensesLimit: Int
    $expensesOffset: Int
    $incomePaymentsLimit: Int
    $incomePaymentsOffset: Int
  ) {
    profitLossReport(
      month: $month
      currency: $currency
      paymentsLimit: $paymentsLimit
      paymentsOffset: $paymentsOffset
      expensesLimit: $expensesLimit
      expensesOffset: $expensesOffset
      incomePaymentsLimit: $incomePaymentsLimit
      incomePaymentsOffset: $incomePaymentsOffset
    ) {
      month
      currency
      paymentsPage { rows { instanceId scheduledStartAt teacherName studentName subjectName durationMinutes studentPaidAmount studentPaidCurrency convertedAmount manualSubtractCredits manualSubtractCreditsCurrency calculationStatus } totalCount totalPayments dominantCurrency excludedRowCount }
      expensesPage { rows { id title type teacherName expenseValue expenseCurrency convertedAmount paymentDate sourceEntity sourceEntityId note } totalCount totalExpenses dominantCurrency excludedRowCount rowCountByType }
      incomePaymentsPage { rows { paymentId paymentDate studentName parentName amount currency convertedAmount paymentMethodType packageName invoiceId } totalCount totalIncomePayments dominantCurrency excludedRowCount }
      profitsSummary { totalIncomePayments totalPayments totalExpenses netProfit netProfitMargin currency }
      fxWarnings { originalCurrency targetCurrency rowCount }
    }
  }
`;
```

### 5.2 Routes

| Route                            | File                                                    | Purpose                                  |
|----------------------------------|---------------------------------------------------------|------------------------------------------|
| `/accounting/profits`            | `app/(dashboard)/accounting/profits/page.tsx`           | P&L Dashboard (4 tabs)                   |

The route registers `ACCOUNTING_PROFITS_VIEW` in the page-permissions
map so the server-side auth wrapper enforces it before render.

### 5.3 Dashboard shell

**Component:** `frontend/common/views/dashboard/billing/accounting/profit-loss/ProfitLossDashboard.tsx`

- Top: `GlobalFilterBar` (month picker + currency picker + FX-warning
  chip).
- Middle: MUI `Tabs` with 4 tabs: Payments, Expenses, Income Payments,
  Profits.
- Bottom: active tab content (DataGrid + footer + Export CSV button).
- Apollo `useQuery(PROFIT_LOSS_REPORT, { variables, fetchPolicy:
  'cache-and-network', notifyOnNetworkStatusChange: true })`.

### 5.4 Global filter bar

**Component:** `frontend/common/views/dashboard/billing/accounting/profit-loss/GlobalFilterBar.tsx`

- MUI `DatePicker` (month mode) for `YYYY-MM`.
- MUI `Autocomplete` for currency (defaults to the platform's default
  currency).
- FX-warning chip: when `fxWarnings.length > 0`, render a single
  warning chip "N rows excluded (FX rate missing)" with a tooltip
  listing the currency pairs.
- Persists month + currency to URL search params (`?month=2024-03&currency=USD`)
  per Q7, and to Zustand store with `persist` middleware per AC-2.5.

### 5.5 Payments tab

**Component:** `frontend/common/views/dashboard/billing/accounting/profit-loss/PaymentsTab.tsx`

- MUI `DataGrid` v9 with columns per AC-3.2.
- Footer card: Total Payments + dominant currency + excluded row count
  + "Export CSV" button.
- Row click → `router.push('/classes/[id]/audit')` (Plan 4).

### 5.6 Expenses tab

**Component:** `frontend/common/views/dashboard/billing/accounting/profit-loss/ExpensesTab.tsx`

- MUI `DataGrid` v9 with columns per AC-4.2 (reuses Plan 6's
  `ExpenseTypeChip` + `ExpenseSourceChip` components).
- Footer card: Total Expenses + dominant currency + count-by-type +
  "Export CSV" button.
- Row click → `router.push('/accounting/expenses/[id]')` (Plan 6).
- "From Carryover" chip click → opens Plan 5's CarryoverDetailDrawer.

### 5.7 Income Payments tab

**Component:** `frontend/common/views/dashboard/billing/accounting/profit-loss/IncomePaymentsTab.tsx`

- MUI `DataGrid` v9 with columns per AC-5.2.
- Footer card: Total Income Payments + dominant currency + excluded
  row count + "Export CSV" button.
- Row click → `router.push('/billing/invoices')` filtered by invoice
  id, or `/students/[id]` for the student.

### 5.8 Profits tab

**Component:** `frontend/common/views/dashboard/billing/accounting/profit-loss/ProfitsTab.tsx`

- Single summary table with 4 rows: Income Payments, Total Payments,
  Total Expenses, Net Profit.
- Net Profit row colored green/red/grey per AC-6.3.
- Net Profit Margin percentage displayed next to Net Profit when
  `Total Payments > 0`.
- "Export CSV" button → `/api/profit-loss/summary/export?...`.

### 5.9 Zustand store

**File:** `frontend/common/stores/profitLossFilterStore.ts`

```ts
interface ProfitLossFilterState {
  month: string;        // YYYY-MM
  currency: CurrencyCode;
  activeTab: 'payments' | 'expenses' | 'income' | 'profits';
  paymentsPage: number;
  expensesPage: number;
  incomePage: number;
  pageSize: number;
  setMonth: (m: string) => void;
  setCurrency: (c: CurrencyCode) => void;
  setActiveTab: (t: ProfitLossFilterState['activeTab']) => void;
  setPaymentsPage: (n: number) => void;
  setExpensesPage: (n: number) => void;
  setIncomePage: (n: number) => void;
  reset: () => void;
}

// With `persist` middleware so month + currency + activeTab survive reload.
```

---

## 6. UX & Navigation

### 6.1 Sidebar nav item

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts`

Add to `SIDEBAR_NAV_ITEMS` under the existing `grp_finance` group:

```ts
{
  key: "accounting-profits",
  labelKey: "accountingProfits",
  iconKey: "insights",
  href: "/accounting/profits",
  section: "main",
  permission: PAGE_PERMISSIONS.accountingProfitsView,
  groupId: "grp_finance",
},
```

### 6.2 Page permissions

**File:** `frontend/common/types/page-permissions.types.ts`

```ts
accountingProfitsView: [AppPermission.ACCOUNTING_PROFITS_VIEW] as PagePermissions,
```

> No `_MANAGE` permission — the dashboard is read-only (AC-8.3).

### 6.3 Existing `/reports` page

The existing `/reports` page (currently basic/empty) is unaffected —
the P&L dashboard lives at `/accounting/profits`. A future plan can
redirect `/reports` → `/accounting/profits` or deprecate it.

---

## 7. i18n

### 7.1 Namespace

**File:** `shared/locale/types/dashboard/billing/profit-loss.ts`

New namespace `dashboard.accounting.profitLoss` with keys:

| Key                                  | EN                                                       | AR                                                       |
|--------------------------------------|----------------------------------------------------------|----------------------------------------------------------|
| `title`                              | "Profit & Loss"                                          | "الأرباح والخسائر"                                       |
| `filter.month`                       | "Month"                                                  | "الشهر"                                                  |
| `filter.currency`                    | "Currency"                                               | "العملة"                                                 |
| `tab.payments`                       | "Payments"                                               | "المدفوعات"                                              |
| `tab.expenses`                       | "Expenses"                                               | "المصروفات"                                              |
| `tab.incomePayments`                | "Income Payments"                                       | "الدفعات الواردة"                                        |
| `tab.profits`                       | "Profits"                                               | "الأرباح"                                                |
| `column.scheduledStart`            | "Scheduled start"                                       | "بداية الجلسة"                                            |
| `column.teacher`                    | "Teacher"                                                | "المعلم"                                                  |
| `column.student`                    | "Student"                                                | "الطالب"                                                  |
| `column.subject`                    | "Subject"                                                | "المادة"                                                  |
| `column.duration`                   | "Duration (min)"                                        | "المدة (دقيقة)"                                          |
| `column.studentPaidAmount`          | "Student paid"                                          | "المدفوع من الطالب"                                     |
| `column.manualSubtractCredits`      | "Subtract credits"                                      | "خصم الأرصدة"                                            |
| `column.title`                      | "Title"                                                 | "العنوان"                                                |
| `column.type`                       | "Type"                                                  | "النوع"                                                  |
| `column.value`                      | "Value"                                                 | "القيمة"                                                 |
| `column.paymentDate`                | "Payment date"                                          | "تاريخ الدفع"                                            |
| `column.paymentMethod`             | "Payment method"                                       | "طريقة الدفع"                                            |
| `column.parentName`                 | "Parent"                                                | "ول الأمر"                                              |
| `column.packageName`                | "Package"                                               | "الباقة"                                                  |
| `column.invoiceId`                  | "Invoice"                                                | "الفاتورة"                                              |
| `column.source`                     | "Source"                                                | "المصدر"                                                 |
| `aggregate.totalPayments`          | "Total Payments"                                       | "إجمالي المدفوعات"                                      |
| `aggregate.totalExpenses`          | "Total Expenses"                                       | "إجمالي المصروفات"                                      |
| `aggregate.totalIncomePayments`    | "Total Income Payments"                                | "إجمالي الدفعات الواردة"                               |
| `aggregate.netProfit`              | "Net Profit"                                           | "صافي الربح"                                            |
| `aggregate.netProfitMargin`        | "Net Profit Margin"                                    | "هامش صافي الربح"                                       |
| `aggregate.excludedRows`           | "{{count}} rows excluded (FX rate missing)"            | "{{count}} صفوف مستبعدة (سعر صرف مفقود)"                |
| `action.exportCsv`                 | "Export CSV"                                           | "تصدير CSV"                                              |
| `status.positive`                  | "Profit"                                              | "ربح"                                                    |
| `status.negative`                  | "Loss"                                                | "خسارة"                                                  |
| `status.breakeven`                 | "Break-even"                                          | "تعادل"                                                  |
| `empty.title`                      | "No data for this month"                              | "لا توجد بيانات لهذا الشهر"                              |
| `empty.description`                | "Try a different month or check back later."          | "جرّب شهرًا آخر أو تحقق لاحقًا."                          |
| `error.monthInvalid`               | "Month must be in YYYY-MM format."                    | "يجب أن يكون الشهر بصيغة YYYY-MM."                       |

### 7.2 Locale snapshot

After adding the namespace, run `bun run locale:snapshots` so the
`public/static/locale-snapshots/{en,ar}/dashboard.accounting.profitLoss.json`
files are produced.

---

## 8. Testing Strategy

### 8.1 Service-layer tests

**File:** `backend/services/accounting/profit-loss.service.test.ts`

Covers:
- `getReport` happy path — month with 5 sessions + 3 expenses + 4
  income payments → 4-tab payload returned.
- Month with no data → all tabs empty; aggregates 0; Net Profit = 0.
- Mixed currencies: USD + EUR rows; FX conversion to USD; per-row
  `convertedAmount` set; excluded rows counted.
- FX rate missing → row excluded; `fxWarnings` populated; warning
  chip rendered.
- Soft-deleted expenses excluded (AC-9).
- `NOT_CALCULATED` sessions excluded from Payments tab (AC-3.1).
- Manual subtract credits summed per session.
- Net Profit Margin = `Net Profit / Total Payments * 100` (positive,
  negative, zero-Total-Payments → null).
- Permission denied → `InsufficientPermissions`.
- `MONTH_INVALID` validation rejection.

### 8.2 Repository tests

**Files:** `backend/db/test/repo/accounting/profit-loss-payments.repository.test.ts`,
`profit-loss-expenses.repository.test.ts`, `profit-loss-income.repository.test.ts`

- Filter correctness (month, status, deletedAt).
- Pagination (limit/offset).
- Joined columns (teacher name, student name, subject name).
- SQL-computed month filter via `to_char(scheduled_start_at, 'YYYY-MM')`.

### 8.3 GraphQL tests

**File:** `backend/graphql/query/accounting/profit-loss.query.test.ts`

- Query returns the 4-tab payload shape; respects pagination args.
- Permission denied → GraphQL error.
- Missing required `month` / `currency` args → GraphQL validation error.
- Invalid `month` format → `MONTH_INVALID` GraphQL error.

### 8.4 Frontend tests

- `ProfitLossDashboard.test.tsx` — renders 4 tabs; default tab =
  Payments; month filter defaults to current month; changing the
  month refetches the single query; tab switching is instant (no
  extra network call); FX warning chip rendered when `fxWarnings.length > 0`.
- `PaymentsTab.test.tsx` — renders rows; footer shows Total Payments;
  row click navigates to `/classes/[id]/audit`; Export CSV button hits
  the right URL.
- `ExpensesTab.test.tsx` — renders rows; reuses Plan 6's chips; "From
  Carryover" chip opens CarryoverDetailDrawer.
- `IncomePaymentsTab.test.tsx` — renders rows; row click navigates to
  the right drill-down.
- `ProfitsTab.test.tsx` — summary table renders 4 rows; Net Profit
  colored green/red/grey; Net Profit Margin displayed correctly.
- `GlobalFilterBar.test.tsx` — month picker debounced 300 ms; currency
  picker refetches; URL search params updated; Zustand persists month
  + currency.

### 8.5 Migration / index verification

- Confirm the indexes listed in §2.3 exist (read the schema).
- If any are missing, add them via an additive migration + migration
  test.

### 8.6 Quality loops (per file)

Every touched file passes through:

```
bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
```

---

## 9. Cross-Plan Dependencies

| Plan            | Relationship                                                                                              |
|-----------------|----------------------------------------------------------------------------------------------------------|
| **Plan 1** (payments / billing) | Plan 7 reads `payments` for the Income Payments tab; reads `invoices` + `payment_catalogs` for drill-down metadata. |
| **Plan 2** (credit-adjustment-system) | Plan 7 reads `credit_transactions` (where `adjustmentType = Subtract`) for the Payments tab's "manual subtract credits" column. |
| **Plan 3** (teacher-payroll-engine) | Plan 7 reads `class_instances.calculatedDuration`, `teacherPaidAmount`, `teacherPaidCurrency`, `calculationStatus` for the Payments tab. |
| **Plan 5** (carryover-balance-module) | Plan 7 reads `carryover_balances` only for the "From Carryover" source-chip drill-down on the Expenses tab. No direct aggregation. |
| **Plan 6** (expense-ledger) | Plan 7 reads `expenses` (filtered to `deletedAt IS NULL`) for the Expenses tab + Total Expenses aggregate. The "From Carryover" chip reuses Plan 6's `ExpenseSourceChip`. |
| Existing FX module | Plan 7 uses `FxService.getLatestRate` for cross-currency conversion in aggregates. |
| Existing `/reports` page | Unaffected — the P&L dashboard lives at `/accounting/profits`. |

---

## 10. Risks & Mitigations

| Risk                                                                    | Mitigation                                                                                          |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Single query is slow on a large month (5 000 sessions).                  | NFR-2: < 800 ms p95; pagination slice (limit 50) keeps the payload bounded; aggregates computed via SQL `SUM()`. |
| FX rate missing for some rows produces misleading aggregates.            | AC-2.4: excluded rows are not in the aggregate; `fxWarnings` populated; UI shows warning chip.      |
| Concurrent refetch (rapid filter changes) floods the API.                | AC-2.2: debounce 300 ms; Apollo's `notifyOnNetworkStatusChange` + `fetchPolicy: 'cache-and-network'` discards stale responses. |
| Tab switching causes a re-render storm.                                  | NFR-3: tab switching is instant — data already in the Apollo cache from the single query.            |
| Mixed currencies in the Income Payments tab (rare — students usually pay in one currency). | Per-row original currency preserved; aggregate uses the dominant currency with FX conversion.       |
| Future date in `payments.createdAt` (clock skew).                       | E12: included in the month of `createdAt` — a data issue, not a UI issue.                          |
| Soft-deleted expenses drift into the P&L aggregation.                    | AC-9: aggregation query filters `deletedAt IS NULL`; the filter is also exposed via `includeDeleted` on the underlying repository. |
| Read-only constraint broken by an accidental mutation.                   | AC-8.3 + AC-8.4: no `_MANAGE` permission defined; no mutation UI on the page; the GraphQL layer defines no mutations for this module. |

---

## 11. Out-of-Scope (Deferred)

- Cross-month comparison views ("this month vs last month").
- Per-teacher / per-student breakdown of P&L.
- Forecasting / budgeting.
- Year view (12 months side-by-side).
- Per-currency aggregate totals (single dominant currency in v1).
- Drill-down from a summary cell into the underlying rows (the per-tab tables already expose the rows).
- Notifications on profit thresholds.
- Scheduled PDF / email reports.
- Historical FX rate-at-date (latest rate only in v1).
- Splitting the single `profitLossReport` query into per-tab queries for finer pagination control (deferred optimization).
- Per-tab deep-link URL params (only month + currency are URL-encoded in v1).
