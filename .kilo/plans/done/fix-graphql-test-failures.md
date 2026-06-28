# Fix 7 Failing GraphQL Integration Tests

## Summary

Two distinct root causes for 7 test failures:

1. **Invoice tests (5 failures)**: `InvoiceType.MANUAL` is invalid — the PostgreSQL enum only accepts `PER_CLASSES` and `MONTHLY`
2. **Group-class tests (2 failures)**: Hardcoded `SEEDED_CLASS_INSTANCE_ID` doesn't exist in seed data, so `getByClassInstanceId` returns null → Arabic "not found" error

---

## Root Cause 1: Invalid InvoiceType Enum Value

**Failing tests:**
- `createManualInvoice mutation > admin creates a manual invoice with UNPAID status`
- `markInvoicePaid and deleteInvoice > create an UNPAID invoice for mark-paid tests`
- `markInvoicePaid and deleteInvoice > admin marks UNPAID invoice as PAID`
- `markInvoicePaid and deleteInvoice > create a second UNPAID invoice for delete tests`
- `markInvoicePaid and deleteInvoice > admin soft-deletes an invoice`

**Evidence:** The SQL error shows `invoice_type = $8 = MANUAL`, but the `InvoiceType` enum (`shared/lib/enum.ts:69-72`) only defines:
```ts
export enum InvoiceType {
  PER_CLASSES = "PER_CLASSES",
  MONTHLY = "MONTHLY",
}
```
The PostgreSQL `invoice_type` enum only accepts these two values. `MANUAL` causes a DB insert constraint violation.

**Fix:** Add `MANUAL = "MANUAL"` to the `InvoiceType` enum, then regenerate the DB enum.

### Steps:
1. **`shared/lib/enum.ts`**: Add `MANUAL = "MANUAL"` to `InvoiceType` enum
2. **`backend/db/schema/enums.ts`**: No change needed — `createPgEnumFromEnum` derives from the TS enum automatically
3. **Database migration**: Run `bun run db push` to add the new enum value to PostgreSQL
4. **Re-seed**: `bun run db seed` (to ensure consistency)
5. **Codegen**: `bun run generate:gqlSchema && bun codegen` (to update generated types)

---

## Root Cause 2: Hardcoded Class Instance ID in group-class.test.ts

**Failing tests:**
- `groupClassAudit query > admin can query groupClassAudit with valid classInstanceId`
- `updateClassAdminNote mutation > admin can update admin note`

**Evidence:** The test hardcodes `SEEDED_CLASS_INSTANCE_ID = "cdbf985e-871d-492a-a86e-1c2cf1572893"` but this UUID doesn't appear in any seed file. The `GroupClassRepository.getByClassInstanceId()` returns null, and the service throws `t("notFound")` which resolves to Arabic "غير موجود".

**Fix:** Dynamically fetch a valid class instance ID from the seeded data (like other tests do — e.g., `class-instance-detail.test.ts` provisions its own entities).

### Steps:
1. **`frontend/graphql/test/group-class.test.ts`**: Replace the hardcoded UUID with a dynamic lookup:
   - In the first test ("login as academy_admin"), after login, query a seeded group class instance via an authenticated query (e.g., `dailyScheduleList` or by directly querying `groupClassAudit` with a known-seeded class instance ID from a schedule query)
   - Alternatively, follow the pattern from `class-instance-detail.test.ts` which provisions test entities dynamically using seed data from `helpers.ts`
   - The simplest approach: add a helper that queries `groupClassAudit`-compatible data by first querying the schedule to get a valid class instance ID, then use that ID

   **Preferred approach** (minimal change): Query `dailyScheduleList` to get a valid `classInstanceId`, since seeded group_classes are linked to seeded class instances. The test already logs in as `academy_admin`, so we can add a setup step that fetches a valid ID.

   **Concrete implementation:**
   - Import `dailyScheduleListQueryDocument` from shared documents (or use `adminDashboardScheduleQueryDocument`)
   - In the "login as academy_admin" test, after getting the token, query the schedule to extract a class instance ID
   - Store it as `classInstanceId` and use it in subsequent tests
   - This mirrors how `class-instance-detail.test.ts` provisions test entities

2. Run `bun run test:graphql` to verify all 7 tests pass

---

## Verification

After both fixes:
1. `bun run db push` — apply enum change
2. `bun run db seed` — re-seed if needed
3. `bun run generate:gqlSchema && bun codegen` — regenerate types
4. `bun run test:graphql` — all 228 tests should pass (221 pass + 7 fixed = 228 pass, 0 fail)

## Risk Assessment

- **Root Cause 1** is low-risk: adding an enum value is backward-compatible. No existing records use `MANUAL`, and the new value simply expands the allowed set.
- **Root Cause 2** is low-risk: making the test dynamic instead of hardcoded is a test-only change with no production impact.
