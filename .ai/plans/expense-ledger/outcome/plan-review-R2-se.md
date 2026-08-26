# Plan Review — R2 (Software Engineering Quality)

- **Review Date**: 2026-08-26
- **Plan**: expense-ledger

## Issues Found & Fixed (9 total)

1. **[CRITICAL]** `uuidColumn` for 4 FK columns → `uuidDefaultColumn` (teacherId, sourceEntityId, createdByUserId, deletedByUserId)
2. **[CRITICAL]** `textColumn("expense_value", { precision: 12, scale: 2 })` → `textColumn("expense_value")` (textColumn doesn't accept precision)
3. **[HIGH]** 4 `DomainError` for validation → `ValidationError` (title required, value required, value negative, currency required)
4. **[HIGH]** `DomainError("EXPENSE_CREATE_FAILED")` — added `logger.error()` before throw (system error should be logged)
5. **[HIGH]** query path: `query/expenses/` → `query/billing/`
6. **[HIGH]** mutation path: `mutation/expenses/` → `mutation/billing/`
7. **[HIGH]** types path: `types/expenses/` → `types/billing/`
8. **[HIGH]** sharedDocuments path: `sharedDocuments/expenses/` → `sharedDocuments/billing/`
9. **[INFO]** Missing advisory lock — expense creation doesn't need advisory locks (single-table write, no concurrent balance modifications)

## Verified OK
- ✅ db.transaction used (4 references)
- ✅ Idempotency key (1 reference — createInternal method)
- ✅ requirePermission used (8 references)
- ✅ Tests paired (53 test references)
