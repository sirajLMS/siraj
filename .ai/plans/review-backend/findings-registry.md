# Backend Review Findings Registry

| ID | Round | File:Line | Severity | Finding | Status | Fixed Round |
|----|-------|-----------|----------|---------|--------|-------------|
| F1 | R1 | backend/db/repo/billing/accounting-payment.repository.ts:204 | WARNING | Soft-delete: premise false — students/parents tables have no deletedAt (hard delete); invoices.deletedAt already excluded; comment documents the policy | CLOSED (false positive) | R1 |
| F2 | R1 | backend/db/repo/scheduling/class-instances.ts:884-896 | WARNING | Repo layer embeds business/accounting decisions (student-charge≡teacher-payout mapping, "0" fallback, SAR default currency) | VERIFIED | R1 |
| F3 | R1 | backend/db/repo/billing/accounting-payment.repository.ts:204 | SUGGESTION | created_at vs paymentDate filter split inconsistent within same repo | CLOSED (verified, no change needed) | R1 |
| F4 | R1 | backend/db/repo/billing/accounting-payment.repository.ts:208-236 | SUGGESTION | Hand-rolled 4-join chain duplicates joinedRowsQuery helper (leftJoin vs innerJoin semantics undocumented) | CLOSED (verified, no change needed) | R1 |
| F5 | R1 | backend/db/repo/billing/accounting-payment.repository.ts:78 | SUGGESTION | Hardcoded Error string replaced with DomainError("ACCOUNTING_PAYMENT_INSERT_FAILED", ...) following credit.repository.ts:181 sibling pattern | VERIFIED | R2 |
| F6 | R1 | backend/db/repo/billing/accounting-payment.repository.ts:199-203 | SUGGESTION | Inline filters/pagination object types instead of types from @/backend/types | VERIFIED | R1 |
| F7 | R1 | backend/db/repo/expenses/expense.repository.ts:101 | SUGGESTION | Inline pagination input type instead of named type in backend/types/expenses | VERIFIED | R1 |
| F8 | R1 | backend/db/repo/expenses/expense.repository.ts:104 | SUGGESTION | month used in eq() with no YYYY-MM shape guarantee at this layer (confirm service validates) | CLOSED (verified, no change needed) | R1 |
| F9 | R1 | backend/db/repo/scheduling/class-instances.ts:798-803 | SUGGESTION | startOfNextUtcMonth Date.UTC 2-digit-year quirk (0099-01 → 1999) — fail-closed 4-digit check | VERIFIED | R1 |
| F10 | R1 | backend/db/repo/scheduling/class-instances.ts:839-841 | SUGGESTION | Duplicated PROFIT_LOSS_MONTH_PATTERN in repo and service can drift — shared validator | VERIFIED | R1 |
| F11 | R1 | backend/graphql/query/index.ts:8 | SUGGESTION | import "./accounting" out of alphabetical order in barrel | VERIFIED | R1 |
| F12 | R2 | backend/db/repo/billing/package-plan.repository.ts:42 | SUGGESTION | Plain Error insert guard → DomainError("PACKAGE_PLAN_INSERT_FAILED", ...) | VERIFIED | R2 |
| F13 | R2 | backend/db/repo/teachers/carryover-balance.repository.ts:252 | SUGGESTION | Plain Error insert guard → DomainError("CARRYOVER_BALANCE_INSERT_FAILED", ...) | VERIFIED | R2 |
| F14 | R2 | backend/db/repo/expenses/expense.repository.ts:157 | SUGGESTION | Plain Error insert guard → DomainError("EXPENSE_INSERT_FAILED", ...) | VERIFIED | R2 |
