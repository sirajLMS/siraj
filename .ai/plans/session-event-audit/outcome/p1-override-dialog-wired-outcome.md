# WAVE-P-1 — Payroll Override dialog wired into the class audit views (Task 3.6 completion)

**Date:** 2026-09-05 · **Verdict: IMPLEMENTED.** Resolves the CROSS-FILE DEPENDENCY reported in
`3.6-override-dialog-wiring-outcome.md` (recipe steps 3–5) on top of the A1 data wave
(`a1-audit-payroll-data-outcome.md`). The audit page's `?openOverride=1` deep link now opens
Plan 3's payroll `OverrideDialog` with a live instance-scoped payroll snapshot, end-to-end.

## Store-flag leak fix (M-3)

Wave F wrote the deep link into `useClassDetailsStore.openOverrideDialog` — a flag shared with
the class **details** page's rate-override dialog (`OverrideRateDialog`, a different dialog with
amount/currency seeding). The flag moved to the audit-scoped store:

- `frontend/common/stores/classAuditStore.ts` — added `overrideDialogOpen: boolean` +
  `setOverrideDialogOpen(value)` next to the admin-note dialog state; included in `reset()`.
- `frontend/common/views/dashboard/classes/audit/ClassAuditContainer.tsx` — the deep-link hook
  now calls `useClassAuditStore`'s `setOverrideDialogOpen(true)`; no import of
  `useClassDetailsStore` remains, so navigating to `/classes/[id]` in the same session can no
  longer auto-open the rate dialog from a leaked flag. The comment block was rewritten to
  describe the audit-scoped flag and the query-driven summary.

## OverrideDialog row narrowing (recipe step 3)

`frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel.ts`:

- New exported `OverrideDialogRow = Pick<PayrollReportRow, "instanceId" | "calculationStatus" |
  "teacherPaidAmount" | "teacherPaidCurrency" | "calculatedDuration" | "isPartialPercentage" |
  "payrollNote">` — exactly the members the hook reads (`row?.instanceId` for submit/canSubmit,
  the six summary fields, `row?.calculationStatus` for the force checkbox).
- `UseOverrideDialogViewModelProps.row` retyped to `OverrideDialogRow | null`; new optional
  `onApplied?: () => void` invoked in `applySubmitSuccess` (after the `payrollReport` cache
  eviction, before `onClose`) so host pages can refresh their own queries.

`frontend/common/views/dashboard/accounting/payroll/OverrideDialog.tsx` mirrors both prop
changes and passes `onApplied` through to the hook. Full-row call sites
(`PayrollReportsContainer.tsx`, both dialog test suites, the details-card container harness)
type-check unchanged because the full `PayrollReportRow` structurally satisfies the Pick.

## Audit view wiring (recipe steps 4–5)

- `useClassAuditViewModel.ts` — new `useClassAuditPayroll(id, refetchAudit)` sub-hook:
  - `useQuery(classInstanceQueryDocument, { variables: { id } })` with the audit route's
    instance id (no extra lookup; instance id already drives `groupClassAudit`), plus
    `useQuery(classStatusEventsQueryDocument, { variables: { classInstanceId: id } })`.
  - Both are gated on `AppPermission.AccountingPayrollView` (`skip` otherwise); the server
    additionally strips the payroll fields for unauthorized actors, so the payroll card simply
    never mounts for them (snapshot stays `null`).
  - The instance record is passed **unchanged** as both the card's `ClassAuditPayrollSnapshot`
    and the dialog's `OverrideDialogRow` — `ClassInstanceQuery_classInstance` structurally
    satisfies both narrowed shapes; no mapping layer (per stores/frontend NO-MAPPING rules).
  - `onApplied` refetches the instance, status-events, and audit queries after a successful
    override so the summary and override history reflect the new calculation.
  - The ready view model gains `payroll`, `statusEvents`, `onOverride`, and a
    `payrollOverrideDialog: { open, row, onClose, onApplied }` slice (open/close bound to the
    new store flag). **Hardened in FIX-R (review LOW #10):** `openDialog` is a no-op unless
    the actor holds **both** `AccountingPayrollView` and `AccountingPayrollManage`, and
    `payrollOverrideDialog.open` is `open && canViewPayroll && canManagePayroll`, so a
    MANAGE-without-VIEW actor can never render a blank override dialog (the container's
    deep link may still set the store flag, but the dialog never mounts for them).
- `classAuditView.types.ts` — `ClassAuditViewProps` gains `payroll`, `statusEvents`,
  `onOverride`.
- `ClassAuditView.tsx` — threads the three props into the tier-view props and renders
  `<OverrideDialog>` next to `AdminNoteEditDialog`, feeding it `payrollOverrideDialog`.
- `classAuditViewGridShared.tsx` — passes `payroll` / `statusEvents` / `onOverride` into
  `ClassAuditDetailsCard` (props existed but were never wired).
- `classAuditView.desktop.tsx` / `classAuditView.mobile.tsx` — destructure and pass the three
  props through to the grid scaffold.
- Permission architecture honored per `docs/auth/permission-architecture.md`: the card's
  Override button renders only for `AppPermission.AccountingPayrollManage` holders (existing
  gate), the deep link only fires for MANAGE, and the mutation re-checks the permission
  server-side.

## Tests (WRITTEN, NEVER RUN)

- `ClassAuditContainer.test.tsx` — switched from `useClassDetailsStore` to the dedicated
  `useClassAuditStore` flag; the four contract cases are unchanged in spirit: param + MANAGE →
  `overrideDialogOpen === true`; no param → closed; param without MANAGE → closed; param always
  stripped from the URL.
- Static-fit updates to existing audit suites (`buildProps` / `buildReadyViewModel` gained the
  three new props plus the `payrollOverrideDialog` slice):
  - `test/ui/components/classes/classAuditView.mobile.test.tsx`
  - `test/ui/components/classes/classAuditView.test.tsx`
  - `test/ui/components/classes/classAuditAdminNoteDialog.test.tsx`
- `ClassAuditDetailsCard.test.tsx` (incl. the `AuditCardWithOverrideDialog` container-pattern
  case) needs no change: the full `PayrollReportRow` remains assignable to the narrowed prop.

## Quality pipeline

`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` → **exit 0** for every touched
file (14 total): the store, `useOverrideDialogViewModel.ts`, `OverrideDialog.tsx`,
`classAuditView.types.ts`, `useClassAuditViewModel.ts`, `ClassAuditView.tsx`,
`classAuditViewGridShared.tsx`, both tier views, `ClassAuditContainer.tsx`,
`ClassAuditContainer.test.tsx`, and the three `test/ui/components/classes/` suites. One iteration
in the view model (oxlint `no-meaningless-void-operator` on `void refetchAudit()` — the wrapper
is typed `() => void`, so the operator was dropped).

Project-wide `bun tsgo` still reports errors, all owned by other in-flight agents' files
(`carryoverBalanceId` test fixtures, `sessionAuditCellFormatters.test.ts`, and the pre-existing
A1 fallout in `classDetailsFixtures.tsx` / `classDetailsAdminView.test.tsx`); none of my files
appear in the error list, and the sub-loop's filtered tsgo is clean for each.

## Semantic review / instruction verification

- No `console.*`; no new user-facing strings (no i18n keys added).
- No plan-artifact references (REQ/Task/Phase/`.ai/`) in comments or JSDoc; comments describe
  domain behavior only.
- No styling changes (theme-palette rules vacuously satisfied); no new MUI props.
- No `useLazyQuery`; Apollo hooks imported from `@apollo/client/react`; documents imported from
  the `sharedDocuments` barrel.
- No race/serialization concern: only a boolean added to the non-persisted `classAuditStore`.
- `git status` checked: only this wave's files touched; the modified `graphql.ts`, class-details
  fixtures, and other in-flight files were left alone.
