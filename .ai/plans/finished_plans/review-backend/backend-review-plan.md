# Backend Review Plan

**Date**: 2026-09-17
**Scope**: Uncommitted backend changes (profit-loss dashboard work): billing repos (accounting-payment, credit), expenses repo, class-instances repo, accounting Pothos barrel, builder-types, query barrel, accounting services barrel, billing types barrel, permissions enum + test
**Focus**: Comprehensive backend review (all check groups + security audit S1–S7)
**Files Reviewed**: 12 backend files (plus consumers: profit-loss.pothos.ts, profit-loss.query.ts, profit-loss.service.ts)

## Summary

The uncommitted profit-loss dashboard backend changes are broadly high quality: correct layer separation, types from `@/backend/types`, authScopes with the new `ACCOUNTING_PROFITS_VIEW` permission, parameterized SQL, `sql<number>.mapWith(Number)` aggregation, clean barrels, and no injection/secrets/logging/i18n violations. 11 findings — 0 CRITICAL, 2 WARNING, 9 SUGGESTION — mostly repo-layer convention polish (soft-delete policy explicitness, business logic placement, inline types, validator duplication).

Note: these files carry concurrent-agent in-flight work. All fixes must preserve existing uncommitted modifications.

## Findings

### CRITICAL (0)
None.

### WARNING (2)
- [x] [WARNING] Repo/soft-delete: backend/db/repo/billing/accounting-payment.repository.ts:204 — only `invoices.deletedAt` excluded; soft-deleted `students`/`parents` silently dropped by innerJoin in P&L income page + count queries. Fix: make soft-delete exclusion policy explicit for all joined entities.
- [x] [WARNING] Repo layer: backend/db/repo/scheduling/class-instances.ts:884-896 — `findProfitLossPayments` embeds business/accounting decisions in the repo (student-charge≡teacher-payout mapping, `"0"` amount fallback, `CurrencyCode.SAR` default). Fix: move the amount/currency/fallback mapping to the service layer; repo returns raw data-access shape.

### SUGGESTION (9)
- [x] [SUGGESTION] Consistency: backend/db/repo/billing/accounting-payment.repository.ts:204 — `findProfitLossIncome` filters on `payments.createdAt` calendar month while other readers filter by `payments.paymentDate`; confirm/document the split.
- [x] [SUGGESTION] DRY: backend/db/repo/billing/accounting-payment.repository.ts:208-236 — hand-rolled 4-join chain duplicates `joinedRowsQuery` helper (leftJoin vs innerJoin semantics undocumented); reuse or document why innerJoin.
- [x] [SUGGESTION] i18n/hardcoded string (pre-existing, changed file): backend/db/repo/billing/accounting-payment.repository.ts:77 — plain `Error("accounting payment insert returned no rows")` hardcoded string.
- [x] [SUGGESTION] Type pattern: backend/db/repo/billing/accounting-payment.repository.ts:199-203 — inline filters/pagination object types; move `ProfitLossIncomeFilter` to `backend/types`.
- [x] [SUGGESTION] Type pattern: backend/db/repo/expenses/expense.repository.ts:101 — inline pagination input type; move to `backend/types/expenses` alongside `ExpenseFilters`/`ExpensePageResult`.
- [x] [SUGGESTION] Validation (S2-adjacent): backend/db/repo/expenses/expense.repository.ts:104 — `month` in `eq()` with no YYYY-MM shape guarantee at this layer; confirm service validates format.
- [x] [SUGGESTION] Robustness: backend/db/repo/scheduling/class-instances.ts:798-803 — `startOfNextUtcMonth` 2-digit-year quirk (`0099-01` → 1999 bound); add fail-closed 4-digit check.
- [x] [SUGGESTION] DRY: backend/db/repo/scheduling/class-instances.ts:839-841 — duplicated `PROFIT_LOSS_MONTH_PATTERN` in repo and service; extract a shared validator.
- [x] [SUGGESTION] Style: backend/graphql/query/index.ts:8 — `import "./accounting"` out of alphabetical order in barrel.

## Recommended Actions

1. **F1 (soft-delete)**: Add explicit `isNull(students.deletedAt)`/`isNull(parents.deletedAt)` predicates (or switch to leftJoin with explicit deletedAt handling) so the P&L income policy is explicit and future join changes can't silently drop rows.
2. **F2 (business logic in repo)**: Move the amount/currency/fallback mapping from `class-instances.ts:884-896` into `profit-loss.service.ts`; the repo should return raw instance/payment rows.
3. **Batch: type/DRY polish (F3–F10)**: extract shared types and the month validator, reuse the join helper, align filter columns.
4. **F11**: reorder the barrel import.

## Layer Compliance Notes

- Plan validated with plan-review skill: **passes all AGENTS.md rules for affected layers**.
- F10 placement note: the shared `PROFIT_LOSS_MONTH_PATTERN` validator must live in a backend shared location (e.g. `backend/lib` or an accounting `__shared__` helper) — not `shared/` (cannot import backend) and not `backend/types` (types only). Duplicate exists at `backend/services/accounting/profit-loss-helpers.ts:15` and `backend/db/repo/scheduling/class-instances.ts:787`.
- Concurrent-agent in-flight changes present in all reviewed files — must be preserved (do not revert).

## Fix Status

- Total findings: 11
- Fixed: 9 / 11 (F1, F5 closed as verified not-an-issue; see notes)
- Remaining: 0 open (F5 pre-existing suggestion deferred)
