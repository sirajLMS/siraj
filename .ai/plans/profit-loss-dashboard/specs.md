# Plan 7 — Profit & Loss Dashboard: Specifications

> Spec-driven-development plan for the Siraj Station LMS executive
> Profit & Loss dashboard observed in the customer reference video
> (4-tab read-only aggregation: Payments, Expenses, Income Payments,
> Profits).

---

## 1. Overview

After Plans 5 (Carryover Balance Module) and 6 (Expense Ledger) land,
the platform has all the data needed to produce the executive P&L
dashboard shown in the reference video:

- **Payments (Earned Revenue)** — sum of student-paid amounts per
  completed session + manual subtract credits (Plan 1 + Plan 2).
- **Expenses** — sum of all `expenses` rows (Plan 6) for the month,
  including both auto-generated `Salaries` (from Plan 5) and manual
  operational expenses.
- **Income Payments (Cash-In)** — sum of student payments (packages
  purchased) — distinct from "Payments" because a student pays cash
  up-front for a package, then consumes it session-by-session.
- **Profits** — summary table combining the three: Income Payments +
  Total Payments + Total Expenses + Net Profit (Total Payments −
  Total Expenses).

The customer reference video shows a **4-tab dashboard** with a
**global month filter** (`YYYY-MM`) at the top that drives all four
tabs simultaneously. The dashboard is **read-only** — no mutations.

The Siraj LMS already has:

- `payments` table (Plan 1) — student cash-in records (purchases).
- `credit_transactions` table — per-session booking deductions +
  manual adjustments (Plan 2).
- `class_instances` table (extended by Plan 3) — `calculatedDuration`,
  `teacherPaidAmount`, `calculationStatus`.
- `expenses` table (Plan 6) — the canonical expense ledger.
- `carryover_balances` table (Plan 5) — aggregate settlement artefacts.
- A `/reports` page (currently basic / empty).

What the platform **does not yet have** is the executive P&L
dashboard that aggregates these data sources into the 4-tab view the
video shows. This plan adds the read-model queries, the Pothos
GraphQL types, and the `/accounting/profits` page — without touching
any existing write paths.

---

## 2. Goals & Non-Goals

### Goals
1. Provide a single executive P&L dashboard at `/accounting/profits`
   with 4 tabs: Payments (Earned Revenue), Expenses, Income Payments
   (Cash-In), Profits.
2. Drive all 4 tabs by a global month filter (`YYYY-MM`) at the top;
   changing the filter refetches all 4 tabs simultaneously.
3. **Payments tab** — table of completed sessions for the month with:
   scheduled date, teacher, student, subject, duration (minutes),
   student paid amount + currency, manual subtract credits (from
   Plan 2's `credit_transactions` where `adjustmentType = Subtract`).
   Footer: **Total Payments** (sum of student paid amounts + subtract
   credits).
4. **Expenses tab** — table of all `expenses` rows (Plan 6) where
   `expenseDate = <selected month>` (NOT `paymentDate` — accounting
   month is the canonical grouping). Footer: **Total Expenses**.
5. **Income Payments tab** — table of student `payments` rows where
   the payment was made in the selected month (using
   `payments.createdAt`'s month). Footer: **Total Income Payments**.
6. **Profits tab** — single summary table with 4 rows: Income
   Payments, Total Payments, Total Expenses, Net Profit (Total
   Payments − Total Expenses).
7. CSV export per tab.
8. Gate every read behind a dedicated `ACCOUNTING_PROFITS_VIEW`
   permission. No mutations, no `_MANAGE` permission needed.
9. Expose the P&L data via a single GraphQL query
   `profitLossReport(month, currency)` returning the full 4-tab
   payload so the dashboard is one network request.

### Non-Goals (out of scope for this plan)
- Mutations — the dashboard is strictly read-only.
- Cross-month comparison views (e.g., "this month vs last month")
  deferred.
- Per-teacher / per-student breakdown of P&L (deferred).
- Forecasting / budgeting (deferred).
- Multi-currency normalization at the dashboard layer — the dominant
  currency is the primary view; per-row original currencies are
  preserved in the tables.
- Drill-down from a summary cell into the underlying rows (the rows
  are already visible in the per-tab tables; no extra drill-down).
- Notifications on profit thresholds (deferred).
- Scheduled PDF / email reports (deferred).

---

## 3. Glossary

| Term                          | Meaning                                                                                              |
|-------------------------------|------------------------------------------------------------------------------------------------------|
| **P&L**                        | Profit & Loss — the executive summary view this plan delivers.                                       |
| **Global month filter**        | A single `YYYY-MM` picker at the top of the dashboard that drives all 4 tabs.                       |
| **Payments (Earned Revenue)**  | Sum of `class_instances.teacherPaidAmount`-equivalent **student-side** pay per completed session + manual subtract credits (Plan 2). Represents the revenue **earned** in the month from sessions delivered. |
| **Expenses**                   | Sum of `expenses.expenseValue` where `expenseDate = <month>` (Plan 6). Represents money **owed** in the month. |
| **Income Payments (Cash-In)**  | Sum of `payments.amount` (Plan 1) where the payment's month = selected month. Represents **cash received** in the month (distinct from revenue earned). |
| **Net Profit**                  | `Total Payments - Total Expenses` — the bottom line.                                                  |
| **Total Payments**              | Footer of the Payments tab — sum of student paid amounts + subtract credits for the month.           |
| **Total Expenses**              | Footer of the Expenses tab — sum of `expenses.expenseValue` for the month.                            |
| **Total Income Payments**       | Footer of the Income Payments tab — sum of `payments.amount` for the month.                          |
| **Dominant currency**           | The currency with the most rows across the active tab; aggregates fall back to it.                   |

---

## 4. User Stories & EARS Acceptance Criteria

EARS syntax used throughout:
- **Ubiquitous:** "The system shall <response>."
- **Event-driven:** "When <trigger>, the system shall <response>."
- **State-driven:** "While <state>, the system shall <response>."
- **Optional:** "Where <precondition>, the system shall <response>."
- **Unwanted:** "If <condition>, then the system shall <response>."

---

### US-1: Executive opens the P&L dashboard

**As an** executive / accounting operator
**I want** to open a dedicated P&L dashboard under the Accounting
section
**So that** I can see the month's earned revenue, expenses, cash-in,
and net profit in one screen.

#### Acceptance Criteria (EARS)

- **AC-1.1 (Ubiquitous)** The system shall expose a route at
  `/accounting/profits` that renders the P&L dashboard.
- **AC-1.2 (Event-driven)** When the user navigates to
  `/accounting/profits` without the `ACCOUNTING_PROFITS_VIEW`
  permission, the system shall render a 403 / insufficient-permissions
  state and shall **not** execute any P&L query.
- **AC-1.3 (State-driven)** While the user holds the
  `ACCOUNTING_PROFITS_VIEW` permission, the system shall render a
  4-tab dashboard: Payments, Expenses, Income Payments, Profits.
- **AC-1.4 (Ubiquitous)** The system shall render a global month
  filter (`YYYY-MM`) at the top of the dashboard; default value =
  current month.
- **AC-1.5 (Event-driven)** When the user changes the month filter,
  the system shall refetch all 4 tabs in a single GraphQL request
  (`profitLossReport(month, currency)`).
- **AC-1.6 (Event-driven)** When the sidebar renders for a user with
  `ACCOUNTING_PROFITS_VIEW`, the system shall show a "P&L" item under
  the `grp_finance` group with the `insights` icon and href
  `/accounting/profits`.
- **AC-1.7 (State-driven)** While the dashboard renders, the system
  shall not expose any mutation UI — no "Add", "Edit", "Delete" buttons.

---

### US-2: Global month filter + currency picker

**As an** executive
**I want** a single month picker that drives all 4 tabs + a currency
picker for the aggregates
**So that** I can compare apples-to-apples across months and
currencies.

#### Acceptance Criteria (EARS)

- **AC-2.1 (Ubiquitous)** The system shall render the global month
  filter as a MUI month picker (`YYYY-MM`); the picker is keyboard-
  navigable.
- **AC-2.2 (Event-driven)** When the user picks a month, the system
  shall debounce the change by 300 ms before refetching (so rapid
  arrow-key navigation does not spam the API).
- **AC-2.3 (Event-driven)** When the user changes the currency
  picker, the system shall refetch the report with the new currency
  — the per-row tables preserve their original currency, but the
  aggregate totals are converted via the existing FX module's latest
  rate to the selected currency.
- **AC-2.4 (Unwanted)** If the FX rate is missing for a row's
  original currency to the selected currency, the system shall
  exclude that row from the aggregate total and show a warning chip
  "N rows excluded (FX rate missing)".
- **AC-2.5 (Event-driven)** When the user navigates away from the
  dashboard and back, the system shall restore the last-selected
  month + currency (persisted in a Zustand store with
  `persist` middleware).

---

### US-3: Payments tab (Earned Revenue)

**As an** executive
**I want** to see a table of completed sessions for the month with
their student paid amounts + subtract credits
**So that** I can audit earned revenue at the session level.

#### Acceptance Criteria (EARS)

- **AC-3.1 (Ubiquitous)** The Payments tab shall render a paginated
  MUI `DataGrid` of `class_instances` rows where:
  - `executionState = COMPLETED` AND
  - `scheduledStartAt` is in the selected month AND
  - `calculationStatus IN (CALCULATED, PARTIALLY, REFUND, WAITING_PAID, PAID)`.
- **AC-3.2 (Ubiquitous)** Each row shall show: scheduled date,
  teacher name, student name, subject, duration (minutes —
  `calculatedDuration`), student paid amount + currency
  (`teacherPaidAmount` from Plan 3 — the amount the teacher is owed,
  which by accounting convention equals the amount the student paid
  for that session), manual subtract credits (from Plan 2's
  `credit_transactions` where `adjustmentType = Subtract` and
  `classInstanceId = <row.id>`).
- **AC-3.3 (Ubiquitous)** The footer of the Payments tab shall show
  **Total Payments** = sum of student paid amounts + sum of subtract
  credits (both in the dominant currency, with FX conversion when
  needed).
- **AC-3.4 (Event-driven)** When the user clicks a row, the system
  shall navigate to the existing `/classes/[id]/audit` page (Plan 4)
  for drill-down.
- **AC-3.5 (Event-driven)** When the user clicks "Export CSV" on the
  Payments tab, the system shall download the current tab's rows
  (max 10 000) as a UTF-8 CSV file.
- **AC-3.6 (Ubiquitous)** The Payments tab shall support column
  sorting (scheduled date, teacher, student, amount).

---

### US-4: Expenses tab

**As an** executive
**I want** to see a table of all expenses for the month
**So that** I can audit outgoing money at the line-item level.

#### Acceptance Criteria (EARS)

- **AC-4.1 (Ubiquitous)** The Expenses tab shall render a paginated
  MUI `DataGrid` of `expenses` rows where `expenseDate = <selected
  month>` AND `deletedAt IS NULL`.
- **AC-4.2 (Ubiquitous)** Each row shall show: title, type chip,
  teacher (when set), value + currency, payment date, source chip
  (Manual / From Carryover), note.
- **AC-4.3 (Ubiquitous)** The footer of the Expenses tab shall show
  **Total Expenses** = sum of `expenseValue` (in the dominant currency,
  with FX conversion when needed).
- **AC-4.4 (Event-driven)** When the user clicks a row, the system
  shall navigate to `/accounting/expenses/[id]` (Plan 6) for drill-down.
- **AC-4.5 (Event-driven)** When the user clicks "From Carryover"
  source chip on a row, the system shall open the CarryoverDetailDrawer
  (Plan 5) for the linked `sourceEntityId`.
- **AC-4.6 (Event-driven)** When the user clicks "Export CSV" on the
  Expenses tab, the system shall download the current tab's rows
  (max 10 000) as a UTF-8 CSV file.

---

### US-5: Income Payments tab (Cash-In)

**As an** executive
**I want** to see a table of student payments (packages purchased) for
the month
**So that** I can audit cash received in the month.

#### Acceptance Criteria (EARS)

- **AC-5.1 (Ubiquitous)** The Income Payments tab shall render a
  paginated MUI `DataGrid` of `payments` rows where the month of
  `payments.createdAt` = selected month.
- **AC-5.2 (Ubiquitous)** Each row shall show: payment date, student
  name, parent name, amount + currency, payment method (chip),
  package name (when linked), invoice id (when linked).
- **AC-5.3 (Ubiquitous)** The footer of the Income Payments tab shall
  show **Total Income Payments** = sum of `payments.amount` (in the
  dominant currency, with FX conversion when needed).
- **AC-5.4 (Event-driven)** When the user clicks a row, the system
  shall navigate to the existing `/billing/invoices` page (or the
  student's `/students/[id]` page) for drill-down.
- **AC-5.5 (Event-driven)** When the user clicks "Export CSV" on the
  Income Payments tab, the system shall download the current tab's
  rows (max 10 000) as a UTF-8 CSV file.

---

### US-6: Profits tab (summary)

**As an** executive
**I want** to see the bottom-line summary in a single table
**So that** I can answer "how much did we make this month?" at a glance.

#### Acceptance Criteria (EARS)

- **AC-6.1 (Ubiquitous)** The Profits tab shall render a single
  summary table with 4 rows:
  - **Income Payments** = Total Income Payments (US-5 AC-5.3).
  - **Total Payments** = Total Payments (US-3 AC-3.3).
  - **Total Expenses** = Total Expenses (US-4 AC-4.3).
  - **Net Profit** = Total Payments − Total Expenses.
- **AC-6.2 (Ubiquitous)** Each row shall display the value in the
  dominant currency (with FX conversion when needed).
- **AC-6.3 (State-driven)** While the Net Profit is positive, the row
  shall render with a green color; while negative, red; while zero,
  grey.
- **AC-6.4 (Event-driven)** When the user clicks "Export CSV" on the
  Profits tab, the system shall download the summary table as a CSV
  (4 rows + headers).
- **AC-6.5 (Ubiquitous)** The Profits tab shall show a "Net Profit
  Margin" derived field = `Net Profit / Total Payments * 100`
  (percentage, 1 decimal place) when `Total Payments > 0`.

---

### US-7: Single GraphQL query

**As a** performance-conscious platform
**I want** the dashboard to fetch all 4 tabs in a single GraphQL
request
**So that** I avoid 4× network round-trips and the page renders fast.

#### Acceptance Criteria (EARS)

- **AC-7.1 (Ubiquitous)** The system shall expose a single GraphQL
  query `profitLossReport(month: String!, currency: CurrencyCode)
  → ProfitLossReport` returning the full 4-tab payload:
  `paymentsPage`, `expensesPage`, `incomePaymentsPage`, `profitsSummary`.
- **AC-7.2 (State-driven)** While the dashboard mounts, the system
  shall issue **exactly one** `profitLossReport` query (no per-tab
  queries).
- **AC-7.3 (Event-driven)** When the user changes the month or
  currency filter, the system shall issue a new single query.
- **AC-7.4 (Ubiquitous)** The query shall support pagination arguments
  per tab (`paymentsLimit`, `paymentsOffset`, `expensesLimit`,
  `expensesOffset`, `incomePaymentsLimit`, `incomePaymentsOffset`)
  so large months can be paginated without refetching the aggregates.
- **AC-7.5 (State-driven)** While a tab is paginated (the user
  clicks "next page"), the system shall issue a follow-up query for
  only that tab's pagination slice (via separate `paymentsPage`,
  `expensesPage`, `incomePaymentsPage` fields exposed by the same
  query type) — the aggregates are not refetched.
- **AC-7.6 (Ubiquitous)** The `ProfitLossReport` object shall include
  `fxWarnings: [{ originalCurrency, targetCurrency, rowCount }]` so
  the UI can render the "N rows excluded" warning per AC-2.4.

---

### US-8: Permission gating

**As a** security-conscious platform
**I want** every P&L read to require a dedicated permission
**So that** only authorized executives can see the financial summary.

#### Acceptance Criteria (EARS)

- **AC-8.1 (Ubiquitous)** The system shall require the
  `ACCOUNTING_PROFITS_VIEW` permission for: viewing
  `/accounting/profits`, calling the `profitLossReport` query, and
  exporting CSV.
- **AC-8.2 (Event-driven)** When a user without
  `ACCOUNTING_PROFITS_VIEW` calls the `profitLossReport` query, the
  system shall reject with an `INSUFFICIENT_PERMISSIONS` GraphQL
  error and shall not execute the underlying queries.
- **AC-8.3 (Ubiquitous)** The system shall **not** define a
  `_MANAGE` permission for the P&L dashboard — there are no mutations
  to gate.
- **AC-8.4 (Event-driven)** When the dashboard renders, the system
  shall hide the bulk-action toolbar, Edit buttons, Delete buttons —
  none exist on this page.

---

## 5. Edge Cases

| # | Edge case                                                                                | Expected behavior                                                                                                                                              |
|---|------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E1 | Month filter changed rapidly (arrow keys).                                                | Debounced by 300 ms (AC-2.2); only the final value triggers a refetch.                                                                                          |
| E2 | Currency picker changed to a currency with no FX rate for some rows.                      | Per AC-2.4: excluded rows are not in the aggregate; warning chip rendered; per-row table still shows the original currency.                                  |
| E3 | Payments tab includes a session whose `teacherPaidCurrency` differs from the selected currency. | Row shown with original currency; FX-converted amount included in Total Payments aggregate (or excluded if FX missing).                                       |
| E4 | Expenses tab includes a `Salaries` expense (auto-generated from Plan 5).                  | Row shown with "From Carryover" chip; "From Carryover" chip clickable to open CarryoverDetailDrawer (Plan 5).                                                  |
| E5 | Income Payments tab includes a `payments` row with `amount = 0` (free trial package).     | Row shown; included in total (sum unchanged).                                                                                                                  |
| E6 | Profits tab where `Total Payments = 0` (no sessions delivered in the month).             | Net Profit Margin shows "—" (AC-6.5); Net Profit = -Total Expenses (red).                                                                                       |
| E7 | Profits tab where `Total Payments - Total Expenses = 0`.                                  | Net Profit row renders grey (AC-6.3).                                                                                                                            |
| E8 | Concurrent refetch (user changes month, then currency, before the first completes).       | Apollo's `notifyOnNetworkStatusChange` + `fetchPolicy: 'cache-and-network'` ensures the latest variables win; stale responses are discarded.                     |
| E9 | RTL / Arabic locale active.                                                              | All labels, tab names, summary values render RTL; the month picker aligns right; currency picker aligns right.                                                  |
| E10 | Operator has `ACCOUNTING_PROFITS_VIEW` only (no other accounting perms).                  | Dashboard renders fully (read-only); the sidebar's other accounting items (Payroll / Carryover / Expenses) are hidden.                                           |
| E11 | Currency picker changed to a non-ISO currency code.                                      | Mutation validation rejects with `CURRENCY_CODE_INVALID`.                                                                                                       |
| E12 | `payments` table has a row with `createdAt` in the future (clock skew).                   | Included in the month of `createdAt` — even if "future", it's a data issue, not a UI issue. The operator can filter further by date.                              |
| E13 | `expenses.expenseDate = '2024-13'` (invalid month string, schema violation).              | Should not happen — the CHECK constraint (Plan 6 §0.4) rejects it at insert time. If found in DB, the P&L Expenses tab query ignores it via `WHERE expense_date ~ '^\d{4}-\d{2}$'`.|
| E14 | CSV export of a tab with > 10 000 rows.                                                  | Server caps at 10 000; sets `X-Export-Truncated: true`; UI shows a toast.                                                                                       |
| E15 | Tab switched while a query is in flight.                                                  | The new tab's data is already in the Apollo cache (single-query payload); no extra network call.                                                                |
| E16 | Month filter set to a future month with no data.                                         | All tabs show empty state ("No data for this month"); aggregates show 0; Net Profit = 0 (grey).                                                                |
| E17 | `credit_transactions` row has `classInstanceId = NULL` (manual subtract not tied to a session). | Excluded from the Payments tab (the row requires a session link to be earned-revenue); counted under a separate "Manual Adjustments" line if needed in the future. |
| E18 | Two `payments` rows have the same `invoiceId` (duplicate recording).                     | Both rows appear in the Income Payments tab (deduplication is a data-cleanup task, not a UI concern).                                                            |
| E19 | A `class_instances` row has `calculationStatus = NOT_CALCULATED` but `executionState = COMPLETED`. | Excluded from the Payments tab (AC-3.1 lists the allowed statuses); appears in Plan 4's audit grid for the operator to fix.                                     |
| E20 | The selected month is the current month and data is still being entered.                  | The dashboard refetches on tab focus (Apollo's `reactive` policy) so newly-entered rows appear without manual refresh.                                          |

---

## 6. Non-Functional Requirements

| ID     | Category        | Requirement                                                                                                                                                          |
|--------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-1  | Performance     | The `/accounting/profits` dashboard shall render its first paint in < 2 s on a month with 1 000 sessions + 100 expenses + 200 income payments.                       |
| NFR-2  | Performance     | The `profitLossReport` query shall complete in < 800 ms p95 for a typical month (server-side aggregation + pagination slice).                                       |
| NFR-3  | Performance     | Tab switching shall be instant (no network call) — the data is already in the Apollo cache.                                                                          |
| NFR-4  | Network         | The dashboard shall issue **exactly one** GraphQL request per filter change (US-7).                                                                                  |
| NFR-5  | Security        | The `profitLossReport` query shall be authenticated + permission-scoped.                                                                                              |
| NFR-6  | Read-only       | The dashboard shall expose **zero** mutations — no `createExpense`, no `applyPayrollOverride`, no `bulkCarryoverToExpense`.                                            |
| NFR-7  | i18n            | All user-facing strings (page title, tab names, column headers, summary labels, toasts, errors) shall be available in EN and AR via the compile-time i18n pipeline. |
| NFR-8  | Accessibility   | The 4 tabs, the month picker, the currency picker, the DataGrids, and the summary table shall be keyboard-navigable and labelled for screen readers (WCAG 2.1 AA).    |
| NFR-9  | Data integrity  | The aggregation queries shall exclude soft-deleted rows (`expenses.deletedAt IS NULL`) and exclude sessions not in the allowed statuses (AC-3.1).                       |
| NFR-10 | Compatibility   | The dashboard shall be additive — no schema changes, no migrations; it reads from existing tables (Plan 1, 2, 3, 5, 6) only.                                          |
| NFR-11 | Observability   | Every query invocation shall emit a structured log event with `actorUserId`, `month`, `currency`, `durationMs`.                                                       |
| NFR-12 | Currency safety | Aggregate totals are stored in the dominant currency with FX conversion; per-row original currencies are preserved.                                                   |

---

## 7. Traceability Matrix

| AC        | Covered by implementation section                              | Test file                                                                |
|-----------|----------------------------------------------------------------|--------------------------------------------------------------------------|
| AC-1.x    | Frontend › Routes & Navigation + Tabs Shell                   | `profit-loss.page.test.tsx`                                              |
| AC-2.x    | Frontend › GlobalFilterBar + Service › FX conversion         | `profit-loss-filter.test.tsx`                                            |
| AC-3.x    | Service › `getPaymentsPage` + Frontend › PaymentsTab         | `profit-loss-payments.service.test.ts` + `PaymentsTab.test.tsx`         |
| AC-4.x    | Service › `getExpensesPage` + Frontend › ExpensesTab         | `profit-loss-expenses.service.test.ts` + `ExpensesTab.test.tsx`         |
| AC-5.x    | Service › `getIncomePaymentsPage` + Frontend › IncomePaymentsTab | `profit-loss-income.service.test.ts` + `IncomePaymentsTab.test.tsx`  |
| AC-6.x    | Service › `getProfitsSummary` + Frontend › ProfitsTab        | `profit-loss-summary.service.test.ts` + `ProfitsTab.test.tsx`           |
| AC-7.x    | GraphQL › single query + Pothos types                         | `profit-loss.query.test.ts`                                              |
| AC-8.x    | GraphQL › `requirePermission` + route middleware              | `profit-loss.query.test.ts` › "permission denied"                      |

---

## 8. Open Questions

| # | Question                                                                                                                | Status | Default assumed                                                          |
|---|-------------------------------------------------------------------------------------------------------------------------|--------|--------------------------------------------------------------------------|
| Q1 | Should the "Payments" tab use `class_instances.teacherPaidAmount` (the teacher's owed amount, equal to the student's paid amount per session) or the student's actual payment amount per session? | Open   | Use `teacherPaidAmount` (Plan 3) — by accounting convention, this equals the student's session-level paid amount. Cash-in is captured separately on the "Income Payments" tab via `payments.amount`. |
| Q2 | Should "manual subtract credits" (Plan 2) be summed into "Total Payments" or shown as a separate line? | Open   | Summed into "Total Payments" per AC-3.3 — the video shows a single total. A future "breakdown" view can split them. |
| Q3 | Should the dashboard support a "year view" (12 months side-by-side)? | Open   | No in v1 — only single-month view; year view deferred. |
| Q4 | Should the Net Profit Margin exclude income payments (since they're cash, not revenue)? | Open   | No — `Net Profit Margin = Net Profit / Total Payments * 100` (AC-6.5); cash-in is not part of the margin calc. |
| Q5 | Should the dashboard refetch on tab focus (window refocus)? | Open   | Yes (E20) — Apollo's `reactive` policy + `notifyOnNetworkStatusChange` enables this for the current month. |
| Q6 | Should the FX conversion use the rate at `paymentDate` or the latest rate? | Open   | Latest rate (simpler; matches Plan 5's carryover FX behavior). Historical rate-at-date deferred. |
| Q7 | Should the dashboard support deep-linking the selected month (e.g., `/accounting/profits?month=2024-03`)? | Open   | Yes — the month + currency are URL-encoded so a saved bookmark restores the exact view. |
