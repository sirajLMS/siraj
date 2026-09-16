# Outcome — Phase 6: Audit-grid integration (Bulk Carryover action + Linked chip)

- **Date**: 2026-09-06
- **Status**: ✅ Complete (6.1 + 6.2)

## Files

### Backend — expose `carryoverBalanceId` on the audit report row (NEW capability)

- `backend/types/billing/session-audit.types.ts` — `SessionAuditReportRow` gains
  `carryoverBalanceId: string | null` (required key, nullable value — null while
  the session is unlinked).
- `backend/db/repo/scheduling/session-audit.repository.ts` — `sessionAuditBaseQuery`
  selects `classInstances.carryoverBalanceId`; the row mapper passes it straight
  through (no joins change; no fan-out).
- `backend/graphql/pothos/accounting/session-audit.pothos.ts` —
  `carryoverBalanceId: t.exposeID("carryoverBalanceId", { nullable: true })` on
  `SessionAuditReportRowPothosObject`.
- `frontend/common/graphql/generated/{schema.graphql,gql/graphql.ts}` — regenerated
  via `bun run generate:gqlSchema && bun codegen` (schema diff: +1 field on
  `SessionAuditReportRow`; graphql.ts diff: rows type + document const only).
- Fixture-only additive `carryoverBalanceId: null` in the four row literal
  builders that stopped type-checking after the type widened:
  `backend/services/accounting/session-audit.service.test.ts`,
  `backend/services/accounting/session-audit-csv.serializer.test.ts`,
  `backend/types/billing/session-audit.types.test.ts`,
  `app/api/accounting/reports/export/route.test.ts`
  (the CSV serializer's column list is explicit and unchanged — no CSV output
  change; its test's header expectation still matches).

### Frontend documents

- `frontend/common/graphql/sharedDocuments/billing/session-audit.documents.ts` —
  rows selection adds `carryoverBalanceId` (keeps the existing alphabetical-ish
  insertion after `payrollNote`). Row type now carries the field via codegen.

### Frontend state + view model (additive)

- `frontend/common/stores/sessionAuditFilterStore.ts` — adds `selectedIds`,
  `toggleSelected`, `clearSelection` (carryover-store convention); `clearFilters`
  now also drops the selection (stale bulk ids must not survive a filter reset);
  selection is NOT part of the URL sync keys.
- `useSessionAuditReportsViewModel.ts` — exposes `selectedIds`, `toggleSelected`,
  `clearSelection` through `SessionAuditFilterSlice`, and `canManageCarryover =
  hasPermission(AppPermission.AccountingCarryoverManage)` on the view model
  (same `useUserStore` pattern as the existing `canManageReports`).

### New shared hook (duplication elimination)

- `frontend/common/components/ui/dataGrid/usePageLocalRowSelection.ts` (NEW) — the
  store-backed checkbox selection + page-turn-clears-selection wiring, extracted
  verbatim from `CarryoverDataGrid`'s private `useCarryoverRowSelection`.
- `frontend/common/components/ui/dataGrid/index.ts` — barrel re-exports it.
- `frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.tsx` —
  now consumes the shared hook (private copy + its two interfaces removed);
  behavior is unchanged, and this prevents the audit grid's selection wiring from
  cloning the carryover grid (jscpd threshold would have flagged it).

### 6.1 — Bulk-action button + confirmation dialog

- `frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog.tsx`
  (NEW) — confirmation dialog for the bulk carryover creation:
  - Summary: per-teacher grouped list (name + selected session count, CLDR
    plural via `labels.carryover.dialog.teacherLine`) + total selection count
    (`totalSessions`); the service stays the authoritative grouper.
  - Idempotency: one `clientRequestId` per dialog open (`crypto.randomUUID` in
    the open effect) + `submittedTokenRef` guard — double-click = exactly one
    mutation; failed submissions re-arm the guard so a retry reuses the token.
  - Errors (`errorPolicy: "none"`): `CARRYOVER_SESSION_NOT_AUDITED` /
    `CARRYOVER_SESSION_ALREADY_LINKED` render the server-localized message as a
    non-dismissible in-dialog banner and disable confirm (same-selection retry
    can never succeed — `ALREADY_PAID` convention from `BulkToExpenseModal`);
    every other rejection toasts via `getGraphQLErrorMessage` with
    `commonLabels.operationFailed` fallback.
  - Success: `cache.evict({ fieldName: "carryoverBalances" })` +
    `cache.evict({ fieldName: "sessionAuditReport" })` + `cache.gc()`, toast
    `carryoverLabels.success.bulkCreated(groupCount)` (existing key), then
    `onDone` (grid clears selection) + `onClose`.
- `SessionAuditDataGrid.tsx`:
  - Toolbar (visible only when `canManageCarryover`): "Carryover Balance"
    button (`id="session-audit-bulk-carryover"`, `AccountBalanceWalletOutlined`),
    disabled until the selection is non-empty; opens the dialog with the
    selected rows resolved from the visible page (`instanceId ?? id`, same id
    rule as `getRowId`).
  - Grid: `checkboxSelection={canManageCarryover}`, `disableRowSelectionOnClick`
    (row clicks keep navigating to the audit page), shared
    `usePageLocalRowSelection`; page turns clear the selection for carryover
    managers; field `__check__` added to `NON_NAVIGATING_FIELDS`.
  - Dialog rendered once inside the grid (`labels={labels.carryover}`,
    `onDone={clearSelection}`).

### 6.2 — Linked chip

- New `carryoverLink` column (after `calculationStatus`): rows with
  `carryoverBalanceId` render a clickable `Chip` (`color="success"`, outlined,
  `size="small"`) labelled `labels.carryover.linkedChip` that navigates to
  `/accounting/carryover/[id]` (the detail-drawer deep link from task 4.7);
  unlinked rows show the muted dash. `carryoverLink` is in
  `NON_NAVIGATING_FIELDS` so the chip never triggers audit-page row navigation.

### i18n (additive, EN + AR)

- `shared/locale/types/dashboard/reports/sessionAudit.ts` — new `carryover`
  group on `SessionAuditLabels`: `bulkAction`, `linkedColumn`, `linkedChip`,
  `dialog.{title,intro,teacherLine,totalSessions,confirm,cancel}` (typed
  CLDR-plural functions).
- `shared/locale/en/dashboard/reports/sessionAudit.ts`,
  `shared/locale/ar/dashboard/reports/sessionAudit.ts` — implementations;
  AR plural functions follow the 1/2/3–10/11+ branching convention from cf2.
  No new namespace handle or registration needed.
- `public/static/locale-snapshots/{en,ar}/dashboard.reports.sessionAudit.json` —
  regenerated via `bun run locale:snapshots` (only these two snapshots written).

### Tests (write-only per policy — NOT executed)

- `test/ui/components/accounting/SessionAuditDataGrid.test.tsx` — extended:
  `makeRow` gains `carryoverBalanceId: null`; `renderGrid` gains selection /
  `canManageCarryover` overrides + an Apollo `mocks` parameter; Toolpad
  `useNotifications` mock + crypto.randomUUID pinning (BulkToExpenseModal test
  convention). New describes:
  - "carryover linked chip": chip renders when `carryoverBalanceId` is set,
    click → `/accounting/carryover/<id>`, no audit-page navigation; muted
    placeholder + column header otherwise.
  - "carryover bulk action": button visible only with `_MANAGE`
    (`canManageCarryover`), disabled with an empty selection; dialog shows the
    per-teacher grouped summary + total; success path double-click fires exactly
    one mutation with `instanceIds + note:null + fixed clientRequestId`, toast
    `success.bulkCreated(1)`, and `clearSelection` runs once; a
    `CARRYOVER_SESSION_ALREADY_LINKED` rejection shows the banner, keeps the
    dialog open, disables confirm.
- `test/ui/components/translation-preload.ts` — `DashboardAccountingCarryover`
  namespace handle added (required for the dialog's toast namespace in tests).

## Sub-loop results (`--lifecycle codescene`, per file)

All 24 touched files: **PASS** (tsgo → oxlint → biome → lint:type-aware →
duplicates → codescene, exit 0). One fix en route: a `no-useless-assignment`
in `CarryoverBulkCreateDialog` (initial `groupCount = 0`) — restructured so the
success path runs inside the `try`.

## Test results (backend suites allowed to run)

- `backend/graphql/query/billing/session-audit.query.test.ts` — 15 pass / 0 fail
- `backend/services/accounting/session-audit.service.test.ts` — 23 pass / 0 fail
- `backend/services/accounting/session-audit-csv.serializer.test.ts` — 14 pass / 0 fail
- `app/api/accounting/reports/export/route.test.ts` — 25 pass / 0 fail
- `backend/types/billing/session-audit.types.test.ts` — 4 pass / 0 fail
- `backend/db/test/repo/scheduling/session-audit.repository.test.ts` — 17 pass / 0 fail

## Cross-file notes

- **Pre-existing tsgo failures (NOT this task)**: `test/ui/components/classes/
  classDetailsAdminView.test.tsx` and `test/ui/components/fixtures/
  classDetailsFixtures.tsx` fail `Store`-level tsgo against
  `ClassInstanceQuery_classInstance` — those files are unmodified at HEAD and the
  generated type is byte-identical to HEAD, so the errors pre-date this task
  (likely mid-flight work by a concurrent agent). The per-file sub-loop filters
  tsgo to the target file, so none of my files were blocked.
- `SessionAuditFilterStore.clearFilters` now also clears `selectedIds` — a
  deliberate additive behavior change (mirrors the carryover store; stale bulk
  ids must not survive a filter reset). No other `clearFilters` consumer is
  affected.
- Both audit tier views (`session-audit-reports.desktop.tsx` /
  `.mobile.tsx`) spread the full view-model into the grid, so the new
  selection/permission props flow without touching tier files.
- The Linked chip links to the `/accounting/carryover/[id]` route (the
  drawer-deep-link convention from task 4.7) rather than opening
  `CarryoverDetailDrawer` in place — the audit grid has no local drawer host and
  the route already pre-opens the drawer.
- Definition-of-done styling: the toolbar button follows the carryover grid's
  `variant="outlined"` bulk-action treatment; only one action exists, so no
  trailing-end mirror of the Export button was needed.
