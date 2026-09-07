# Review — Expense Ledger Backend R1 (READ-ONLY)

- **Date**: 2026-09-07
- **Scope**: `backend/db/schema/expenses/*`, `backend/db/repo/expenses/*`, `backend/services/expenses/*`,
  `backend/types/billing/expense.types.ts`, `backend/graphql/pothos/expenses/*`,
  `backend/graphql/query/billing/expense.query.ts`, `backend/graphql/mutation/billing/expense.mutation.ts`,
  `app/api/expenses/export/route.ts`, migrations 44/45, associated tests, and the carryover-swap seam
  (`backend/services/teachers/carryover-balance.service.ts` settle/unpay call sites).
- **Method**: read the plan (`specs.md`, `implementation.md`) + all outcome files, then verified every
  finding against the actual code. No code edits. No git mutations. Shared-tree whatsapp2 failures ignored per scope.

## Verification performed

- `sub-loop --lifecycle codescene` → **exit 0 (PASS) on all 14 in-scope files**
  (schema ×2, repo ×2, service/helpers/idempotency/barrel ×4, types, pothos ×2, query, mutation, CSV route).
- Tests via `run-test.ts`, all green:
  service 31 · internal 5 · idempotency 8 · helpers 24 · repo 21 · migrations 7 · query 16 · mutation 25 ·
  CSV route 18 · journeys (`carryover-pay-to-expense-ledger` 7, `carryover-unpay-expense-softdelete` 8,
  `expense-crud-audit-attribution` 9).
- `grep console\.` over scope → none.

## Findings

1. **[MEDIUM] `app/api/expenses/export/route.ts:140,191-192` — `includeDeleted` is not re-gated for view-only
   callers.** The GraphQL query strips `includeDeleted: true` unless the caller holds
   `ACCOUNTING_EXPENSES_MANAGE`/super-admin (`expense.query.ts:31-36`), and the 2.2 outcome claims the route
   "mirrors" that behavior — but the route passes the parsed flag straight into `ExpenseService.getReport`,
   which enforces only `ACCOUNTING_EXPENSES_VIEW`. A view-only operator can export soft-deleted rows via CSV
   while the UI/query hides them. Untested: `route.test.ts` only checks `includeDeleted=false/true` parsing,
   never a view-only caller with `true`.
   **Fix**: gate in the route — resolve the caller's permission set (or a `VIEW+!MANAGE` check) and silently
   strip `includeDeleted` to false exactly as the query resolver does; add a route test mirroring
   `expense.query.test.ts:413`.

2. **[MEDIUM] `backend/services/expenses/expense.service.ts:328-340` — an operational expense can be re-typed
   INTO `Salaries` via `updateExpense`.** `assertSalariesImmutability` only guards when `existing.type ===
   SALARIES` (changing OUT of Salaries); nothing rejects `input.type === SALARIES` when the existing row is
   `Marketing`/`Logistics`/`Technology`. This defeats the "Salaries only via the carryover settlement flow"
   invariant (spec AC-2.5/E2 spirit): the public `create` rejects Salaries, but `update` smuggles it in. Once
   applied, the row's type/value become immutable (`assertSalariesImmutability` then blocks both directions),
   so the operator cannot switch it back — only delete + recreate. Also creates `type=Salaries,
   sourceEntity=null` rows no other flow produces. No test covers this direction.
   **Fix**: in `update`, reject `input.type === ExpenseType.SALARIES && existing.type !== ExpenseType.SALARIES`
   with `EXPENSE_SALARIES_VIA_CARRYOVER_ONLY`; add a service test.

3. **[MEDIUM] `backend/services/expenses/expense-helpers.ts:100-113` — `update` never validates `teacherId`.**
   `validateCreateInput` shape-checks `teacherId` via `assertOptionalUuidShape` (line 88); `validateUpdateInput`
   does not check it at all. Consequences: a malformed teacherId reaches the uuid column and surfaces as a raw
   driver error (500) instead of `EXPENSE_NOT_FOUND`/`TEACHER_NOT_FOUND`; a well-formed but dangling teacherId
   surfaces as a raw FK violation. Related snapshot trap: `update` accepts `teacherId` without re-resolving
   `teacherName` (`buildUpdatePatch`, expense.service.ts:342-359) — repointing a row to another teacher without
   passing `teacherName` leaves the OLD teacher's name snapshot on the row (create resolves it; update must too).
   **Fix**: apply `assertOptionalUuidShape` + existence check (`TeacherRepository.findById`, same as create,
   under the row lock) in the update path, and re-resolve/refresh `teacherName` when `teacherId` is patched and
   `teacherName` is absent (or reject `teacherId`-without-`teacherName` patches explicitly).

4. **[MEDIUM] `backend/services/expenses/expense.service.ts:259-264` (+ `findReplayExpense` 204-222) —
   create idempotency has a concurrent-first-write race.** The flow is replay-lookup-then-insert with no
   advisory lock and no unique constraint: two in-flight submissions with the same `clientRequestId` inside the
   60 s window both miss the audit-window scan and both insert (two rows, two audit entries). Spec E1/NFR-4
   require "no duplicate rows" / "exactly one row mutation" under concurrent duplicate submissions. Plan-review
   R2 finding 9 dismissed the advisory lock ("single-table write doesn't need one"), and the 1.3 outcome calls
   the residual race "acceptable per plan" — that judgment contradicts the spec text as written.
   **Fix**: either add `SELECT pg_advisory_xact_lock(hashtext(clientRequestId))` before the replay scan
   (lock-then-replay ordering, matching the credit-adjustment precedent), or record the accepted risk
   explicitly in `deferred-items.md` and soften E1/NFR-4.

5. **[MEDIUM] `expense.service.ts:438,417` vs `carryover-balance.service.ts:1086,1105` — lock-order inversion
   between the UI delete path and the carryover unpay path.** UI delete: `softDeleteInTx` locks the expense row
   FIRST (`getByIdForUpdate`, line 438), then locks the linked carryover (`getByIdsForUpdate`, line 417).
   Unpay: locks the carryover first (line 1086), then the expense via `softDelete({tx})` (line 1105 →
   `softDeleteInTx`). A concurrent UI-delete + unpay of the same pair can deadlock; PG's detector kills one
   transaction (40P01), the other actor sees a raw 500. Self-healing (both roll back), and the unpay-direction
   ordering (unpaid first, then soft-delete) otherwise correctly satisfies the `EXPENSE_DELETE_VIA_UNPAY` guard
   — verified in code and by the unpay journey test.
   **Fix**: canonicalize the order — in `softDeleteInTx`, when `sourceEntity='carryover_balances'` with an id,
   lock the carryover BEFORE taking the expense FOR UPDATE lock (a non-locking pre-read supplies the provenance;
   provenance columns never change, so the pre-read is safe), then lock the expense and re-verify
   `deletedAt`.

6. **[LOW] Dead code.** (a) `ExpenseRepository.bulkSoftDelete` (`expense.repository.ts:149-162`) is referenced
   only by its own repo tests — the service `bulkDelete` iterates `softDeleteInTx` per id instead.
   (b) `CreateExpenseInternalInput` (`backend/types/billing/expense.types.ts:46-49`) is declared but never used;
   `createInternal` takes `CreateExpenseInput`.
   **Fix**: delete both (or mark deprecation); repo layer per `backend/db/repo/AGENTS.md` should expose only
   what the service layer consumes.

7. **[LOW] `expenseDate` month range enforced on the export route but not on the mutation path.**
   `EXPENSE_MONTH_PATTERN = /^\d{4}-\d{2}$/` (`expense-helpers.ts:20`) and the PG CHECK
   `^\d{4}-\d{2}$` (migration 45 line 37) both accept `2026-13`; the CSV route's `isAccountingMonth`
   (`route.ts:69-76`) correctly rejects months outside 01–12. A mutation can persist an impossible month that
   the filter/export tier then refuses to echo back.
   **Fix**: add the 01–12 range check to `assertExpenseMonthShape`; optionally tighten the CHECK to
   `substring(expense_date,6,2)::int BETWEEN 1 AND 12` in a follow-up migration.

8. **[LOW] Manual `expenseValue` is stored verbatim, not canonicalized.** `insertExpense`
   (`expense.service.ts:306`) stores `.trim()`ed input: `"1.5"`, `"1.50"`, and `"1.50 "` display differently in
   the ledger, while the carryover write path canonicalizes via `normalizePayableAmount` (two decimals).
   Aggregates are unaffected (minor-unit bigint math). Spec AC-3.1's "max 12 digits + 2 decimals" cap is also
   not enforced server-side (`AMOUNT_PATTERN` `\d+` is unbounded).
   **Fix**: canonicalize to two decimals at insert (reuse the minor-unit parse already in
   `expense-helpers.ts:141-159`) and bound integer digits at 12 in `AMOUNT_PATTERN`.

9. **[LOW] Idempotency window drift from spec.** `IDEMPOTENCY_WINDOW_SECONDS = 60`
   (`expense.service.ts:46`) vs spec E1's 30-second window. Harmless in effect (keys are clientRequestId-scoped),
   but the docs disagree.
   **Fix**: align the spec or the constant.

10. **[LOW] NOT NULL + `ON DELETE SET NULL` contradiction** — `created_by_user_id` (schema `expenses.ts:50-52`;
    migration 45 line 47): deleting a user who authored expenses raises 23502. `teacher_id`/`deleted_by_user_id`
    are nullable, so only `created_by_user_id` is affected. Already tracked as `deferred-items.md` D6 (❌) —
    flagged again for completeness. Related asymmetry: `findFiltered` joins `users` for the rows but
    `countFiltered` does not join (`expense.repository.ts:65-74`), so a missing creator user would silently
    make `totalCount` disagree with the actual rows.
    **Fix**: per D6 — relax the NOT NULL or drop the set-null action; consider a LEFT JOIN for the creator name.

11. **[INFO] `expense(id)` serves soft-deleted rows to VIEW-only callers** (`expense.service.ts:529-537`) —
    intentional and documented ("audit timeline"), but it softens the "never surface to view-only" rationale
    used for finding 1's gating. Note only.

12. **[INFO] `deleteExpense` always returns `{ deleted: true }`** (`expense.mutation.ts:69`) even when the row
    was already deleted (the service's idempotent no-op path). Similarly, an empty-patch `update` still emits an
    audit row with empty `previousValues`/`newValues` (`expense.service.ts:388-398`). Both are cosmetic.

## What checked out clean

- **Authorization**: every resolver carries `authScopes` AND the service re-checks via `requirePermission`;
  `actorUserId`/`createdByUserId` are server-derived everywhere (never client input); `createInternal` is not
  exposed via GraphQL; the CSV route enforces 401 → 403 ordering before any data read. Double-keyed
  `requireAuth` + authScope tests exist (mutation test suite, 25 tests).
- **Race conditions (write paths)**: update/soft-delete/bulk-delete all read via `getByIdForUpdate` inside the
  caller's tx; the paid-carryover guard locks the carryover in the same tx; `bulkDelete` dedupes ids, runs in one
  tx, and rolls the whole batch back on any rejection. (Except findings 4/5.)
- **Idempotency**: key = scope + actor + `clientRequestId` + identifying payload (note excluded, documented);
  replay re-reads the live row (never a stale snapshot); actor-scoped 10×500-page bounded scan; settlement
  seeds a per-carryover `clientRequestId` (`deriveExpenseClientRequestId`).
- **Money**: text columns, exact-decimal strings, bigint minor-unit sums (`sumExpenseValues`), no float math
  anywhere; schema comment + plan decisions consistent.
- **Migrations 44/45**: additive-only, fully idempotent (IF NOT EXISTS / DO-guards), idempotency +
  destructive-DDL guards unit-tested in `expenses-table.test.ts`; sidecar and bundled folders present.
- **i18n**: all user-facing errors via typed `tErrors.expenses.*` leaf (14 keys, EN+AR, snapshot artifacts
  regenerated); no hardcoded strings.
- **Carryover swap interplay**: settle calls `createInternal` in the caller tx with provenance
  (`EXPENSE_SOURCE_CARRYOVER_BALANCES` imported from the services barrel — not duplicated); unpay flips
  `isPaid=false` before soft-deleting so the ledger guard admits the settlement's own delete; `EXPENSE_NOT_FOUND`
  during unpay is tolerated (pre-ledger rows); journey tests green.
- **Partial-percentage snapshot traps**: none introduced here — expenses snapshot only `teacherName` and the
  settled `payable` value at write time; the `isPartialPercentage` lifecycle stays in the carryover/session
  layer, untouched by this module.
- **Stale/outcome hygiene note (plan-admin, not code)**: `deferred-items.md` still contains the template's
  example rows D1–D3; D5/D6/D7 remain ❌/🔄. The plan's exit criteria (`grep -c "❌\|⚠️"` > 0 → blocked) cannot
  currently pass; orchestrator should clean the template rows and resolve D6 before plan closure.
