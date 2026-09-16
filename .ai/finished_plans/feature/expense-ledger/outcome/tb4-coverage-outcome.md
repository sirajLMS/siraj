# Task TB.4 Outcome — 4-Tier Test Verification for the Expense Ledger

- **Date**: 2026-09-07
- **Status**: ✅ Complete
- **Method**: Per-file inventory reasoning against the 4-Tier convention used by the prior TB.5/TB.4 outcomes (Tier 1 = branch/statement/error-path coverage of the new code; Tier 4 = permission denial / oversized input / injection / replay-tamper cases), then focused additions in each module's existing harness.

## Target → test-file mapping (verdict before gap-fill)

| Target | Test file(s) | Tier 1 before | Tier 4 before | Verdict |
|---|---|---|---|---|
| `backend/db/repo/expenses/expense.repository.ts` | `backend/db/test/repo/expenses/expense.repository.test.ts` | Full (`getById`/`getByIdForUpdate` hit+null, `create`, `update` patch + null, `softDelete` hit + null, `bulkSoftDelete` incl. empty-list branch, every `findFiltered` filter, includeDeleted gating, join name, pagination ordering, `%` wildcard escape) | only the `%` wildcard escape | **Gaps** — `_`/quote/DROP injection battery; offset-past-end |
| `backend/services/expenses/expense.service.ts` | `expense.service.test.ts`, `expense-internal.service.test.ts` | create/update/softDelete/bulkDelete/getById/getReport happy + guard + validation paths, replay replay/no-key/distinct-key, permission denial on all public methods | permission denial on every entry point | **Gaps** — insert failure (`EXPENSE_CREATE_FAILED`), repo null mid-update/delete, missing-carryover & null-sourceId guard branches, corrupt replay metadata, vanished-row replay, unknown-name fallbacks, bulk dedupe/malformed-id/idempotent re-delete |
| `backend/services/expenses/expense-helpers.ts` | `expense-helpers.test.ts` | validators (every field), `pickChanged` same/undefined/changed, sums, dominant currency, per-type counts | n/a (pure validators/math) | **Gaps** — negative/malformed/single-decimal sums, dominant-currency tie, null-patch skips, malformed `sourceEntityId` |
| `backend/services/expenses/expense-idempotency.ts` | `expense-idempotency.test.ts` | determinism, per-field divergence (type/date/clientRequestId), null/undefined normalization, provenance, note exclusion, digest shape | note-tamper collapse covered | **Gap** — cross-actor distinctness + remaining per-field divergence (title/value/currency/month) |
| `backend/services/teachers/carryover-balance.service.ts` (cross-tx `createInternal`/`softDelete` seam) | `carryover-to-expense.service.test.ts` (14), `expense-internal.service.test.ts` (5), plus journeys `test/workflows/expenses/carryover-pay-to-expense-ledger.test.ts` (7) and `carryover-unpay-expense-softdelete.test.ts` (8) | staged/commit/rollback visibility both directions, paid-guard inside caller tx, session pay + ledger rollback, already-paid guard, replay | permission denial pre-tx, corrupt replay metadata ignored | COVERED — no additions |
| `backend/graphql/query/billing/expense.query.ts` | `backend/graphql/query/billing/expense.query.test.ts` (16) | page shape, filter mapping (absent/omitted), pagination defaults, `includeDeleted` re-gating matrix, drill-down | FORBIDDEN (view-only, logged-out, unrelated permission), UNAUTHENTICATED, superadmin bypass | COVERED |
| `backend/graphql/mutation/billing/expense.mutation.ts` | `backend/graphql/mutation/billing/expense.mutation.test.ts` (29) | all four mutations' arg mapping + row/result shapes, null-passthrough matrix, empty-ids resolver guard | FORBIDDEN × 4 fields (view-only, logged-out, unrelated permission), UNAUTHENTICATED, superadmin bypass, actor id never accepted from input, >500 ids @constraint, `Salaries` envelope, guard-error propagation, page-limit (0/201) @constraint (schema-surface suite) | COVERED — no additions (a duplicate limit-constraint suite I began adding landed as already-present from a concurrent outcome; reverted to net-zero) |
| `app/api/expenses/export/route.ts` | `app/api/expenses/export/route.test.ts` | 401/403/500, every param validator branch, truncation > and == 10 000, blank-param defaults, Arabic content | `=`/tab/CR formula neutralization, 200-char search bound | **Gaps** — remaining OWASP prefixes (`+`,`-`,`@`), compound accept-language parsing, leap-day boundary |

## Gaps filled (additions to existing harnesses only)

### `backend/db/test/repo/expenses/expense.repository.test.ts` (+2 → 21 pass)
- Tier 4 injection battery on `findFiltered` title search: `_`, `' OR '1'='1`, `'; DROP TABLE expenses; --`, `test\%_` treated as literal text (no matches, no error), table intact and exact search still matches afterwards; sequential `reduce` chain (single rollback connection). (`%` stays covered by the pre-existing wildcard test to avoid duplication.)
- Offset past the end of the filtered set → empty `rows` with the full `totalCount` (documented repo contract).

### `backend/services/expenses/expense.service.test.ts` (+17 → 48 pass)
- create: driver insert failure → `EXPENSE_CREATE_FAILED` with `logger.error` and no audit row; creator user row missing → `Unknown` fallback name.
- replay hardening (Tier 4): corrupt audit metadata (non-record `metadata`, non-string `idempotencyKey`) is ignored and the create runs fresh; a replay whose original expense row is gone re-creates instead of returning a ghost (two inserts, two audit rows).
- createInternal: teacher user row missing → `Unknown` teacher-name fallback.
- update: no-op type/value patch on a Salaries row is accepted (trimmed equality branches of the immutability guard); repo update returning null → `EXPENSE_NOT_FOUND`.
- softDelete: provenance with null `sourceEntityId` skips the carryover lock entirely; a carryover row missing from the lock set proceeds to delete; repo softDelete returning null → `EXPENSE_NOT_FOUND`.
- bulkDelete: duplicate ids dedupe to one row/one audit; a malformed id in the batch rejects before the transaction opens; an already-deleted row re-lists in `deleted` without a second audit row.

### `backend/services/expenses/expense-helpers.test.ts` (+6 → 30 pass)
- `sumExpenseValues`: negative stored amount renders `-15.00`; malformed stored amount contributes zero; single-decimal `5.5` pads to `5.50`.
- `pickDominantExpenseCurrency`: a tied count keeps the earliest-seen currency.
- `validateUpdateInput`: fields explicitly patched to `null` skip validation (null/undefined skip branches).
- `validateCreateInput`: malformed `sourceEntityId` → `VALIDATION`.

### `backend/services/expenses/expense-idempotency.test.ts` (+2 → 10 pass)
- A different `createdByUserId` produces a different key (no cross-actor replay).
- `title`, `expenseValue`, `expenseCurrency`, and `expenseDate` each participate in the key (remaining per-field divergence).

### `app/api/expenses/export/route.test.ts` (+3 → 21 pass)
- Tier 4 CSV hardening: the remaining OWASP formula prefixes `+`, `-`, `@` are neutralized (`'` prefix), with negative assertions that no unescaped formula cell survives.
- Compound `accept-language: en-US,en;q=0.9` parses to the primary subtag → English error copy.
- Boundary: leap-day `paymentDateFrom=2024-02-29` accepted (200), complementing the existing impossible-day `2026-02-30` rejection.

## Verification evidence

Every relevant test file run via `bun run test/scripts/run-test.ts` after the edits:

| Test file | Result |
|---|---|
| `backend/db/test/repo/expenses/expense.repository.test.ts` | 21 pass / 0 fail |
| `backend/services/expenses/expense.service.test.ts` | 48 pass / 0 fail |
| `backend/services/expenses/expense-helpers.test.ts` | 30 pass / 0 fail |
| `backend/services/expenses/expense-idempotency.test.ts` | 10 pass / 0 fail |
| `backend/services/expenses/expense-internal.service.test.ts` (regression) | 5 pass / 0 fail |
| `backend/services/teachers/carryover-to-expense.service.test.ts` (regression) | 14 pass / 0 fail |
| `backend/graphql/query/billing/expense.query.test.ts` (baseline re-run) | 16 pass / 0 fail |
| `backend/graphql/mutation/billing/expense.mutation.test.ts` (concurrent-agent state) | 29 pass / 0 fail |
| `app/api/expenses/export/route.test.ts` | 21 pass / 0 fail |
| `test/workflows/expenses/expense-crud-audit-attribution.test.ts` (regression) | 9 pass / 0 fail |
| `test/workflows/expenses/carryover-pay-to-expense-ledger.test.ts` (regression) | 7 pass / 0 fail |
| `test/workflows/expenses/carryover-unpay-expense-softdelete.test.ts` (regression) | 8 pass / 0 fail |

Per-file quality loop `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exits 0 for all four files this task touched:
`backend/db/test/repo/expenses/expense.repository.test.ts`,
`backend/services/expenses/expense.service.test.ts`,
`backend/services/expenses/expense-helpers.test.ts`,
`backend/services/expenses/expense-idempotency.test.ts`,
`app/api/expenses/export/route.test.ts` (five files; `expense.mutation.test.ts` was reverted to its pre-edit state — net-zero change, owned by a concurrent outcome).

No UI/E2E tests were run (out of scope for TB.4). No git mutations performed. No production source files were modified — gaps were pure test additions.
