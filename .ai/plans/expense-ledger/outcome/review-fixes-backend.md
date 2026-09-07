# Review Fixes — Backend/Types Round 1 (expense-ledger)

- **Date**: 2026-09-07
- **Status**: ✅ Complete
- **Scope**: the backend/types items from `review-backend-R1.md` + `review-types-R1.md`
  (findings 2/4/5/7/8 + dead code + join parity, and all 5 types-review findings minus the
  frontend comment fix, which belongs to the frontend fix agent).

## Per-finding resolution

| # | Finding (source review) | Resolution |
|---|---|---|
| R-B1/VULN-1 | re-type INTO `Salaries` via `updateExpense` (backend review #2) | ✅ Fixed — `assertSalariesImmutability` now rejects `input.type === SALARIES && existing.type !== SALARIES` with `EXPENSE_SALARIES_VIA_CARRYOVER_ONLY` (existing localized key reused); new service test proves no write/audit |
| R-B2 | create idempotency concurrent-first-write race (backend review #4) | ✅ Fixed — `create` (the tx-owning entry point) acquires `acquireAdvisoryLock(tx, "expense-create:" + deriveCreateIdempotencyKey(input))` before the replay scan (lock-then-replay, credit-adjustments precedent). `createInternal` deliberately takes NO advisory lock inside a caller tx — the settlement flow is already serialized by its own `carryover-to-expense:<key>` batch lock, and the callee-with-caller-tx rule (`backend/services/AGENTS.md`) forbids nested lock acquisition. No unique-constraint alternative was used; the proven advisory-lock pattern is the only repo precedent. Tests: lock-then-scan ordering, concurrent duplicate burst serialized onto one row/one audit, no lock when `clientRequestId` absent |
| R-B3 | lock-order inversion `softDeleteInTx` vs `unpayCarryoverBalance` (backend review #5) | ✅ Fixed — canonical order is **carryover first, expense second** (the unpay direction). `softDeleteInTx` now pre-reads the row non-locking (provenance columns are write-once, never patched — safe), locks the linked carryover via `getByIdsForUpdate`, THEN takes the expense `FOR UPDATE` lock and re-verifies existence/`deletedAt`; `EXPENSE_DELETE_VIA_UNPAY` guard semantics unchanged. New test asserts the recorded lock order; all prior softDelete/bulkDelete tests stay green |
| R-B4 | `expenseDate` month 01–12 validation gap (backend review #7) | ✅ Fixed — `assertExpenseMonthShape` rejects out-of-range months (`2026-13`, `2026-00`) in addition to the shape check; reuses the existing `tErrors.expenses.expenseDateInvalid` key (no new locale keys). Covered on both create and update input validation; the optional DB CHECK tightening remains a possible follow-up migration, not done here |
| R-B5 | manual `expenseValue` not canonicalized (backend review #8) | ✅ Fixed — new exported `canonicalizeExpenseValue` in `expense-helpers.ts` (reuses the existing minor-unit parse; extracted shared `formatMinorUnits` renderer from `sumExpenseValues`), mirroring carryover's `normalizePayableAmount` two-decimal contract. Applied at `insertExpense` and `buildUpdatePatch`; `assertSalariesImmutability` compares the canonicalized form so a `"2500.0"` no-op patch on a salary row is not rejected. Helper + service tests cover `"1.5"`/`" 1.50 "`/`"2500"`/`"0"` |
| R-B6a | dead `ExpenseRepository.bulkSoftDelete` (backend review #6) | ✅ Removed from the repo; its test coverage moved into the `softDelete` describe as a sequential per-row delete test (skips unknown ids) |
| R-B6b | dead `CreateExpenseInternalInput` type (backend review #6, types review) | ✅ Removed from `backend/types/billing/expense.types.ts` |
| R-B7 | `findFiltered` vs `countFiltered` join asymmetry (backend review #10 note) | ✅ Fixed — the count query now applies the same `innerJoin(users, ...)` as the row query so `totalCount` never disagrees with the returned pages. Repo tests stay green |
| R-B8 | duplicate `ExpenseType` enum across backend/shared (types review MEDIUM) | ✅ Fixed — `backend/enum/expenses/expense-type.enum.ts` is now a re-export shim (`export { ExpenseType } from "@/shared/constants/expenses/expense-type.enum"`), matching the CurrencyCode/IANATimezone convention; the shared file is now documented as canonical; `backend/types/AGENTS.md` completed-migrations list updated. pgEnum registration and Pothos wiring untouched (same symbol, same values) |
| R-B9 | duplicate `EXPENSE_SOURCE_CARRYOVER_BALANCES` (types review MEDIUM) | ✅ Fixed — local declaration deleted from `expense.service.ts`; both `expense.service.ts` and `carryover-balance.service.ts` import the canonical constant from `@/shared/constants/expenses/expense-source.constants` |
| R-B10 | `ExpenseUpdatePatch` admitted patchable provenance/creation columns (types review) | ✅ Fixed — type now omits `"id" | "createdAt" | "createdByUserId" | "sourceEntity" | "sourceEntityId"` |
| R-B11 | stale comment in `useExpensesViewModel.ts` (types review) | ⏭️ Skipped — frontend scope, handled by the frontend fix agent |
| R-B12 | `deferred-items.md` template residue (backend review hygiene note) | ✅ Fixed — template example rows D1–D3 removed and header placeholders filled. Statuses recorded as current: D4 ❌ (staging rehearsal, external), D5 🔄 (UI/E2E suites authored but never executed, per 8.1 outcome), D6 ❌ (NOT NULL + `set null` contradiction still open — noted that the R1 companion join-parity fix landed), D7 ❌ (no entity-scoped audit query) |

### Explicitly not done (reviewer info/low items out of the fix list)

- Idempotency window constant (60s vs spec's 30s) — spec/code wording alignment is documentation scope, not backend behavior.
- PG CHECK tightening to month range — optional follow-up migration per the review.
- `created_by_user_id` NOT NULL + `ON DELETE SET NULL` contradiction — tracked as deferred-items D6.
- `deleteExpense` always-`true` result / empty-patch audit rows — cosmetic, noted in review as INFO.

## Files touched

| File | Change |
|---|---|
| `backend/services/expenses/expense.service.ts` | re-type gate, advisory lock in `create`, canonicalized values, carryover-first lock order, shared provenance constant import, dropped local constant/export |
| `backend/services/expenses/expense-helpers.ts` | month 01–12 range check, `canonicalizeExpenseValue` + extracted `formatMinorUnits` |
| `backend/services/expenses/expense.service.test.ts` | +6 tests (re-type gate, advisory-lock ordering, concurrent burst, no-key no-lock, value canonicalization ×2, lock-order proof) |
| `backend/services/expenses/expense-helpers.test.ts` | +6 tests (month range create/update, canonicalizer) |
| `backend/db/repo/expenses/expense.repository.ts` | `countFiltered` join parity; `bulkSoftDelete` removed |
| `backend/db/test/repo/expenses/expense.repository.test.ts` | `bulkSoftDelete` describe replaced by sequential `softDelete` coverage |
| `backend/types/billing/expense.types.ts` | `ExpenseUpdatePatch` hardened; `CreateExpenseInternalInput` deleted |
| `backend/enum/expenses/expense-type.enum.ts` | re-export shim to shared canonical enum |
| `shared/constants/expenses/expense-type.enum.ts` | docstring now declares the file canonical |
| `backend/services/teachers/carryover-balance.service.ts` | `EXPENSE_SOURCE_CARRYOVER_BALANCES` imported from shared constants |
| `backend/types/AGENTS.md` | `ExpenseType` added to completed cross-layer enum migrations |
| `.ai/plans/expense-ledger/deferred-items.md` | template rows removed; D4–D7 statuses/notes brought current |

## Verification (all `bun run test/scripts/run-test.ts`, all green)

| Suite | Result |
|---|---|
| `backend/services/expenses/expense.service.test.ts` | 55 pass / 0 fail |
| `backend/services/expenses/expense-helpers.test.ts` | 33 pass / 0 fail |
| `backend/services/expenses/expense-internal.service.test.ts` | 5 pass / 0 fail |
| `backend/services/expenses/expense-idempotency.test.ts` | 10 pass / 0 fail |
| `backend/services/teachers/carryover-balance.service.test.ts` | 21 pass / 0 fail |
| `backend/db/test/repo/expenses/expense.repository.test.ts` | 22 pass / 0 fail |
| `backend/graphql/mutation/billing/expense.mutation.test.ts` | 29 pass / 0 fail |
| `backend/graphql/query/billing/expense.query.test.ts` | 16 pass / 0 fail |
| `app/api/expenses/export/route.test.ts` | 24 pass / 0 fail |
| `test/workflows/expenses/expense-crud-audit-attribution.test.ts` | 9 pass / 0 fail |
| `test/workflows/expenses/carryover-pay-to-expense-ledger.test.ts` | 7 pass / 0 fail |
| `test/workflows/expenses/carryover-unpay-expense-softdelete.test.ts` | 8 pass / 0 fail |

### Per-file `sub-loop --lifecycle codescene` — all exit 0

`backend/enum/expenses/expense-type.enum.ts`, `shared/constants/expenses/expense-type.enum.ts`,
`backend/types/billing/expense.types.ts`, `backend/db/repo/expenses/expense.repository.ts`,
`backend/services/expenses/expense.service.ts`, `backend/services/expenses/expense-helpers.ts`,
`backend/services/expenses/expense.service.test.ts`, `backend/services/expenses/expense-helpers.test.ts`,
`backend/db/test/repo/expenses/expense.repository.test.ts` (en-route fix: `no-await-in-loop` →
sequential reduce), `backend/services/teachers/carryover-balance.service.ts`.

No locale keys were added (existing `expenses.*` keys reused), so no locale snapshot re-run was
needed. No UI/E2E runs per scope. No git mutations. `trackable-tasks.md` untouched.

## Notes

- Project-wide `bun tsgo` currently reports pre-existing errors in unrelated files owned by other
  in-flight work (`backend/services/communication/test/complaint-validation.helpers.test.ts`,
  `test/ui/components/classes/*`, `test/ui/components/supervisor/teacherDuesViewModel.test.ts`);
  none of the errors touch expense-ledger scope, and the per-file sub-loop tsgo stage passes for
  every file listed above.
