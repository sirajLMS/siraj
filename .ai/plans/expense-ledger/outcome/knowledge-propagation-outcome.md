# Knowledge Propagation Outcome — expense-ledger

- **Date**: 2026-09-07
- **Status**: ✅ Complete

## What was done

### Canonical doc — `docs/billing/expense-ledger.md` (new)

Distilled from all 39 outcome files + the plans + the live code (schema,
`expense.service.ts`, `expense-helpers.ts` re-verified against source).
Contents:

- Architecture overview + full layer table (permissions, schema, migrations
  44/45 incl. the custom-SQL-not-`generate` decision, enums/constants, types,
  repo, service, GraphQL, CSV route, documents, store, views, routes, nav,
  i18n, audit, tests).
- Schema (`expenses`, 18 cols / 9 indexes / 3 FKs) **including the open D6
  known issue**: `created_by_user_id` NOT NULL + `ON DELETE SET NULL`
  contradiction (deleting an author fails 23502; the FK columns
  `teacher_id`/`deleted_by_user_id` are nullable so only the creator FK is
  affected). Documented with the current restraint: never hard-delete
  users/teachers that own expense rows; journey cleanup deletes expense rows
  first.
- Service surface with the **`createInternal` contract** (caller-tx only, no
  permission check, no advisory lock, emits its own `EXPENSE_CREATE` audit
  into the caller tx, typed `DomainError` rolled up as
  `CARRYOVER_TO_EXPENSE_FAILED` by the caller) and the **`softDelete`
  contract** (permission only when no caller tx, idempotent re-delete,
  `EXPENSE_NOT_FOUND` tolerated by unpay) — written for Plan 5 /
  cross-module consumers.
- Idempotency design: sha256 key over scope+actor+clientRequestId+identifying
  payload (note excluded), lock-then-replay (`expense-create:<key>` advisory
  lock), 60 s audit-window replay re-reading the live row; spec-vs-code 30 s
  vs 60 s drift recorded (60 s is the shipped behavior).
- Cross-plan settlement interplay: settle/unpay choreography, the
  `EXPENSE_DELETE_VIA_UNPAY` settlement guard, and the **canonical lock order
  (carryover BEFORE expense)** — pre-read provenance (write-once columns,
  safe non-locking), lock carryover via `getByIdsForUpdate`, then the expense
  `FOR UPDATE`; both UI delete and unpay follow it (R1 finding 5 fix).
- CSV export contract: exact query-param names (`types` takes display values,
  not codegen enum keys), 10 000-row cap + `X-Export-Truncated`,
  `includeDeleted` re-gated on MANAGE at both entry points, 19-column header
  contract pinned by tests, formula-injection neutralization, and the "extract
  a shared CSV helper before a 5th route" follow-up.
- Full error-code table (domain codes + ValidationError + GraphQL guards).
- Frontend essentials (grid/filter bar/dialog/drawer conventions, page-derived
  aggregates, single 300 ms debounce, delete-rejection UX).
- Deferred ledger D4/D5/D6/D7 carried into the "Known follow-ups" section;
  optional CHECK tightening + spec window drift recorded.

### Root `AGENTS.md`

One line added to Important References:
`docs/billing/expense-ledger.md` — module summary + `createInternal` /
`softDelete` seam + lock ordering + D6 pointer (plan path included).
No other AGENTS.md edits; the carryover AGENTS line already exists.

### `backend/services/AGENTS.md`

One line added to "Transactions & Concurrency (CRITICAL)": cross-table row
locks on shared entities MUST follow the canonical order documented in
`docs/billing/expense-ledger.md` (carryover BEFORE expense); mismatched order
deadlocks (PG 40P01). This rule was **not** previously recorded anywhere
(checked root AGENTS.md, `backend/AGENTS.md`, `backend/services/AGENTS.md`,
`docs/IDEMPOTENCY.md`-adjacent references — existing rules cover only
advisory locks and replay ordering, not cross-table row-lock ordering).

### `docs/billing/carryover-balances.md` (staleness updates)

Three stale statements after the swap + review fixes:

1. Column bullet: "`expenseId` (uuid, **deliberately no FK** — expense ledger
   is Plan 6)" → now points to the shipped ledger doc instead of the future
   plan.
2. Decision #11 referenced a non-existent guard name
   `assertNotSettlementProtected` — replaced with "settlement-protection
   guard (inside `softDeleteInTx`)"; verified by grep that no such symbol
   exists in `backend/services`.
3. Known follow-up "the E2E spec can still gain real
   `/accounting/expenses` page assertions once the ledger UI ships" — stale;
   the ledger UI + `test/ui/e2e/accounting/expenses.test.ts` (covering the
   carryover settle → ledger → unpay loop) have shipped; replaced with a
   pointer to the new doc.

`deferred-items.md`: **untouched** (per task instructions; D4/D5/D6/D7
statuses are already current from the review-fixes wave).

## Files touched

| File | Change |
|---|---|
| `docs/billing/expense-ledger.md` | 🆕 canonical module reference |
| `AGENTS.md` | ➕ one Important References line |
| `backend/services/AGENTS.md` | ➕ one canonical lock-order rule line |
| `docs/billing/carryover-balances.md` | three stale statements updated (FK coupling note, guard name, ledger-UI follow-up) |

## Verification

- Sub-loop `--lifecycle codescene` on `docs/billing/expense-ledger.md`:
  markdown is outside the tsgo/oxlint/biome file scopes — the loop confirmed
  no lintable content ("No files found to lint… skipped gracefully"); no
  failures attributable to the doc.
- `biome check` on all four touched files: biome config ignores `*.md` /
  `AGENTS.md` — no applicable checks (verified, not assumed).
- Cross-referenced every load-bearing claim in the new doc against source:
  `backend/db/schema/expenses/expenses.ts` (columns/indexes/FKs/CHECK),
  `backend/services/expenses/expense.service.ts` (lock order, guards, error
  codes, audit actions, idempotency window constant),
  `backend/services/expenses/expense-helpers.ts` (validators + month range),
  `shared/locale/en/errors/index.ts` (14 `errors.expenses` keys).
- No tests run — docs-only change; no UI/E2E runs per policy.

## Notes / residual flags

- D6 (NOT NULL + set-null contradiction) is now the single canonical record
  here and in the plan's deferred-items ledger; resolution is a deliberate
  schema decision for a follow-up (relax NOT NULL or drop the set-null
  action). Flagged as the only schema-level open issue.
- Spec drift note preserved: E1 idempotency window is 30 s in the spec, 60 s
  in code (`IDEMPOTENCY_WINDOW_SECONDS`) — code is the shipped truth.
