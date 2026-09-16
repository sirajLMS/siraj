# Outcome — Frontend fixes for review-frontend-R1

- **Date**: 2026-09-06
- **Status**: ✅ Complete

All MEDIUM/LOW/NIT findings from `review-frontend-R1.md` are addressed except the
documented skips (chip-vs-StatusBadge precedent stays; payments `columns.*`
borrowing stays). No UI/E2E tests executed (policy); the VIEW-gating container
test was updated in place to the new contract.

## Files touched

| File | Change |
|---|---|
| `frontend/common/stores/carryoverFilterStore.ts` | Added `teacherOption: PersonOption \| null` + `setTeacher(option)` (writes both the option and `teacherId`, resets page); `setTeacherId` removed; `clearFilters`/`reset` clear the option. |
| `frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.tsx` | `useTeacherFilterSelection` local-state bridge deleted; `TeacherAutocomplete` now binds `value`/`onChange` straight to the store (`teacherOption`/`setTeacher`), so the selected teacher chip survives desktop↔mobile tier switches. |
| `frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.ts` | Slice exposes `teacherOption`/`setTeacher` (was `setTeacherId`); dead `hasActiveFilters` export removed (FilterBar computes its own from the store). |
| `frontend/common/views/dashboard/accounting/carryover/useCarryoverExport.ts` | 🆕 shared hook wrapping `handleExportCsv`: busy lock + failure/truncation toasts using the carryover namespace's own `exportFailed`/`exportTruncated`. |
| `frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.tsx` | Actions column now always renders; per-row menu gates Edit/Unpay/Delete on `canManageCarryover` while View Sessions stays for viewers. Toolbar always renders: Export CSV un-gated (read-level), Add/bulk buttons stay manage-only. Toasts moved to `useCarryoverExport` (native keys); `DashboardBillingPayroll` import dropped. Extracted `useCarryoverColumns` + `useCarryoverRowSelection` to fix the CodeScene "Large Method (130 LoC)" that the restructure pushed over the limit. |
| `frontend/mobile/views/dashboard/accounting/carryover/carryover.mobile.tsx` | `CarryoverRowMenu` now renders for all tiers with only View Sessions for non-managers (`buildRowMenuItems` gates write items). Page header actions: Export icon button for everyone (busy-locked, toasts via `useCarryoverExport`) + Add remained manage-only. |
| `frontend/common/views/dashboard/accounting/carryover/DeleteCarryoverDialog.tsx` | `row.teacherCurrency ?? ""` (+ `.trim()`) guard — no more literal "null" in the payable restatement. |
| `frontend/common/views/dashboard/accounting/carryover/UnpayCarryoverDialog.tsx` | Same `?? ""` + `.trim()` guard (parity with `BulkDeleteCarryoverDialog`). |
| `frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer.tsx` | `DetailField` value wrapper is now `<Box sx={{ typography: "bodyMd", mt: 0.5 }}>` (dir-safe div — kills the `validateDOMNesting` `<p><h3>/<div>` issue; the file convention bans Typography's `component` prop). Drawer title falls back to `labels.title` while the balance is unresolved, so the aria-label no longer reads "Carryover Balance — ". |
| `shared/locale/types/dashboard/accounting/carryover.ts` | Deleted confirmed-dead keys: `validation.studentsCountInvalid`, `error.sessionNotAudited`, `error.sessionAlreadyLinked`, `error.cannotDeletePaid`, `error.fxRateMissing` (all speculatively added by this plan; no consumer anywhere — backend uses `errors.carryover.*`). `error.alreadyPaid` stays (consumed by `BulkToExpenseModal`). |
| `shared/locale/en/dashboard/accounting/carryover.ts` | Same deletions. |
| `shared/locale/ar/dashboard/accounting/carryover.ts` | Same deletions. |
| `public/static/locale-snapshots/{en,ar}/dashboard.accounting.carryover.json` (+2 hash/meta files) | Regenerated via `bun run locale:snapshots` (4 written, hash `6034039039a37341`). |
| `frontend/common/views/dashboard/accounting/carryover/CarryoverContainer.test.tsx` | The "hides the manage toolbar…" test now asserts the intended VIEW contract: export present, View Sessions host column present, Add/bulk absent. The Toolpad notifications module mock covers the new shared hook unchanged. |

## Per-finding notes

- **M1 (gating gap)** — fixed: row overflow menu (grid + mobile card) renders for
  viewers with the single read action "View Sessions"; Edit/Unpay/Delete remain
  behind `ACCOUNTING_CARRYOVER_MANAGE`. AC-8.2 preserved (Unpay only on paid rows,
  Delete still disabled on paid rows when manage-gated).
- **M2 (tier-switch filter loss)** — fixed by persisting the selected
  `PersonOption` in the domain store, per `frontend/common/stores/AGENTS.md`
  ("page/domain stores hold the selected `PersonOption`"). The store is
  in-memory (no `persist`), which is exactly what tier-switch survival needs;
  `isOptionEqualToValue` compares by `id`, so a refetched options list still
  matches the stored option.
- **7 (VIEW-only CSV export)** — fixed: toolbar is no longer wholly manage-gated;
  Export CSV (read route, `/api/carryover/export` is VIEW-gated) renders for
  everyone, Add/bulk stay manage-only. Mobile gained its first export affordance
  (header icon button) so the exposure holds on both tiers.
- **L3 (locale wiring)** — export toasts now use `labels.exportTruncated` /
  `labels.exportFailed`. The five speculative dead keys above were deleted from
  type + en + ar; payments `columns.actions`/`columns.createdAt` borrowing kept
  (documented reuse; no native keys exist).
- **L4** — null-currency guards in both dialogs, matching bulk-delete parity.
- **L5** — DetailField body wrapper changed to a `div` (`Box`), removing invalid
  HTML nesting for the component-valued fields (TeacherCell / PayableValue h3 /
  PaidStatusChip).
- **L6** — `hasActiveFilters` removed from the ViewModel (the FilterBar's own
  store-derived computation is the single surviving one).
- **N9** — drawer title/aria-label falls back to `labels.title` until the teacher
  name resolves; no new keys needed.
- **Note #9** — chip-vs-StatusBadge precedent — no change, as instructed.

## Verification

`scripts/health/sub-loop.ts --lifecycle codescene` → **exit 0** for all touched
files: `carryoverFilterStore.ts`, `CarryoverFilterBar.tsx`,
`useCarryoverViewModel.ts`, `useCarryoverExport.ts`, `CarryoverDataGrid.tsx`
(pass 1 failed with CodeScene Large Method → hooks extracted → pass),
`carryover.mobile.tsx`, `DeleteCarryoverDialog.tsx`, `UnpayCarryoverDialog.tsx`,
`CarryoverDetailDrawer.tsx`, the three locale files, and
`CarryoverContainer.test.tsx` (each run includes project-wide tsgo filtered to
the file).

Repo-wide `bun run tsgo` currently exits 1 with two errors in
`test/ui/components/classes/classDetailsAdminView.test.tsx` and
`test/ui/components/fixtures/classDetailsFixtures.tsx` (`calculationStatus`
undefined-vs-null on `ClassInstanceQuery_classInstance`). Those files are
unmodified by this work and belong to another in-flight stream (shared tree);
flagged here for the orchestrator, not fixed (out of ownership).

## Not run

No UI component/E2E test execution (policy). The updated VIEW-gating container
test was not executed; it follows the same mock wiring as before, with the
assertions flipped to the new contract.
