# Frontend Review R1 — expense-ledger (READ-ONLY)

- **Date**: 2026-09-07
- **Reviewer wave**: review/coverage subagent, frontend read-only
- **Scope reviewed**: `frontend/common/views/dashboard/accounting/expenses/**`
  (ViewModel ×2, container, grid, filter bar, chips, dialogs ×2, drawer, confirm
  hook, 4 test suites), `frontend/common/stores/expenseFilterStore.ts`,
  `frontend/common/graphql/sharedDocuments/billing/expense.documents.ts`,
  `frontend/desktop|mobile/views/dashboard/accounting/expenses/*`,
  `app/(dashboard)/accounting/expenses/**`, `shared/locale/{types,en,ar,namespaces}/dashboard/accounting/expenses*`,
  locale snapshots, nav keys.
- **Verification**: all 22 in-scope source files re-run through
  `~/.bun/bin/bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
  on the current shared tree → **exit 0 for every file** (tsgo, oxlint, biome,
  lint:type-aware, intra-file duplicates, codescene). UI/E2E not run (policy).

## Convention audit results (all PASS)

- **MUI v9**: no style props (`mb`/`p`/`fontWeight`/`alignItems`/…) as direct
  props on Typography/Stack/Box/Grid anywhere in the expenses surface — all go
  through `sx`; icons use `*Outlined` names; `htmlInput`/`slotProps` used for
  date pickers per the v9 convention.
- **Theme tokens only**: zero hardcoded hex/rgb/color-name values in the
  reviewed files; all colors via theme-callback palette pairs
  (`errorContainer`/`onErrorContainer`, `infoContainer`, `status.*`, …).
- **React 19**: no `FormEvent`; render-time state adjustment
  (`prevOpen`/`wasOpen` compare) used instead of setState-in-effect for dialog
  session resets; no `MutableRefObject`.
- **Apollo**: documents in
  `frontend/common/graphql/sharedDocuments/billing/expense.documents.ts` follow
  the `{camelCase}QueryDocument`/`TypedDocumentNode` convention; `id` is present
  on every object selection set (row fragment + `ExpensePage` +
  `DeleteExpenseResult` + `BulkDeleteExpensesResult`); no `useLazyQuery`
  anywhere; hooks imported from `@apollo/client/react`; cache eviction of the
  `expenses` root field after every write (aggregates depend on all rows).
- **Zustand**: `expenseFilterStore.ts` is non-persisted (no serialization
  risk), fields mirror `ExpenseFilter` 1:1 (no mapping layer), filter setters
  reset the page, `clearFilters` also drops the selection — matches the
  carryover precedent and the stores AGENTS rules.
- **i18n zero hardcoded copy**: grep + read-through found no user-facing string
  literals in any expenses component (only the em-dash placeholder `—`, the
  repo-wide convention); AR leaf uses full CLDR ladders (0/1/2/3–10/11+) for
  `selectedCount`, `modal.bulkDelete.title`, `success.bulkDeleted`; all
  interpolation arities match the `ExpensesLabels` type signatures
  (`summary(title, value, currency)`, `drawer.title(title)`,
  `modal.form.sourceBanner(source)`, count-functions). Snapshots
  `public/static/locale-snapshots/{en,ar}/dashboard.accounting.expenses.json`
  exist and contain every group incl. `drawer` and `deletedBadge`; both surfaces
  (eager `messages.ts` + lazy namespace loader) are wired.
- **Permission gating**: server gate `AppPermission.ACCOUNTING_EXPENSES_VIEW`
  via `withPageAuth` on both routes; client `canViewExpenses` also `skip`s the
  query; `canManageExpenses` hides Add New / Bulk Delete / checkbox selection /
  Edit-Delete menu items while View Source + Export CSV stay viewer-accessible.
  Sidebar item + `PAGE_PERMISSIONS.accountingExpenses*` + `accountingExpenses`
  nav label keys (EN/AR/type) all present.
- **A11y**: `aria-invalid` on validated form fields; IconButtons carry
  translated `aria-label`s; menus wire `aria-haspopup`/`aria-expanded`/
  `aria-controls`; the blocking delete banner is `role="alert"` (consistent
  with `SessionAuditAccessDenied` etc. — `Box component="alert"` is not a real
  element, so the role is the correct choice here).
- **RTL**: logical properties used throughout (`marginInlineStart/End`,
  `textAlign: "start"`, flexbox), drawer anchor flips on `theme.direction ===
  "rtl"`.

## Findings

### LOW

1. **[LOW] `frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.tsx:69-82`
   + `useExpensesViewModel.ts:215-224` — doubled debounce.** The filter bar
   debounces keystrokes 300 ms before pushing into the store, and the ViewModel
   debounces the store value another 300 ms before query/export, so a keystroke
   takes ~600 ms to reach the network. Identical to the carryover pair
   (`CarryoverFilterBar.tsx:51-60` + `useCarryoverViewModel.ts:232-239`), so it
   is an inherited pattern — but the second hop is dead weight.
   *Fix:* drop `useDebouncedTitle` from the ViewModel (read `title` directly
   into `filterFields`); the bar already owns the debounce.

2. **[LOW] `ExpensesDataGrid.tsx:441-446` — `expenseDate` column renders the raw
   `YYYY-MM` wire string** (`textCell(value)`) while `paymentDate`/`createdAt`
   go through the locale-aware `formatAccountingDate`. In Arabic the month
   column shows Latin digits like `2026-09`.
   *Fix:* format with a month-level Intl call
   (`new Intl.DateTimeFormat(localeTag, { year: "numeric", month: "short" })`
   after parsing `YYYY-MM`), mirroring the accounting formatters.

3. **[LOW] `ExpensesDataGrid.tsx:361` and
   `frontend/mobile/views/dashboard/accounting/expenses/expenses.mobile.tsx:120-121`
   — every row's overflow-menu button has the same generic aria-label
   (`labels.column.actions`).** Screen readers cannot tell which row a menu
   belongs to.
   *Fix:* interpolate the row title, e.g. a new key
   `column.rowActions: (title: string) => string`.

4. **[LOW] `ExpenseFilterBar.tsx:345-352` — the payment-date range reuses
   `t.column.paymentDate` ("Payment date") as the range group label** whereas
   carryover has a dedicated `filters.dateRange` group label.
   *Fix:* add `filters.paymentDateRange` (EN "Payment date range" / AR
   "نطاق تاريخ الدفع") and use it for the group label.

5. **[LOW] `ExpenseSourceChip.tsx:26-41` — a row with
   `sourceEntity === "carryover_balances"` but `sourceEntityId === null` renders
   the "Manual" chip**, mislabeling provenance (server invariant makes this
   unlikely; defensive).
   *Fix:* fall through to "Manual" only when `sourceEntity` is
   `null`/`"manual"`, or render a neutral unknown-source chip.

### INFO (verified as deliberate / follow-up, no fix requested)

- **Desktop tier has no in-page drawer opener** — grid row menu is Edit /
  Delete / View Source by design; drill-down is via the
  `/accounting/expenses/[id]` deep link (mobile opens the drawer from card
  tap). Documented in outcome 4.7.
- **The 4 UI test suites (4.8/5.3) are write-only and never executed** — the
  outcome lists concrete first-run risks (MUI X year-month picker typing, MUI
  Select drive-through, option accessible names). Must be run via
  `bun run test/scripts/run-test.ts` before the plan is called complete.
- `ExpensesContainer` passes no `onSaved` to the form dialog — intentional:
  the form's own `expenses` root-field cache eviction triggers the active
  `cache-and-network` list query to refetch (carryover convention).
- `frontend/common/views/dashboard/accounting/expenses/` has no folder
  `index.ts` barrel — verified no `frontend/common/views/dashboard/**` domain
  folder ships one (carryover 4.7 precedent), so barrel conventions do not
  apply here.
- `ExpensesDataGrid.tsx` is ~830 lines; CodeScene passes and the
  repo-wide `check:duplicates` (per outcome 4.7) shows zero clones against
  the carryover grid.

## Bottom line

No MEDIUM/HIGH findings. All five issues are LOW-severity polish items. The
frontend slice is convention-faithful (MUI v9, theme tokens, React 19, Apollo,
Zustand, i18n incl. AR CLDR, RBAC gating, RTL) and every in-scope file passes
the full verification lifecycle on the current tree.
