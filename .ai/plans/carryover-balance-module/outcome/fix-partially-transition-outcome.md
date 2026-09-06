# Fix Outcome — PARTIALLY Sessions Can Be Carried Over (partial-percentage CHECK)

- **Date**: 2026-09-05
- **Status**: ✅ Complete

## Root cause

`class_instances_partial_percentage_chk` binds `is_partial_percentage` to the
`PARTIALLY` calculation status (`PARTIALLY` ⇒ NOT NULL; any other status ⇒ NULL).
`CarryoverBalanceService.transitionSessions()` patched only `calculationStatus`, so
transitioning a PARTIALLY session to `WAITING_PAID` (link) or `PAID` (settle) left
`is_partial_percentage IS NOT NULL` on a non-PARTIALLY row and the CHECK rejected the
update — PARTIALLY sessions (audited and carryover-eligible per AC-2.3) could never be
carried over. The reverse path compounded it: even if the status alone were restored on
delete, a PARTIALLY revert needs the percentage value back, and the link had no way to
keep it once the live column had to be cleared. The TB.4 journey had worked around this
by substituting a REFUND fixture for teacher A's second session.

## Fix shape

- **Item snapshot extended.** `carryover_balance_items` gains a nullable
  `original_partial_percentage integer` column (alongside `original_status`), captured
  from `instance.isPartialPercentage` at bulk-create time. The column did not exist and
  the class_instances payroll snapshot fields cannot survive the link (the CHECK forces
  them clear), so snapshotting on the item row is the only lossless restore source.
- **Transitions carry the column explicitly.** `SessionStatusTransition` gains
  `isPartialPercentage: number | null`; `transitionSessions` writes it on every
  `SchedulingRepository.updatePayrollCalculation` call. Link (→ WAITING_PAID), settle
  (→ PAID), and unpay (→ WAITING_PAID) all pass `null`; the delete/bulk-delete revert
  passes the item snapshot value when restoring to PARTIALLY and `null` otherwise.
- **Corrupt-snapshot guard.** A PARTIALLY item snapshot without a stored percentage
  (only possible for rows written before this fix — the module has no shipped data)
  rejects with `DomainError("CARRYOVER_SNAPSHOT_INVALID")` before any session moves,
  instead of surfacing a raw CHECK violation.
- **Repo layer untouched**: `SchedulingRepository.updatePayrollCalculation`'s
  `PayrollCalculationPatch` already covered `isPartialPercentage`; no repo change was
  needed. No other CHECK references payroll sibling columns in a way the transitions
  disturb (REFUND's `teacher_paid_amount = '0'` and CALCULATED's `calculatedDuration`
  are preserved — transitions never touch them).

## Files touched

| File | Change |
|---|---|
| `backend/db/schema/teachers/carryover-balances.ts` | ➕ Nullable `originalPartialPercentage` integer column on `carryover_balance_items`. |
| `backend/db/migration/42-carryover-items-original-partial-percentage.sql` | 🆕 Idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS`. Bundled by `db migrate` into `backend/drizzle/20260905191307_custom_42-carryover-items-original-partial-percentage/` (auto-generated folder + sidecar update by the bundler). Pre-migrate sidecar-vs-manifest delta was verified empty — no other agent's SQL was swept in. Applied to both `siraj` (.env) and `siraj_test` (.env.test). |
| `backend/services/teachers/carryover-balance.service.ts` | `SessionStatusTransition.isPartialPercentage`; `transitionSessions` writes it; item drafts snapshot it; revert restores it with the corrupt-snapshot guard. |
| `backend/db/test/migrations/carryover-tables.test.ts` | Item column list 9 → 10 with integer/nullable assertions. |
| `backend/services/teachers/carryover-balance.service.test.ts` | Session stub carries `isPartialPercentage`; PARTIALLY fixture at 50%; link patches assert `{ calculationStatus: WAITING_PAID, isPartialPercentage: null }`; item draft asserts `originalPartialPercentage: 50`. |
| `backend/services/teachers/carryover-crud.service.test.ts` | Item row builders carry `originalPartialPercentage` (40 for the PARTIALLY item); delete revert patches assert restored percentages; unpay patch asserts the null write. |
| `test/workflows/helpers/carryover-delete-cast.ts` | Teacher A's second session: REFUND → PARTIALLY (50%, 60.00 SAR of the 120.00 rate). |
| `test/workflows/accounting/carryover-delete.journey.test.ts` | REFUND workaround removed: fixture asserts PARTIALLY + 50%; step 2 asserts the link cleared the live column and pinned `originalPartialPercentage: 50` on the item; restore assertions (steps 5/11) verify status AND percentage round-trip; payable 120.00 → 180.00. |
| `test/workflows/accounting/DIAGRAMS.md` | Delete-journey diagram line updated (REFUND → PARTIALLY 50pct restored). `validate:mermaid` all OK. |

`test/workflows/accounting/carryover-bulk-create.journey.test.ts` needed no change
(verified: its fixtures are all CALCULATED — it never carried the REFUND workaround);
it was re-run green against the fixed service. The generated drizzle folder and
sidecar updates are machine-produced by `db migrate`, not hand edits.
`trackable-tasks.md` untouched.

## Verification (all via `test/scripts/run-test.ts`)

- `test/workflows/accounting/carryover-delete.journey.test.ts` → **12 pass / 0 fail / 112 expects** (PARTIALLY session is the delete journey's main evidence; the pre-fix run of this exact fixture failed on the CHECK, confirming the test as proof).
- `test/workflows/accounting/carryover-bulk-create.journey.test.ts` → **7 pass / 0 fail / 129 expects**.
- `test/workflows/accounting/carryover-to-expense.journey.test.ts` → **7 pass / 0 fail / 85 expects** (settle-path regression insurance).
- `backend/services/teachers/carryover-balance.service.test.ts` → **13 pass / 0 fail / 188 expects**.
- `backend/services/teachers/carryover-crud.service.test.ts` → **8 pass / 0 fail / 99 expects**.
- `backend/services/teachers/carryover-to-expense.service.test.ts` → **8 pass / 0 fail / 107 expects**.
- `backend/db/test/migrations/carryover-tables.test.ts` → **5 pass / 0 fail / 92 expects**.
- `backend/db/test/logic/scheduling/class_instances_security.test.ts` → **8 pass / 0 fail / 20 expects**.
- `bun run validate:mermaid test/workflows/accounting/DIAGRAMS.md` → all 11 blocks OK.
- `bun tsgo` → the only two errors are pre-existing, owned by another agent's in-flight
  work (`test/ui/components/classes/classDetailsAdminView.test.tsx`,
  `test/ui/components/fixtures/classDetailsFixtures.tsx` — committed files incompatible
  with the in-flight regenerated `frontend/common/graphql/generated/gql/graphql.ts`).
  Nothing carryover-related.

## sub-loop `--lifecycle codescene` (all exit 0)

`carryover-balance.service.ts`, `carryover-balances.ts` (schema),
`carryover-tables.test.ts`, `carryover-crud.service.test.ts`,
`carryover-balance.service.test.ts`, `carryover-delete.journey.test.ts`,
`carryover-delete-cast.ts` — all six stages green with zero fixes needed.

## Residual limitations

- Carryover item rows created **before** this fix with a PARTIALLY snapshot cannot be
  reverted to PARTIALLY (no stored percentage) and will reject the delete with
  `CARRYOVER_SNAPSHOT_INVALID`. Only reachable for data written while the bug was live
  in a shared dev/test environment; the module has not shipped, so no production data
  can exist.
- `drizzle-kit generate` was deliberately not used for the column; the custom-SQL path
  keeps the drizzle snapshot one column behind until the plan's next proper generate.
  Harmless: the column ships via the folder migration on every `db migrate`.

## Cross-file dependencies

None outstanding — TB.4's reported dependency
(`transitionSessions` leaving PARTIALLY pinned) is resolved by this fix.
