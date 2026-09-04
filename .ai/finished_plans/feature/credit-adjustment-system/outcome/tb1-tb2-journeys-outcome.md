# TB.1 + TB.2 Outcome — Cross-actor journey tests (credit adjustment)

- **Status**: ✅ Done (both journeys green; one pre-existing unrelated failure in the full workflow suite — see Findings)
- **Date**: 2026-08-29

## Files created

- `test/workflows/billing/credit-adjustment-student-visibility.test.ts` — TB.1 journey (7 steps, 73 expects).
- `test/workflows/billing/credit-adjustment-carryover.test.ts` — TB.2 journey (8 steps, 72 expects).
- `test/workflows/helpers/adjustment-cast.ts` — shared extra-cast helper: a genuinely
  permissionless user (zero group memberships), a "legacy credits" user holding ONLY
  `credits.manage` through a run-prefixed **custom** permission group (+ grant + membership,
  all tracked for hard delete), a second `academy_admin` operator (for the two-operator
  concurrency step), and two teachers (carryover target + unrelated control). Provision in a
  committing `beforeAll` transaction; tracked FK-safe hard delete in `afterAll`.
- `test/workflows/helpers/index.ts` — one added barrel line (`export * from "./adjustment-cast";`).

No production code, no other tests, and no plan files were modified. The helper references the
`credits.manage` catalog permission row by lookup (allowed — system catalog rows are
definitions, not demo data); everything else is freshly created per run.

## Signature verification

`CreditService.recordAdjustment(actorUserId, input, tErrors)` confirmed at
`backend/services/billing/credit.service.ts:832`. Adjustments move the CLASS ledger
(`students.classesRemaining`, plus `classesTotal` on Add) and write `changeAmount` rows
(`changeAmountHours` stays NULL per the XOR check). The visibility seam is
`CreditService.getStudentBalance` / `getStudentTransactions` (association- or
permission-scoped), which returns the full ledger row including the carryover columns.

## TB.1 — operator Add/Subtract → family visibility (7 steps)

| Step | Accounts / edge cases covered |
|---|---|
| 1. Add commits ledger row; balance +4 / total +4; row shape (reason `CREDIT_ADJUSTMENT_ADD`, `adjustmentType`, `creditedByUserId`, sanitized notes, derived idempotency key, null carryover columns, NULL `changeAmountHours`) | AC-2.1–2.4 |
| 2. Subtract commits negative row; remaining −2, total unchanged | AC-3.1–3.5 (post-commit visibility row covered in step 3) |
| 3. Student + linked parent see both rows/`adjustmentType` and the balance; operator sees the balance via the permission path | AC-7.1 |
| 4. Unrelated family denied `insufficientPermissions` on balance + transactions; their own ledger stays empty | AC-7.1 (isolation), cross-actor visibility |
| 5. Denials write nothing: permissionless user, `credits.manage`-only (legacy portal) actor denied the new manage permission while still able to READ the balance (proving the legacy permission is held), view-only staff denied; ledger count + balance unchanged after all three | AC-6.1, AC-6.2, E18 |
| 6. Re-submit of the Add (same identifying payload, different notes) returns the first row — no second ledger row, no second balance bump; subtract beyond remaining rejected with the translated `insufficientBalance({studentId, remaining})` message and zero writes | AC-2.5, AC-3.6, E1, E9, E11 |
| 7. Every committed adjustment (Add, Subtract, collapsed re-submit) emits ONE UPDATE audit entry (`actorUserId`, entity STUDENT, description `Credit adjustment <TYPE>`, `newState.creditTransactionId/changeAmount`); adjustments dispatch ZERO user notifications (spied boundary) | AC-6.3, NFR audit |

## TB.2 — Subtract With Carryover → payout handoff (8 steps)

| Step | Accounts / edge cases covered |
|---|---|
| 1. Seed balance via a real Add (+6) | setup, NFR-3 path reuse |
| 2. Happy path: deducts −2, `CREDIT_ADJUSTMENT_CARRYOVER` row with all four carryover columns, stub handoff invoked ONCE with the full payload (`creditTransactionId`, teacher, student, dates, hours, `approvedByUserId`); single-day range + past payment date accepted | AC-4.1, AC-4.2, AC-4.7, AC-4.10, E5, E6, E15 |
| 3. Student/parent see the carryover row with teacher id + date range; unrelated parent denied; unrelated teacher referenced by ZERO ledger rows | AC-7.2 |
| 4. Future `fromDate` range accepted | E4 |
| 5. Two distinct operators concurrently submit DISTINCT payloads → both commit, two rows, two handoffs (advisory-lock serialization) | E14, NFR-3 |
| 6. Re-submit of one concurrent payload (different notes) collapses onto the first row: no new row, no second handoff, balance unchanged | AC-4.9, idempotency |
| 7. Denial battery with atomicity proof: oversized carryover → translated `insufficientBalance` and nothing written/handed off; unknown teacher id → `TEACHER_NOT_FOUND`; teacher deleted between "form-open" and submit → `TEACHER_NOT_FOUND`; permissionless operator → forbidden. Ledger count, balance, and handoff count frozen across all four | AC-4.3–4.6 (partial — see Deviations), AC-6.1, E7/E8-analog, NFR-8 |
| 8. Six audit entries total (Add + 4 carryovers + collapsed re-submit; rolled-back denials audit nothing); carryover audit carries `newState.changeAmount −2` and `carryoverTeacherId`; zero user notifications dispatched | AC-4.8, AC-6.3 |

## Verification results

- `bun run test/scripts/run-test.ts test/workflows/billing/credit-adjustment-student-visibility.test.ts` → **7 pass / 0 fail / 73 expect()** (green first run).
- `bun run test/scripts/run-test.ts test/workflows/billing/credit-adjustment-carryover.test.ts` → **8 pass / 0 fail / 72 expect()**.
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` → exit 0 for BOTH test files
  and for `test/workflows/helpers/adjustment-cast.ts` and `helpers/index.ts` (tsgo → oxlint →
  biome → lint:type-aware → duplicates [outside jscpd scope for test files] → codescene).
  One tsgo fix en route: bun narrows a `let` assigned inside a `db.transaction` closure
  imprecisely — restructured to `const id = await db.transaction(... return id)`.
- `bun run test:workflows` (full suite) → **42 pass / 1 fail / 376 expect()**; both new journeys
  green. The single failure is pre-existing and unrelated — see Findings.

## Fixture conventions used

- No `runInRollback`; committed casts (`provisionAccountingJourneyCast` +
  `provisionAdjustmentExtraCast`) in `beforeAll`, tracked hard deletes in `afterAll`
  (extra-cast cleanup runs AFTER the accounting cast cleanup so carryover-FK'd ledger rows are
  already swept by the student-cascade sweep).
- Per-run prefixes: `jrn_cadj_<uuid8>` (TB.1) / `jrn_co_<uuid8>` (TB.2).
- Honest permissions only — system group assignments via `assignSystemGroup`, custom
  `credits.manage`-only group via real `permission_groups`/`group_permissions` rows; no
  `PermissionsService` patching anywhere.
- Notification boundary: `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")` — the
  journeys assert the adjustment flows dispatch **nothing** today.
- Audit seam: `spyOn(AuditService, "createManyAuditLogs").mockResolvedValue([])` (namespace-object
  method spy; intercepts reliably and avoids audit-row cleanup).
- Carryover seam: `spyOn(CarryoverHandoff, "maybeInsertCarryoverBalanceEntry")` with NO mock —
  the real no-op stub still runs beneath the spy, so the journey proves the handoff is invoked
  AND resolves cleanly. Interception confirmed empirically (4 recorded calls across the journey).

## Deviations

1. **Plan-5 stub handling (as directed by the task):** `teacher_carryover_balances` does not
   exist on the test DB, so `maybeInsertCarryoverBalanceEntry` is a no-op; the journeys assert
   the stub contract (invoked with the exact payload, resolves cleanly inside the tx) plus the
   full carryover column set on `credit_transactions`. No balance-row assertion — that belongs
   to Plan 5's integration test 6.3.
2. **No forced post-insert flush failure:** the task suggested "force a downstream failure
   (invalid carryover-dependent state)". The only in-tx failure surfaces a journey can reach
   honestly (teacher-not-found, insufficient balance, permission) all fire BEFORE the ledger
   insert — the atomicity proof is symmetrical (all-or-nothing holds for every reachable
   failure; asserted: ledger/balance/handoff frozen). Forcing a post-insert, pre-handoff crash
   would require mocking a repo/repo-side seam inside a real transaction, which violates the
   no-service-mocking layer rule — covered instead by the mocked service suite's 23505/rollback
   cases.
3. **Quota refresh observed, not row-asserted:** `recordAdjustment` calls
   `QuotaService.refreshStudentOndemandInstances(studentId, tx)` on every flow; the journey
   casts create no on-demand quota instances, so the refresh is exercised as an in-tx no-op
   (adjustment success proves it did not throw). No quota-instance rows are asserted.
4. **E8 (soft-deleted teacher) analog:** the `teachers` table has no soft-delete column
   (deactivation lives on `users.status`, which the adjustment path does not read — recorded
   as a finding below), so E8 is covered by its reachable equivalent: a teacher row deleted
   between "form-open" and submit is rejected with `TEACHER_NOT_FOUND`.
5. **E14 interpretation:** idempotency keys exclude actor and notes, so "two operators, same
   range" only differs when a keyed field differs. The journey covers both readings: distinct
   payloads from two operators both commit (step 5), and an identical payload collapses (step 6).

## Findings (reported, not fixed — out of task scope)

1. **Pre-existing full-suite failure** — `test/workflows/scheduling/lesson-report-lifecycle.test.ts`
   fails in `afterAll` cleanup: `update or delete on table "class_instances" violates RESTRICT
   setting of foreign key constraint "class_status_events_class_instance_id_class_instances_id_fkey"`
   — the committed payroll workstream makes lesson flows write `class_status_events` rows, but
   `cleanLessonReportCastFlags`/`cleanupLessonReportCast` does not delete them. Reproduces solo
   with zero credit-adjustment involvement (my files are new and unimported by that suite).
   **Owner:** the payroll/scheduling workstream; fix = delete `class_status_events` for the
   cast's class-instance ids in the journey cleanup before deleting `class_instances`.
2. **Soft-deleted/deactivated teachers are accepted as carryover targets** — `assertTeacherExists`
   (`credit.service.ts:126`) uses `TeacherRepository.findById`, which does not filter out
   deactivated accounts; E8's "soft-deleted" failure mode only triggers on a physically absent
   row today. Flag for the credit-adjustment service owner if spec-level E8 fidelity is wanted.
3. Project-wide `bun tsgo` reports unrelated pre-existing errors in
   `test/ui/components/profile/*` (`onTabChange` prop drift) from concurrent work — untouched here.
