# Task TB.4 Outcome — Carryover Delete Journey Test

- **Date**: 2026-09-05
- **Status**: ✅ Complete

## What was implemented

`test/workflows/accounting/carryover-delete.journey.test.ts` — 12 ordered steps through the real
service layer against the committed test DB (no `runInRollback`; fixtures committed in `beforeAll`,
tracked and hard-deleted in `afterAll`; notification dispatch spied and asserted silent):

1. Fixtures commit audited, unlinked sessions (CALCULATED / REFUND per teacher A; CALCULATED ×2 for teacher B).
2. Operator `bulkCreateCarryoverBalances` → one carryover per teacher, sessions `WAITING_PAID` + linked,
   `carryover_balance_items.originalStatus` snapshots pinned (CALCULATED / REFUND), `CARRYOVER_CREATE` audit rows.
3. Second operator selecting the linked sessions is rejected (`CARRYOVER_SESSION_NOT_AUDITED` — see note below).
4. Staff viewer (`staff_default`, neither VIEW nor MANAGE) is denied `deleteCarryoverBalance` and `getReport`
   (FORBIDDEN + `insufficientPermissions`); rows verified untouched afterwards.
5. `deleteCarryoverBalance` → `carryover_balance_id` NULLed and each session reverted to its item
   `originalStatus` snapshot (per-item restore, not a blanket status); carryover gone from `getReport`.
6. Audit trail survives: `CARRYOVER_CREATE` + `CARRYOVER_DELETE` rows still present for the orphaned
   entityId, DELETE metadata carries `{ teacherId, payable, currency }` (AC-4.10) with the real actorUserId;
   `getById` now throws NotFound. (AC-8.3/AC-8.4)
7. Cross-actor: second operator re-selects the freed sessions (guard gone) into carryover A2; the deleting
   operator sees A2 in the report (VIEW cross-actor visibility).
8. Teacher B's carryover settles via `bulkCarryoverToExpense` (sessions PAID, `CARRYOVER_TO_EXPENSE` row).
9. Delete on the paid carryover rejects `CARRYOVER_PAID_CANNOT_DELETE`; row + audit intact (AC-4.6/E8).
10. `bulkDeleteCarryoverBalances([A2, B])` rejects atomically: both rows still listed, sessions unchanged
    (A2 sessions still WAITING_PAID-linked, B still PAID), zero DELETE audit rows (AC-4.8/AC-4.9/E9).
11. `bulkDeleteCarryoverBalances([A2])` succeeds; sessions revert to snapshots again; B untouched.
12. Whole journey dispatched zero notifications.

Supporting new helper `test/workflows/helpers/carryover-delete-cast.ts` (`CarryoverDeleteCast`,
`provisionCarryoverDeleteCast`, `cleanupCarryoverDeleteCast`): two `academy_admin` operators, a
`staff_default` viewer, two teachers with SAR 120/h rates, and four audited class instances created with
committed payroll snapshots. Cleanup lifts the audit immutability trigger (precedent pattern), sweeps
audit rows by actor, deletes leftover carryovers (items cascade), then `purgeCastFixture`. Mermaid
sequence diagram appended to `test/workflows/accounting/DIAGRAMS.md` (`validate:mermaid` all OK).

## Assertion deviations from the task brief (deliberate)

- **Step 3 error code is `CARRYOVER_SESSION_NOT_AUDITED`, not `CARRYOVER_SESSION_ALREADY_LINKED`.**
  Once linked, sessions sit in `WAITING_PAID`, which is outside the audited set, so the audited-status
  guard fires before the linked guard. Rejection either way proves the second operator cannot claim them.
- **PARTIALLY replaced by REFUND for teacher A's second session** — a PARTIALLY session necessarily
  carries `is_partial_percentage` NOT NULL, and the `class_instances_partial_percentage_chk` CHECK
  (`status = 'PARTIALLY' OR is_partial_percentage IS NULL`) blocks any transition off PARTIALLY.
  See the cross-file dependency below. REFUND still exercises a distinct per-item snapshot restore; its
  CHECK (`teacher_paid_amount = '0'`) required the fixture amount to be exactly `"0"` (text compare).

## Files touched

| File | Change |
|---|---|
| `test/workflows/accounting/carryover-delete.journey.test.ts` | 🆕 12-step journey (~365 LoC). |
| `test/workflows/helpers/carryover-delete-cast.ts` | 🆕 cast provision/cleanup helpers. |
| `test/workflows/helpers/index.ts` | ➕ `export * from "./carryover-delete-cast";` (alphabetical). |
| `test/workflows/accounting/DIAGRAMS.md` | ➕ `carryover-delete.journey.test.ts` section incl. mermaid block. |

No git mutations; `trackable-tasks.md` untouched (orchestrator-owned).

## Verification

- `~/.bun/bin/bun run test/scripts/run-test.ts test/workflows/accounting/carryover-delete.journey.test.ts`
  → **12 pass / 0 fail / 105 expects** (final run, ~1.8 s).
- `sub-loop.ts <file> --lifecycle codescene` → **exit 0** for the journey test, the cast helper, and the
  helpers barrel. Cast helper needed one CodeScene fix (Large Method on `provisionCarryoverDeleteCast` →
  split into `createAuditedSessionSet` + `assignCastGroups`) and one `import-x/no-duplicates` fix.
- `bun run validate:mermaid test/workflows/accounting/DIAGRAMS.md` → all 11 blocks OK.

## CROSS-FILE DEPENDENCY

```
CROSS-FILE DEPENDENCY:
  Target file: test/workflows/accounting/carryover-delete.journey.test.ts (and TB.1's bulk-create journey, same trigger)
  Blocked by: backend/services/teachers/carryover-balance.service.ts → transitionSessions()
  Rule violated: specs AC-2.3 lists PARTIALLY as an audited status eligible for carryover aggregation
  Required fix: carryover session transitions (link → WAITING_PAID, settle → PAID) must clear
    isPartialPercentage when leaving PARTIALLY (updatePayrollCalculation patch must include
    isPartialPercentage: null), because class_instances_partial_percentage_chk forbids
    is_partial_percentage IS NOT NULL on non-PARTIALLY statuses. Currently any partially-paid audited
    session cannot be carried over at all. Repo layer (SchedulingRepository.updatePayrollCalculation /
    PayrollCalculationPatch) needs to accept the null write. Not fixed here — own-wave files only.
```

## Carry-forward knowledge

- `class_instances` CHECK gotchas for carryover fixtures: PARTIALLY rows are immovable under the current
  service; REFUND rows require `teacher_paid_amount = '0'` exactly (text compare, `"0.00"` fails).
- The delete journey's second-operator re-selection step doubles as the honest proof that the link guard
  is gone — no direct peek at internal guards needed.
- Audit-row cleanup pattern reused: disable `prevent_audit_log_mod_trigger`, delete by actorUserId,
  re-enable in `finally` (only the two operator users needed sweeping; service writes no other actors).
- Other wave agents already ship `carryover-expense-cast.ts` (TB.2 extras); my cast is deliberately
  named/scoped for the delete journey to avoid shared-tree collisions.
