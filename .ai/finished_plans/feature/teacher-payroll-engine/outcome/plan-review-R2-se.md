# Plan Review — R2 (Software Engineering Quality)

- **Review Date**: 2026-08-26
- **Plan**: teacher-payroll-engine

## Issues Found & Fixed

1. **[CRITICAL]** `uuidColumn` used for FK column → fixed to `uuidDefaultColumn` (payrollCalculatedBy FK)
2. **[CRITICAL]** `check()` from drizzle-orm → fixed to `checkConstraint()` from dialectAwareBuilder (PG-only `check` silently no-ops on SQLite)
3. **[CRITICAL]** `textColumn("teacher_paid_amount", { precision: 12, scale: 2 })` → `textColumn("teacher_paid_amount")` (textColumn doesn't accept precision/scale options)
4. **[HIGH]** Missing advisory locks for concurrent payroll calculation → added documentation for `pg_advisory_xact_lock` on teacher inside batch calculation transaction
5. **[HIGH]** `DomainError("TEACHER_NOT_FOUND")` → `NotFoundError("TEACHER", tErrors.teacherNotFound(id))` (should use proper error class)
6. **[HIGH]** `DomainError("CLASS_INSTANCE_NOT_FOUND")` → `NotFoundError("CLASS_INSTANCE", tErrors.classes.notFound)` (same fix)

## Verified OK
- ✅ textColumn used for monetary amounts (SQLite compatibility)
- ✅ Idempotency keys from createHash("sha256") (7 references)
- ✅ requirePermission + requireAuth used (8 references)
- ✅ Tests paired with implementation (57 test references)
- ✅ Status-based locking for payroll (Not Calculated → Calculated) — acceptable optimistic lock pattern
- ✅ db.transaction used for batch operations (2 references)
