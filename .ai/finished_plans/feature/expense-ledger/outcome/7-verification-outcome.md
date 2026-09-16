# Task 7.x Outcome — Verification pass (i18n sweep, a11y, RTL, NFR-11 logging)

- **Date**: 2026-09-07
- **Status**: ✅ Complete — no code fixes needed; all four checks pass

## (a) i18n key coverage — `frontend/common/views/dashboard/accounting/expenses/**`

Every user-visible string in the 13 files of the expenses view tree resolves to the
`dashboard.accounting.expenses` namespace (`ExpensesLabels`) or the shared `common`
namespace: columns, toolbar actions, filter bar, form/dialog copy, validation messages,
success/error toasts, drawer fields, aggregate footer, empty/error states, deleted
badge, selection count, export toasts. EN and AR leaves are both typed against the
shared `ExpensesLabels` interface, so a missing key cannot compile — full coverage is
enforced structurally, and reviewing both leaves confirmed every key is populated in
both locales (CLDR plurals implemented for `selectedCount`, `modal.bulkDelete.title`,
`success.bulkDeleted`). Locale snapshots
`public/static/locale-snapshots/{en,ar}/dashboard.accounting.expenses.json` exist.
Server error copy already lives in `errors.expenses` (EN + AR, 14 keys) from task 1.3.

Intentional non-namespace strings (match carryover precedent, not user copy):
- `"—"` em-dash placeholders for absent values (typographic, same convention as the
  carryover views) — localized "not set" copy is used in the drawer via
  `commonLabels.notSet`.
- `+N` overflow chip in the type multi-select preview (numeric).
- `"expenses.csv"` fallback download filename and route/URL constants.
- Form-dialog `id`/`labelId` pairs and DataGrid field names (DOM wiring, not copy).

Route shells (`app/(dashboard)/accounting/expenses/page.tsx`, `[id]/page.tsx`) take
titles from `dashboardTranslations.accountingExpenses.title` — no hardcoded copy.

## (b) Accessibility (trackable 7.2)

- **Filter bar**: title search and month picker carry `aria-label` on `htmlInput`;
  type multi-select uses an `InputLabel`/`labelId` pair; payment range and the
  include-deleted switch are labeled controls.
- **Chips**: type, source, and deleted-badge chips set `aria-label` to the full
  localized caption.
- **Grid**: `AppDataGrid` gets `ariaLabel={labels.title}`; MUI X announces sortable
  column state natively. Row action `IconButton` has `aria-label` +
  `aria-haspopup="menu"`/`aria-expanded`/`aria-controls` wiring (also in the mobile
  card menu).
- **Dialogs** (form, delete, bulk-delete via `CarryoverConfirmScaffold`): MUI `Dialog`
  supplies focus trap, focus return, and Escape/backdrop close; close is locked while
  a mutation is in flight (`onClose={busy ? undefined : onClose}`). Close icon buttons
  carry localized `aria-label` (`commonLabels.ariaClose`). Form fields set
  `aria-invalid` on error; the submit button sets `aria-busy`.
- **Drawer**: `Drawer` carries `aria-label` (expense title), close button labelled,
  loading spinner container labelled with `commonLabels.loading`; MUI `Drawer`
  supplies Escape/backdrop close.
- **Semantics**: bulk-delete summary renders as `dl/dt/dd`; the blocking
  `EXPENSE_DELETE_VIA_UNPAY` banner is a `role="alert"` region; mobile card tap target
  is a real `<button>` with a visible `focus-visible` outline and localized
  `aria-label`.

**Open item (not mine, reported):** trackable 7.2's `🧪` line asks for axe-core modal
tests. No component tests exist yet for the expense dialogs
(`test/ui/components/accounting/` has axe tests only for CreditAdjustForm /
SessionAudit*). This is new-test authoring, out of scope for this verification pass
(UI tests are write-only for this wave) — assign to whichever task owns the expense
UI test suite.

## (c) RTL sweep

No hardcoded directional styles anywhere in the expenses tree:
- Toolbar/footers use `marginInlineStart`/`marginInlineEnd` and `textAlign: "start"`;
  grep for `marginLeft/Right`, `paddingLeft/Right`, `left:`, `right:`, `float`,
  physical `textAlign` finds nothing.
- `ExpenseDetailDrawer` flips its anchor via `theme.direction === "rtl"`.
- Centered/mirrored layouts (`space-between`, `center`) are direction-symmetric.
- The money column's `align: "right" / headerAlign: "right"` matches the sibling
  `CarryoverDataGrid` precedent — numeric columns keep right alignment in RTL locales;
  deliberate, not an oversight.
- No hardcoded colors; all palette tokens (`onSurfaceVariant`, `errorContainer`,
  `onErrorContainer`, etc.) per the theme rules.

## (d) NFR-11 structured logging in `ExpenseService`

Verified present in `backend/services/expenses/expense.service.ts`:
- create → `logger.info("Expense created", { actorUserId, expenseId, type, value … })`
- insert failure → `logger.error("Expense insert failed", { actorUserId, type, error })`
  before `EXPENSE_CREATE_FAILED`
- update → `logger.info("Expense updated", { actorUserId, expenseId })`
- softDelete → `logger.info("Expense soft-deleted", { actorUserId, expenseId, reason })`
  — the logged `reason` is the already-sanitized value
- bulkDelete → `logger.info("Expenses bulk-soft-deleted", { actorUserId, requested, deleted })`
- idempotent replay → `logger.info("Expense create replayed from idempotency key", { actorUserId, expenseId })`

## Verification evidence

`~/.bun/bin/bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` — exit 0 on
all four trackable-mandated files (tsgo → oxlint → biome → lint → duplicates →
codescene):

- ✅ `backend/services/expenses/expense.service.ts` (7.4)
- ✅ `frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.tsx` (7.2)
- ✅ `frontend/common/views/dashboard/accounting/expenses/DeleteExpenseDialog.tsx` (7.2)
- ✅ `frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.tsx` (7.2)

Note: trackable 7.1 mentions `bun run locale:validate` — that script does not exist on
`main` today; locale integrity is instead enforced by the typed `ExpensesLabels`
leaves (tsgo) plus the snapshot generation script. No files were modified by this task
(the sweep found zero in-scope defects), so no fix-loop runs were needed beyond the
mandated verification files. No git mutations; `trackable-tasks.md` untouched.
