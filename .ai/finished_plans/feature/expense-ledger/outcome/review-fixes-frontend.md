# Frontend Review R1 — Fixes — expense-ledger

- **Date**: 2026-09-07
- **Source review**: `outcome/review-frontend-R1.md` (5 LOW findings)
- **Verification**: every touched file run through
  `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` → **all
  exit 0** (tsgo, oxlint, biome, lint:type-aware, intra-file duplicates,
  codescene). Locale snapshots regenerated via `bun run locale:snapshots`
  (written: `en`/`ar` `dashboard.accounting.expenses.json`). UI/E2E not run
  (per policy).

## Findings fixed

### 1. Doubled debounce (LOW-1)
- `ExpenseFilterBar.tsx` keeps the single 300 ms debounce (filter-bar side,
  matching the carryover settle bar's `useDebouncedSearchInput`).
- `useExpensesViewModel.ts`: removed `useDebouncedTitle` (its own 300 ms hop),
  the `SEARCH_DEBOUNCE_MS` constant, and the now-unused `useEffect`/`useState`
  imports. The VM now reads `title` from the store (already settled by the
  bar) with a `.trim()` only. One debounce total, ~300 ms keystroke→query.

### 2. `expenseDate` raw `YYYY-MM` rendering (LOW-2)
- Added `formatAccountingMonth(value, locale)` to
  `frontend/common/views/dashboard/accounting/accountingFormatters.ts` —
  parses the `YYYY-MM` wire string via `new Date(y, m-1, 1)` (local-time, no
  UTC-midnight month rollback) and formats with
  `toLocaleDateString(resolveAccountingDateLocale(locale), { month: "short", year: "numeric" })`,
  the same locale resolution as `formatAccountingDate`, so AR shows Arabic
  month names/digits instead of Latin `2026-09`. Unparseable input falls back
  to the raw string; null/empty renders the `—` placeholder.
- `ExpensesDataGrid.tsx`: `expenseDate` column now uses
  `formatAccountingMonth(dateCell(value), locale)`; `textCell` import removed.

### 3. Generic row-actions aria-labels (LOW-3)
- New locale key `column.rowActions: (title: string) => string` added to the
  `ExpensesLabels` type + EN (`Actions for "{title}"`) + AR
  (`إجراءات "{title}"`) leaves; snapshots regenerated.
- `ExpensesDataGrid.tsx` `ExpenseRowActionsMenu` IconButton and
  `expenses.mobile.tsx` `ExpenseCard` menu now use
  `labels.column.rowActions(row.title ?? "")`, so screen readers distinguish
  per-row menus.

### 4. Payment-date range group label (LOW-4)
- New locale key `filters.paymentDateRange` (EN "Payment date range" / AR
  "نطاق تاريخ الدفع") added to types + en + ar + snapshots.
- `ExpenseFilterBar.tsx` passes `t.filters.paymentDateRange` to
  `PaymentDateRangeFilter` instead of reusing `t.column.paymentDate`.

### 5. Defensive Manual chip for carryover-without-id (LOW-5)
- `ExpenseSourceChip.tsx`: a row with `sourceEntity === "carryover_balances"`
  but a null/empty `sourceEntityId` now **renders nothing** instead of the
  "Manual" chip. Rationale (per `implementation.md` §5.6): Manual is defined
  as `sourceEntity IS NULL`, and the server invariant always pairs
  `sourceEntity` with `sourceEntityId`, so the branch is unreachable in
  practice; rendering nothing avoids mislabeling provenance and avoids
  introducing a third "unknown source" chip for an impossible state.

### 6. Stale aggregation comment (per fix list)
- `useExpensesViewModel.ts` `ExpenseAggregates.rowCountByType` JSDoc corrected:
  the backend reports every expense type including zero-count ones (was
  "a type with zero matching rows is absent").

### 7. Dead null guards (per fix list)
- Not surfaced after inspection: `ExpensesDataGrid.tsx:415/202` and
  `expenses.mobile.tsx:193` guard `row.type`/`row.title`, which are typed
  nullable in the generated `ExpensesQuery_expenses_rows` (`string | null`,
  `ExpenseType | null`). Removing the guards would not type-check; they are
  legal null handling, not dead code. No change.

## Files touched
- `frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel.ts`
- `frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.tsx`
- `frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.tsx`
- `frontend/common/views/dashboard/accounting/expenses/ExpenseSourceChip.tsx`
- `frontend/common/views/dashboard/accounting/accountingFormatters.ts`
- `frontend/mobile/views/dashboard/accounting/expenses/expenses.mobile.tsx`
- `shared/locale/types/dashboard/accounting/expenses.ts`
- `shared/locale/en/dashboard/accounting/expenses.ts`
- `shared/locale/ar/dashboard/accounting/expenses.ts`
- `public/static/locale-snapshots/{en,ar}/dashboard.accounting.expenses.json` (regenerated)
