# Task TB.5 Outcome — 4-Tier Test Verification for Carryover Balance Module

- **Date**: 2026-09-05
- **Status**: ✅ Complete
- **Method**: Per-file inventory reasoning (no coverage tooling available/required); Tier 1 = branch/statement/error-path coverage of the new code, Tier 4 = permission denial / oversized input / injection / replay-tamper cases.

## Target → test-file mapping (verdict before gap-fill)

| Target | Test file(s) | Tier 1 before | Tier 4 before | Verdict |
|---|---|---|---|---|
| `backend/services/teachers/carryover-balance.service.ts` | `carryover-balance.service.test.ts`, `carryover-to-expense.service.test.ts`, `carryover-crud.service.test.ts` | bulk-create strong (guards, FX missing+stale, replay, burst, truncation); to-expense strong (already-paid, date validation, replay, ledger rollback); CRUD partial (create/update/delete/bulkDelete/unpay happy + paid-guard only) | permission denial on bulk-create only; tampered re-submit present | **Gaps** — see below |
| `backend/services/teachers/carryover-idempotency.ts` | `carryover-idempotency.test.ts` | Full: determinism, order-independence, per-field divergence, null/undefined normalization, unicode, cross-scope isolation | n/a (pure hash fn); tamper-distinctness covered | COVERED |
| `backend/services/teachers/carryover-aggregate.ts` | `carryover-aggregate.test.ts` | Full except the exact-half branch of `roundHalfEven` | n/a (pure fn) | **Gap** — half-even branch |
| `backend/db/repo/teachers/carryover-balance.repository.ts` | `backend/db/test/repo/teachers/carryover.repository.test.ts` | Full: every method, null branches, empty inputs, pagination, `FOR UPDATE` lock contention, non-tx reads | LIKE `%` wildcard escape | **Gap** — injection payload battery (`'`, `_`, backslash) |
| `backend/db/repo/scheduling/class-instances.ts` (carryover methods only) | `backend/db/test/repo/scheduling/class-instances-carryover.repository.test.ts` | Full: `getByIdsForUpdate`, `linkToCarryover`, `unlinkFromCarryover`, `findByCarryoverId` incl. empty lists + unknown ids + isolation | n/a (ids are parameterized) | COVERED |
| `backend/db/repo/teachers/teacher.repository.ts` (`isDisabled` only) | `backend/db/test/repo/teachers/teacher.repository.test.ts` | Full: disabled→true, active→false, unknown id→false | n/a | COVERED |
| `backend/graphql/query/teachers/carryover.query.ts` | `backend/graphql/query/teachers/carryover.query.test.ts` | Full: page shape, filter mapping (incl. null/blank/invalid paidStatus), pagination defaults, DataLoader batching, ISO serialization | FORBIDDEN (view-only, logged-out), UNAUTHENTICATED (no user id), superadmin bypass | COVERED |
| `backend/graphql/mutation/teachers/carryover.mutation.ts` | `backend/graphql/mutation/teachers/carryover.mutation.test.ts` | Full: all 7 mutations map args correctly, actor injected from context (never accepted from input), null passthrough | FORBIDDEN for view-only + logged-out on **all 7** mutations; UNAUTHENTICATED; empty selection VALIDATION; **>500 ids rejected via @constraint** | COVERED |
| `app/api/carryover/export/route.ts` | `app/api/carryover/export/route.test.ts` | Full: 401/403/500 branches, all param validators (dates incl. impossible day, paidStatus, includeDisabledTeachers, search >200→400 / =200 ok), truncation header, blank→default filters | **CSV/formula injection neutralization** (`=`, `-`, tab, CR prefixes; quote doubling); oversized search rejected | COVERED |

## Gaps filled (all additions to existing per-file harnesses)

### `backend/services/teachers/carryover-balance.service.test.ts` (+5 tests → 18 total)
- Rejects with `TEACHER_NOT_FOUND` when a session's teacher row is gone (insert-group guard).
- `teacherPaidAmount`/`teacherPaidCurrency` null fallbacks aggregate as `0.00` in the dominant currency.
- Malformed FX rate (`rate: "not-a-rate"`, not stale) passes the rate-presence guard but fails parsing → `CARRYOVER_AMOUNT_INVALID` (two-session SAR/USD tie forces the conversion path).
- Tier 4 replay-hardening: corrupt audit metadata (matching key, missing fields; non-object metadata) is ignored and the creation re-runs instead of fabricating group results.
- Duplicate instance ids dedupe before the row lock.

### `backend/services/teachers/carryover-to-expense.service.test.ts` (+6 tests → 14 total)
- Unknown carryover id in the batch → `CARRYOVER_NOT_FOUND` before any expense write.
- Empty selection → `VALIDATION` before the transaction opens.
- Duplicate ids settle once.
- Tier 4: permission denial (`FORBIDDEN`) without opening the transaction.
- Tier 4: corrupt replay audit metadata (`expenseId: 42` number) ignored → real settlement runs.
- `CarryoverBalanceRepository.update` returning null mid-settle → `CARRYOVER_TO_EXPENSE_FAILED`.

### `backend/services/teachers/carryover-crud.service.test.ts` (+26 tests → 41 total; mocks extended with replay-row seeding, `findFiltered`, `findLinkedSessionRows`)
- create: teacher-not-found; invalid/negative/over-precision payable ×3; reversed period; Tier-4 permission denial; Tier-4 markup sanitization of `note`/`studentsText` (`<script>…</script>` stripped before persist); **idempotent replay returns the original row** (audit lookup → `getById` hit); replay row pointing at a deleted carryover falls through to a fresh create.
- update: unknown id; invalid payable; reversed period; explicit-null patch fields clear columns; repo update returning null → `CARRYOVER_NOT_FOUND`.
- delete: unknown id; corrupt snapshot status (`LEGACY_REMOVED_STATUS`) → `CARRYOVER_SNAPSHOT_INVALID`; PARTIALLY snapshot missing its percentage → `CARRYOVER_SNAPSHOT_INVALID`; manual carryover with zero items deletes without touching sessions; permission denial.
- bulkDelete: happy path (two rows, two audit entries); empty selection; unknown id in batch.
- unpay: not-paid → `CARRYOVER_NOT_PAID`; unknown id; paid row without `expenseId` skips the expense soft-delete; revert update returning null → `CARRYOVER_NOT_FOUND`.
- getReport: fast-path aggregates derived from the covering page (totals/dominant currency/split counts); second-scan path when the page does not cover the set (`{ limit: 10000, offset: 0 }`); view-permission denial with zero repo reads.
- getById / getLinkedSessions: happy serialization (ISO timestamps, teacher display join) + not-found rejections.

### `backend/services/teachers/carryover-aggregate.test.ts` (+1 test → 30 total)
- Banker's-rounding half branch: 1.5 min → `0.02` (even), 4.5 min → `0.08` (odd up), 0.3 min → `0.00`.

### `backend/db/test/repo/teachers/carryover.repository.test.ts` (+1 test → 38 total)
- Tier 4 injection battery on `findFiltered` search: `%`, `_`, `' OR '1'='1`, `'; DROP TABLE carryover_balances; --`, `test\%_` all treated as literal text (no matches, no error); table verified intact and the exact search still matches afterwards. Sequential `reduce` chain (rollback tx is single-connection).

## One debug iteration worth recording

The CRUD replay tests initially failed because `backend/services/teachers/carryover-idempotency.ts` was
edited concurrently (the CRUD key now also hashes `studentsCount`, `studentsText`, `note`). The seeded
replay rows were re-derived with the full payload; tests then passed. The idempotency test file itself
remains green against the new contract (34/34).

## Verification evidence

Every touched or relevant test file run via `bun run test/scripts/run-test.ts`:

| Test file | Result |
|---|---|
| `backend/services/teachers/carryover-balance.service.test.ts` | 18 pass / 0 fail |
| `backend/services/teachers/carryover-to-expense.service.test.ts` | 14 pass / 0 fail |
| `backend/services/teachers/carryover-crud.service.test.ts` | 41 pass / 0 fail |
| `backend/services/teachers/carryover-idempotency.test.ts` | 34 pass / 0 fail |
| `backend/services/teachers/carryover-aggregate.test.ts` | 30 pass / 0 fail |
| `backend/db/test/repo/teachers/carryover.repository.test.ts` | 38 pass / 0 fail |
| `backend/db/test/repo/scheduling/class-instances-carryover.repository.test.ts` | 7 pass / 0 fail |
| `backend/db/test/repo/teachers/teacher.repository.test.ts` | 29 pass / 0 fail (incl. `isDisabled`) |
| `backend/graphql/query/teachers/carryover.query.test.ts` | 20 pass / 0 fail |
| `backend/graphql/mutation/teachers/carryover.mutation.test.ts` | 39 pass / 0 fail |
| `app/api/carryover/export/route.test.ts` | 16 pass / 0 fail |

Per-file quality loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` → tsgo → oxlint → biome → type-aware lint → duplicates → codescene) exits 0 for all five touched test files. One oxlint `no-await-in-loop` warning in the new injection test was fixed with the repo-prescribed sequential `reduce` chain before final pass.

No UI/E2E tests were run (out of scope for TB.5). No git mutations performed.
