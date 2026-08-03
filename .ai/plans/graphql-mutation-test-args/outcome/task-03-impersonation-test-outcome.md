# Task-03: Impersonation Test Outcome

## Mutations Found in Test File

1. `startImpersonationMutationDocument` — required: `targetUserId`; optional: `reason` (InputMaybe<String>)
2. `endImpersonationMutationDocument` — no args
3. `createManualInvoiceMutationDocument` — required: `parentId`, `amount`, `currency`, `invoiceType`, `issueDate`, `dueDate`; optional: `studentId`, `exchangeRateSnapshot`, `exchangeRateSource`, `billingMonths`, `sendEmail`

## State Before Changes

### startImpersonation
- All call sites already passed both `targetUserId` (required) and `reason` (optional).
- `reason` tested with non-null value (`TEST_REASON`) in multiple tests (lines 112, 56-58 helper).
- `reason` tested with `null` in denial tests (lines 174, 201, 215).
- **No changes needed** — already compliant.

### endImpersonation
- No args. **No changes needed.**

### createManualInvoice
- Only one call site via `manualInvoiceVars(parentId)` helper — all 5 optional args set to `null`.
- **Missing**: No test exercised the optional args with non-null meaningful values.

## Changes Made

1. **Added `CurrencyCode` import**: Imported `CurrencyCode as CurrencyCodeEnum` from `@/frontend/common/graphql/generated/gql/graphql-types` to properly type the `currency` field in the new full-args variant.

2. **Added `manualInvoiceVarsFull` helper function**: A variant of `manualInvoiceVars` that provides meaningful non-null values for all 5 optional args:
   - `studentId`: uses the provisioned `studentId`
   - `exchangeRateSnapshot`: `'{"USD":"SAR","rate":"3.75"}'`
   - `exchangeRateSource`: `"ECB"`
   - `billingMonths`: `[{ month: 6, year: 2026 }, { month: 7, year: 2026 }]`
   - `sendEmail`: `true`
   - Also uses `CurrencyCodeEnum.Usd` for the `currency` field (type-safe)

3. **Added new test**: `"sensitive super-admin mutation with all optional args is blocked while impersonating"` — calls `createManualInvoiceMutationDocument` via `testClient.mutate` with all optional args set to non-null values. This is a denial test (impersonation blocks super-admin mutations), asserting `result.data?.createManualInvoice` is null and `result.error` is defined.

## Coverage Summary

| Mutation | Required Args | Optional Args | Non-null Test | Null Test |
|---|---|---|---|---|
| `startImpersonation` | `targetUserId` ✅ | `reason` | ✅ (TEST_REASON) | ✅ (null) |
| `endImpersonation` | none | none | N/A | N/A |
| `createManualInvoice` | all 6 ✅ | `studentId` | ✅ (manualInvoiceVarsFull) | ✅ (manualInvoiceVars) |
| | | `exchangeRateSnapshot` | ✅ (manualInvoiceVarsFull) | ✅ (manualInvoiceVars) |
| | | `exchangeRateSource` | ✅ (manualInvoiceVarsFull) | ✅ (manualInvoiceVars) |
| | | `billingMonths` | ✅ (manualInvoiceVarsFull) | ✅ (manualInvoiceVars) |
| | | `sendEmail` | ✅ (manualInvoiceVarsFull) | ✅ (manualInvoiceVars) |

## Backend Bugs Found

None.

## Quality Loop Results

- **tsgo**: No errors in file ✅
- **biome:check**: Clean (formatting applied) ✅
- **lint** (queue client, port 4777): `success: true`, exit code 0 ✅
