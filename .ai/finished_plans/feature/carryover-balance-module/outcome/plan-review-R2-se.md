# Plan Review — R2 (Software Engineering Quality)

- **Review Date**: 2026-08-26
- **Plan**: carryover-balance-module

## Issues Found & Fixed (10 total)

1. **[CRITICAL]** `uuidColumn` used for 7 FK columns → `uuidDefaultColumn` (teacherId, expenseId, createdByUserId, paidByUserId, carryoverId, classInstanceId, carryoverBalanceId)
2. **[CRITICAL]** `textColumn` with precision/scale options on 5 monetary columns → removed options (textColumn doesn't accept precision/scale)
3. **[CRITICAL]** `DomainError("CARRYOVER_NOT_FOUND")` → `NotFoundError("CARRYOVER", tErrors.carryover.notFound)` (2 instances)
4. **[CRITICAL]** `DomainError("CLASS_INSTANCE_NOT_FOUND")` → `NotFoundError("CLASS_INSTANCE", tErrors.classes.notFound)`
5. **[CRITICAL]** `DomainError("TEACHER_NOT_FOUND")` → `NotFoundError("TEACHER", tErrors.teachers.notFound)`
6. **[HIGH]** `DomainError("CARRYOVER_NO_INSTANCES")` → `ValidationError(tErrors.carryover.noInstances)` (validation, not domain error)
7. **[HIGH]** GraphQL query path: `query/teachers/` → `query/billing/`
8. **[HIGH]** GraphQL mutation path: `mutation/teachers/` → `mutation/billing/`
9. **[HIGH]** Types path: `types/teachers/` → `types/billing/`
10. **[HIGH]** sharedDocuments path: `sharedDocuments/teachers/` → `sharedDocuments/billing/`
11. **[HIGH]** Advisory locks documentation added for concurrent carryover creation

## Verified OK
- ✅ db.transaction used (5 references)
- ✅ Idempotency from createHash("sha256") (8 references)
- ✅ requirePermission used (8 references)
- ✅ Tests paired (60 test references)
- ✅ Pothos path correct: pothos/billing/carryover.pothos.ts
- ✅ No check() violations
- ✅ DomainError retained for business rules (CARRYOVER_SESSION_NOT_AUDITED, CARRYOVER_SESSION_ALREADY_LINKED) — correct usage
