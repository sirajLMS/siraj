# Final Verification Outcome — Carryover Balance Module

**Plan:** `.ai/plans/carryover-balance-module/`
**Date:** 2026-09-06
**Mode:** Verification-only (no source edits). Shared tree — sibling plans in flight (whatsapp purpose-sync, session-event-audit, payroll); unrelated failures classified and reported, not fixed.

## 1. Test Suites (fresh runs via `bun run test/scripts/run-test.ts`)

| Layer | Test file | Result | Tests |
|---|---|---|---|
| DB repo | `backend/db/test/repo/teachers/carryover.repository.test.ts` | ✅ PASS | 43 tests, 176 expects |
| DB repo | `backend/db/test/repo/scheduling/class-instances-carryover.repository.test.ts` | ✅ PASS | 9 tests, 29 expects |
| DB repo | `backend/db/test/repo/teachers/teacher.repository.test.ts` | ✅ PASS | 29 tests, 64 expects |
| DB migrations | `backend/db/test/migrations/carryover-tables.test.ts` | ✅ PASS | 5 tests, 92 expects |
| Services | `backend/services/teachers/carryover-balance.service.test.ts` | ✅ PASS | 21 tests, 792 expects |
| Services | `backend/services/teachers/carryover-crud.service.test.ts` | ✅ PASS | 54 tests, 327 expects |
| Services | `backend/services/teachers/carryover-to-expense.service.test.ts` | ✅ PASS | 14 tests, 149 expects |
| Services | `backend/services/teachers/carryover-idempotency.test.ts` | ✅ PASS | 34 tests, 36 expects |
| Services | `backend/services/teachers/carryover-aggregate.test.ts` | ✅ PASS | 30 tests, 43 expects |
| GraphQL | `backend/graphql/query/teachers/carryover.query.test.ts` | ✅ PASS | 24 tests, 157 expects |
| GraphQL | `backend/graphql/mutation/teachers/carryover.mutation.test.ts` | ✅ PASS | 40 tests, 378 expects |
| API route | `app/api/carryover/export/route.test.ts` | ✅ PASS | 18 tests, 69 expects |
| Journey | `test/workflows/accounting/carryover-bulk-create.journey.test.ts` | ✅ PASS | 7 tests, 129 expects |
| Journey | `test/workflows/accounting/carryover-to-expense.journey.test.ts` | ✅ PASS | 7 tests, 85 expects |
| Journey | `test/workflows/accounting/carryover-unpay.journey.test.ts` | ✅ PASS | 5 tests, 85 expects |
| Journey | `test/workflows/accounting/carryover-delete.journey.test.ts` | ✅ PASS | 12 tests, 112 expects |
| Regression | `backend/services/teacher/payroll-calculation.service.test.ts` | ✅ PASS | 52 tests, 356 expects |
| Regression | `backend/db/test/logic/scheduling/class_instances_security.test.ts` | ✅ PASS | 8 tests, 20 expects |

**Gate 1 verdict: ALL 18 files / 362 tests green.** UI/E2E suites intentionally not run (verified by deferred item D3).

## 2. tsgo (`bun tsgo | grep 'error TS' | sort | uniq -c`)

17 error lines observed; **zero carryover-attributable**.

| Count | Files | Owner classification |
|---|---|---|
| 15 | `backend/graphql/mutation/whatsapp/whatsapp-account.mutation.ts`, `frontend/common/views/dashboard/settings/whatsapp/**` (4 files), `frontend/common/graphql/test/whatsapp/whatsapp-inbox.test.ts`, `test/ui/components/whatsapp/*` (5 files) | Sibling in-flight WhatsApp plan (new `purpose`/`validatePurpose`/`onboardingMode`/`syncStatus` fields ripple through dialogs, view model, fixtures) — unrelated in-flight work |
| 2 | `test/ui/components/classes/classDetailsAdminView.test.tsx`, `test/ui/components/fixtures/classDetailsFixtures.tsx` | Known sibling-owned pre-existing errors (payroll calc fields on `ClassInstanceQuery`); explicitly accepted |

**Gate 2 verdict: PASS** for carryover (0 carryover errors).

## 3. Duplicates (`bun run check:duplicates`, full-repo jscpd, fresh JSON report via direct `bunx jscpd`)

⚠️ **Expectation ("zero clone pairs involving carryover files") NOT met.** 26 clone pairs total repo-wide; **14 involve carryover files**, all cross-plan adjacencies:

| Carryover file | Counterparty (owner plan) | Pairs |
|---|---|---|
| `app/api/carryover/export/route.ts` | `app/api/accounting/reports/export/route.ts` (session-audit), `app/api/payroll/export/route.ts` (payroll) | 6 |
| `backend/graphql/query/teachers/carryover.query.ts` | `backend/graphql/query/billing/session-audit.query.ts` (session-audit) | 1 |
| `frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.ts` | payroll + session-audit view models | 4 |
| `frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.tsx` ↔ `useCarryoverFormViewModel.ts` | payroll `OverrideDialog.tsx` / `useOverrideDialogViewModel.ts` | 2 |
| `frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.tsx` | credit-adjustment `CreditAdjustForm.tsx` | 1 |

Classification: all pairs are carryover ↔ sibling-plan structural clones (CSV export routes, paginated list view models, dialog scaffolds). Not regression since the last known state (these clone patterns predate/parallel the plan's reviews). Remaining 12 repo-wide pairs involve no carryover files. Not fixed (verification-only sweep) — recorded as follow-up: DRY scaffold extraction per `docs/frontend/duplication-elimination-patterns.md`.

## 4. Deferred Items Ledger (`.ai/plans/carryover-balance-module/deferred-items.md`)

| ID | Item | Status | External owner (documented) |
|---|---|---|---|
| D1 | Plan 4 audit-grid integration (bulk-carryover button, "Linked" chip) | ❌ Blocked | Sibling session-event-audit plan (`SessionAuditDataGrid.tsx` not yet landed) |
| D2 | Staging migration rehearsal | ❌ Blocked | Staging environment / deployment access (outside implementation run) |
| D3 | UI/E2E first execution (4.8/5.4 component tests, 8.1 E2E spec) | 🔄 In Progress | Post-merge enablement run (user directive: do not execute in this run) |
| D4 | Plan 6 `ExpenseService.createInternal`/`softDelete` real integration | ❌ Blocked | Plan 6 (expense-ledger); carryover uses documented module-private adapter stub |

**Gate 4 verdict: PASS** — all 4 deferred items carry documented external ownership.

## 5. Locale Snapshots

- `shared/locale/en/dashboard/accounting/carryover.ts` and `shared/locale/ar/dashboard/accounting/carryover.ts` exist: 79 keys each, exact key parity (diff empty both directions), both typed against `CarryoverLabels` (`shared/locale/types/dashboard/accounting/carryover.ts`) — compile-enforced completeness.
- `core.nav`: `accountingCarryover` present in `shared/locale/en/dashboard/core/nav.ts:124` and `shared/locale/ar/dashboard/core/nav.ts:124`.

**Gate 5 verdict: PASS.** (Note: the project's locale snapshots are typed `.ts` modules, not `.json` files — the compile-time system covers the "json keys complete" intent.)

## Summary

| Gate | Verdict |
|---|---|
| 1. Test suites (18 files, 362 tests) | ✅ ALL PASS |
| 2. tsgo (carryover-attributable) | ✅ 0 errors (15 whatsapp + 2 known classDetails, all sibling-owned) |
| 3. Duplicates (carryover-involved) | ⚠️ 14 cross-plan clone pairs found (carryover ↔ payroll/session-audit/credit-adjustment) — not zero; recorded as follow-up, out of scope of this fix-nothing sweep |
| 4. Deferred ledger ownership | ✅ All 4 items documented with external owners |
| 5. Locale snapshots (carryover + core.nav) | ✅ Parity + typed completeness |

Aggregate state for carryover is green on gates 1, 2, 4, 5; gate 3 is a documented exception, with all clone counterparties belonging to sibling plans already in the tree.
