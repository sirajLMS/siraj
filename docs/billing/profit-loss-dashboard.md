# Profit & Loss Dashboard — Domain Reference

> Canonical reference for the executive profit & loss dashboard (spec plan
> `profit-loss-dashboard`): the `/accounting/profits` 4-tab report, its single
> `profitLossReport` GraphQL query, the four CSV export routes, and the
> cross-actor drill-downs. Consolidates architecture, contracts, and
> battle-tested gotchas discovered during implementation. Feature specifics
> live HERE, not in AGENTS.md rule files.

## Surface Map

| Surface | Path | Gate |
|---|---|---|
| Permission | `backend/enum/permissions/permission.enum.ts` (`ACCOUNTING_PROFITS_VIEW`) + `backend/db/migration/50-accounting-profits-permissions.sql` | grants to `super_admin` + `academy_admin`; no `_MANAGE` variant (read-only dashboard) |
| Types | `backend/types/billing/profit-loss.types.ts` (`ProfitLossReport`, `FxWarning`, per-tab row/page types) | none |
| Repositories | `backend/db/repo/scheduling/class-instances.ts` (`findProfitLossPayments`), `backend/db/repo/expenses/expense.repository.ts` (`findProfitLossExpenses`), `backend/db/repo/billing/accounting-payment.repository.ts` (`findProfitLossIncome`), `backend/db/repo/billing/credit.repository.ts` (`findSubtractCreditsByInstanceIds`) | service-gated |
| FX + aggregation helpers | `backend/services/accounting/profit-loss-helpers.ts` (`convertCurrency`, `aggregateWithFx`, `collectFxWarnings`, `composeProfitsSummary`, `validateMonth`, `validatePagination`) | pure / parameterized |
| CSV serializer | `backend/services/accounting/profit-loss-csv.serializer.ts` | pure function |
| Service | `backend/services/accounting/profit-loss.service.ts` (`ProfitLossService.getReport` + per-tab fetchers) | re-checks `ACCOUNTING_PROFITS_VIEW` before any read |
| GraphQL query | `backend/graphql/query/accounting/profit-loss.query.ts` + `backend/graphql/pothos/accounting/profit-loss.pothos.ts` | scope-auth `ACCOUNTING_PROFITS_VIEW` |
| CSV export routes | `app/api/profit-loss/{payments,expenses,income,summary}/export/route.ts` | session + `ACCOUNTING_PROFITS_VIEW`; `X-Export-Truncated` header past 10 000 rows |
| Dashboard UI | `frontend/common/views/dashboard/accounting/profit-loss/` (+ `frontend/desktop\|mobile/...` tier views) | page `withPageAuth([ACCOUNTING_PROFITS_VIEW])`; nav `PAGE_PERMISSIONS.accountingProfitsView` |
| Filter store | `frontend/common/stores/profitLossFilterStore.ts` (persist, key `profit-loss-filter`) | none (client state) |
| Apollo document | `frontend/common/graphql/sharedDocuments/accounting/profit-loss.documents.ts` (`profitLossReportQueryDocument`) | none |
| i18n | `shared/locale/namespaces/dashboard/accounting/profit-loss.namespace.ts` + `shared/locale/{en,ar}/dashboard/accounting/profitLoss.ts` | snapshots in `public/static/locale-snapshots/{en,ar}/dashboard.accounting.profitLoss.json` |
| Perf rehearsal | `scripts/perf/profit-loss-rehearsal.ts` | local DB; seeds + measures + cleans up |

## Architecture (data flow)

```
repository layer (4 read paths, one per tab + credit subtract)
        ▼
ProfitLossService.getReport (permission re-check → month validation →
        Promise.all of the 3 tab fetchers → composeProfitsSummary →
        collectFxWarnings → structured log)
        ▼                                    ▼
GraphQL profitLossReport            GET /api/profit-loss/<tab>/export
(single multi-tab payload;          (locale from accept-language;
 scope-auth permission)              CSV via serializer; truncation header)
        ▼                                    ▲
profitLossReportQueryDocument ◀──── view model (one query, four tabs,
        │                           per-tab pages, URL param sync)
        ▼
ProfitLossDashboard (GlobalFilterBar + MUI Tabs + responsive tier view)
```

## Key Contracts

- **Single multi-tab query**: one GraphQL query feeds all four tabs; per-tab
  pagination rides the same query with tab-scoped limit/offset variables, so
  switching tabs never fires an extra network call beyond the page change.
- **FX conversion**: rows in a non-target currency are converted via the FX
  read path (`BillingRepository.getLatestExchangeRateForDisplay`); rows whose
  rate is missing are EXCLUDED from totals and grouped into `fxWarnings` by
  currency pair — the warning chip explains the aggregate discrepancy.
- **Total Payments** = sum of student paid amounts + manual subtract credits
  (both FX-converted into the target currency). **Net Profit** = Total
  Payments − Total Expenses. **Net Profit Margin** = Net Profit / Total
  Payments × 100 (1 decimal) when Total Payments > 0.
- **Read-only**: no mutation UI anywhere on the dashboard; no `_MANAGE`
  permission exists to gate.

## Battle-Tested Gotchas

- **`payments.createdAt` vs `paymentDate`**: the Income Payments tab filters
  on `payments.createdAt` (AC-5.1), and `recordPayment` stamps `createdAt` at
  submission time — a fixture that sets only `paymentDate` to a past/future
  month will NOT surface in that month's report. Journey tests must use the
  current month (or write `createdAt` directly).
- **`class_instances` state machine CHECK**: `execution_state = 'COMPLETED'`
  requires `outcome <> 'PENDING'`, and `outcome = 'TAKEN'` requires
  `actual_start_at IS NOT NULL`. Raw SQL fixtures must satisfy both clauses;
  the real state-machine path (`activate` → `updateStatusStart` → `stop`)
  handles them automatically.
- **`class_instances.idempotency_key` is NOT NULL + unique** — bulk SQL
  fixtures must generate one per row (`'prefix-' || g`).
- **`payments.invoice_id` is NOT NULL** — income-payment fixtures need an
  invoice row first (which itself needs a parent row, which needs a user).
- **Enum values are camelCase for expense types** (`'Salaries'`, not
  `'SALARIES'`) — the PG enum stores the camelCase strings; raw SQL inserts
  must match.
- **Permission migrations and `ALTER TYPE`**: `ALTER TYPE ... ADD VALUE` cannot
  run inside a transaction block; the migration file runs as one statement
  batch via `pg` (the DO blocks handle the trigger toggle). Applying the file
  to a second database (e.g. `siraj_test`) requires re-running it there — the
  grant does not propagate across databases.
- **Test DB vs dev DB**: the test runner (`run-test.ts`) uses `.env.test`
  (`siraj_test`); permission/catalog migrations applied only to the dev DB
  produce `ForbiddenError` in journey tests that resolve group grants. Apply
  the migration to both.
- **Notification dispatch on the write path**: `recordPayment` and the
  settlement flows legitimately dispatch notifications; only the report READ
  path dispatches nothing. Journey tests asserting "no notifications" must
  clear the spy after the fixture and assert on the read path only.
- **Cleanup order for FK RESTRICT**: `class_subjects` and `students` are
  RESTRICT-referenced by `class_instances` — delete children (instances,
  payments, expenses) before the referenced rows. Idempotency-key-based
  deletes survive partially-failed prior runs.
- **MUI v9 typography variants**: `titleMd`/`bodySm` do not exist — use
  `titleLg`/`bodyMd`/`labelUppercase`. Palette access must use the theme
  callback (`sx={theme => ({ color: theme.palette.text.secondary })}`), never
  a string literal.
- **`onRowClick` receives `GridRowParams`**, not the row directly — read
  `params.row.<field>` inside the handler.

## Cross-Plan Drill-Downs

| From | To | Mechanism |
|---|---|---|
| Payments tab row click | `/classes/[id]/audit` | `router.push` with `?highlight=payroll`; the audit page's payroll card scrolls into view and outlines itself while the param is present |
| Expenses tab row click | `/accounting/expenses/[id]` | `router.push` (Plan 6's existing detail page) |
| Expenses tab "From Carryover" chip | `CarryoverDetailDrawer` | rendered inside ExpensesTab; opens for the row's `sourceEntityId` |
| Income Payments row click | `/billing/invoices?invoiceId=...` | `router.push` when the row links an invoice |

## Testing

- Repo extension tests: `backend/db/test/repo/{scheduling,expenses,billing}/profit-loss-*.repository.test.ts`
- Service tests: `backend/services/accounting/profit-loss.service.test.ts` (mocked repos + FX), `profit-loss-helpers.test.ts`
- GraphQL tests: `backend/graphql/query/accounting/profit-loss.query.test.ts`
- CSV route tests: `app/api/profit-loss/<tab>/export/route.test.ts` (×4 — 401/403/400/truncation/formula-injection)
- Journey tests: `test/workflows/accounting/profit-loss-{cash-in-visibility,earned-revenue,expense-visibility}.test.ts`
  (real services + real DB, committed fixtures, tracked `afterAll` cleanup, NO `runInRollback`)
- Perf: `bun run scripts/perf/profit-loss-rehearsal.ts` (worst p95 measured 8.9 ms vs 800 ms target)
