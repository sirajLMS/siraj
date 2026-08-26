# Plan Review — R2 (Software Engineering Quality)

- **Review Date**: 2026-08-26
- **Plan**: credit-adjustment-system
- **Files Reviewed**: specs.md, implementation.md, trackable-tasks.md

## Issues Found & Fixed

1. **[CRITICAL]** `uuidColumn` used for FK columns → fixed to `uuidDefaultColumn` (5 FK columns: studentId, sourcePaymentId, classInstanceId, creditedByUserId, carryoverTeacherId). `uuidColumn` is PK-only; `uuidDefaultColumn` adds `.defaultRandom()`.
2. **[HIGH]** Missing advisory locks for concurrent credit modifications → added documentation for `pg_advisory_xact_lock(hashtext('student_${id}'))` inside each `db.transaction` block.
3. **[OK]** NotFoundError already present (4 references) for student/teacher existence checks.
4. **[OK]** Idempotency key from `createHash("sha256")` is INSIDE `db.transaction` for all 3 operations (Add, Subtract, Subtract With Carryover).
5. **[OK]** Mutations return `CreditTransactionReturnType` entity (not Boolean).
6. **[OK]** Tests paired with implementation tasks (43 test references).
7. **[OK]** Carryover dependency on Plan 5 documented (5 references).
8. **[OK]** Error handling uses correct classes (ValidationError, NotFoundError, ConflictError) with tErrors.

## Verification

- ✅ 1 `uuidColumn` reference (PK only — correct)
- ✅ 5 `uuidDefaultColumn` references (all FKs — correct)
- ✅ Advisory lock documentation added
- ✅ All 3 operations have idempotency check inside transaction
- ✅ Mutations return entity type
