# Task TB.3 Outcome — Expense CRUD audit attribution journey (operator → auditor)

- **Date**: 2026-09-07
- **Status**: ✅ Complete

## What was implemented

`test/workflows/expenses/expense-crud-audit-attribution.test.ts` — a 9-step
cross-actor journey over the real `ExpenseService` against the real test DB
(no `runInRollback`; committed fixtures in `beforeAll`, tracked hard delete in
`afterAll`), covering trackable TS.3.

### Cast helper

`test/workflows/helpers/expense-crud-cast.ts` (+ barrel line in
`test/workflows/helpers/index.ts`), modelled on `carryover-expense-cast.ts`:

- **operator** — `academy_admin` system-group assignment (VIEW + MANAGE via
  the migration 44 catalog grants).
- **auditor** — run-owned custom permission group carrying exactly
  `ACCOUNTING_EXPENSES_VIEW` (the honest read-only surface from E17).
- **outsider** — bare user with no group (the neither-permission actor).

All permission resolution goes through the real `user_permission_groups`
join; nothing is patched. Cleanup revokes run-owned memberships, the custom
group, and the user rows in FK-safe order (expense rows are hard-deleted by
the journey first because of the `createdByUserId` FK).

### Journey steps (all green)

1. **Precondition** — operator and auditor `getReport` (prefix-scoped title
   filter) both return an empty window.
2. **VIEW-only auditor denials** — `create` / `update` / `softDelete` /
   `bulkDelete` all reject with `tErrors.insufficientPermissions` before any
   write; honest gate probe: `requirePermission(auditor, ACCOUNTING_EXPENSES_VIEW)`
   resolves while `…_MANAGE` rejects; audit table holds zero auditor rows.
3. **Operator creates two expenses** with a *forged* `createdByUserId`
   pointing at the auditor — the service forces the acting user, so persisted
   rows + `createdByName` carry the operator; one `EXPENSE_CREATE` audit row
   per expense, `actorUserId = operator`, metadata `type`/`value`/`currency`
   and `idempotencyKey: null`.
4. **Operator edit** — `EXPENSE_UPDATE` audit row carries
   `metadata.previousValues` (old title + value), `newValues` (applied patch),
   actor = operator; the auditor reads the committed edit via `getById`.
5. **Auditor report aggregates** — both rows on page, `totalValue = 218.00`
   (minor-unit math), dominant currency SAR, `rowCountByType` 1/1/0/0.
6. **Operator soft-delete** — row is *retained* (`deletedAt`,
   `deletedByUserId = operator`, `deletedReason` verified via raw table read —
   never hard-deleted, AC-8.3); one `EXPENSE_DELETE` audit row with the
   sanitized reason and the real actor (US-8); a repeated `softDelete` is a
   no-op replay that emits **no** second audit row (AC-6.2).
7. **Aggregates exclude soft-deleted rows (AC-6.6)** — default report shows
   only the live row (`totalValue = 175.50`, `totalCount = 1`, Marketing count
   0); `includeDeleted: true` surfaces the struck row; `getById` on the deleted
   id stays readable (audit timeline can explain the correction).
8. **Neither-permission outsider** — `getReport`, `getById`, `create`,
   `bulkDelete`, and the CSV export contract's gate
   (`requirePermission(outsider, ACCOUNTING_EXPENSES_VIEW)`) all reject with
   `insufficientPermissions`; zero audit rows authored by the outsider.
9. **Notification spy** — `dispatchWithPreferences` spy stays at zero calls
   (expense CRUD dispatches nothing; 300 ms drain window before assert).

### CSV-path note (deviation from TS.3 wording, resolved by code reading)

TS.3's parenthetical says "the CSV export route rejects
INSUFFICIENT_PERMISSIONS for a MANAGE-less actor". The implemented route
(`app/api/expenses/export/route.ts:189`) gates on `ACCOUNTING_EXPENSES_VIEW`,
not MANAGE, so the VIEW-only auditor legitimately *can* export; only the
neither-permission outsider is rejected. The journey asserts that real gate
service-side (step 8) with a layer note in the file header — journey tests
have no HTTP layer; the route's 403 surface is already covered by
`app/api/expenses/export/route.test.ts` (precedent:
`test/workflows/accounting/session-audit-access-isolation.test.ts`). If the
route is later tightened to MANAGE per TS.5, step 2's gate probe still holds
and no journey change is needed.

## Files touched

| File | Change |
|---|---|
| `test/workflows/expenses/expense-crud-audit-attribution.test.ts` | 🆕 9-step journey |
| `test/workflows/helpers/expense-crud-cast.ts` | 🆕 cast (operator / VIEW-only auditor / outsider) |
| `test/workflows/helpers/index.ts` | ➕ `./expense-crud-cast` barrel line |
| `test/workflows/expenses/DIAGRAMS.md` | 🆕 sequence diagram (validated) |
| `.ai/plans/expense-ledger/outcome/tb3-journey-outcome.md` | 🆕 this file |

## Verification

- `~/.bun/bin/bun run test/scripts/run-test.ts test/workflows/expenses/expense-crud-audit-attribution.test.ts`
  → **9 pass, 0 fail** (90 expect calls), re-run after lint fixes, still green.
- `~/.bun/bin/bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
  → **exit 0** for all three code files (tsgo → oxlint → biome → lint →
  duplicates → codescene). Two oxlint findings fixed en route:
  `no-unsafe-type-assertion` on the jsonb metadata guard (switched to the
  two-phase `isMetadataRecord`/`treatAsMetadata` predicate pattern) and
  sequential awaits in the step-1 loop (hoisted to `Promise.all`).
- `~/.bun/bin/bun run validate:mermaid test/workflows/expenses/DIAGRAMS.md`
  → **OK** (1 block).

## Carry-forward

- The cast helper only provisions VIEW via a custom group; TB.1/TB.2 casts own
  their carryover fixtures — no overlap.
- Full suite green-check (`bun run test:workflows`) left to the orchestrating
  wave (runs all domains together).
