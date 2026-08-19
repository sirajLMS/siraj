# Task 05: payment-method.test.ts — Outcome

## Mutations Found

1. `createUserPaymentMethodMutationDocument` — required: `input` (`UserPaymentMethodCreateInput`); optional: none at top level
2. `deleteUserPaymentMethodMutationDocument` — required: `id`; optional: none

## Input Type Fields

### `UserPaymentMethodCreateInput`
- **Required**: `details` (`PaymentMethodDetailsInput`), `direction` (`PaymentDirection`), `type` (`PaymentMethodType`), `userId` (`String`)
- **Optional** (`InputMaybe`): `isDefault` (`Boolean`), `label` (`String`)

### `PaymentMethodDetailsInput` (all optional / `InputMaybe`)
- `accountNumber`, `bankName`, `beneficiaryName`, `iban`, `identifier`, `note`, `onlineAccountId`, `paymentLinkId`, `phone`, `routingNumber`, `swiftBic`, `url`, `walletId`

## State Before Changes

- One `createUserPaymentMethod` test case existed. It passed all `UserPaymentMethodCreateInput` fields and all `PaymentMethodDetailsInput` fields, but optional fields were only tested with values (`isDefault: true`, `label: "Desk cash"`, `note: "Front desk collection"`) or `null` — not both across separate test cases.
- `deleteUserPaymentMethod` test passed the required `id` variable — no changes needed.

## Changes Made

1. **Renamed** the existing create test to "super admin can create a cash pay-in method with all optional fields null" and set ALL optional fields to `null` (`isDefault: null`, `label: null`, `note: null`, and all other `PaymentMethodDetailsInput` fields to `null`). This tests the "all nulls" path.

2. **Added** a new test "super admin can create a bank transfer payout method with all optional fields set" that passes meaningful values for ALL optional fields:
   - `isDefault: true`, `label: "Main bank account"`
   - All `PaymentMethodDetailsInput` fields: `note`, `walletId`, `phone`, `paymentLinkId`, `url`, `onlineAccountId`, `identifier`, `iban`, `bankName`, `beneficiaryName`, `swiftBic`, `accountNumber`, `routingNumber`
   - Added assertions verifying each optional value is persisted correctly.
   - Cleans up the second method via `deleteUserPaymentMethod` mutation so it doesn't leak across test runs.

3. **Fixed** the "fetch a single payment method by id" test — changed the stale `expect(method?.label).toBe("Desk cash")` assertion to `expect(method?.type).toBe(PaymentMethodType.Cash)` since the first method now has `label: null`.

## Coverage Summary

| Optional Field | Tested with value | Tested with null |
|---|---|---|
| `isDefault` | ✅ (test 2: `true`) | ✅ (test 1: `null`) |
| `label` | ✅ (test 2: `"Main bank account"`) | ✅ (test 1: `null`) |
| `details.note` | ✅ (test 2) | ✅ (test 1) |
| `details.walletId` | ✅ (test 2) | ✅ (test 1) |
| `details.phone` | ✅ (test 2) | ✅ (test 1) |
| `details.paymentLinkId` | ✅ (test 2) | ✅ (test 1) |
| `details.url` | ✅ (test 2) | ✅ (test 1) |
| `details.onlineAccountId` | ✅ (test 2) | ✅ (test 1) |
| `details.identifier` | ✅ (test 2) | ✅ (test 1) |
| `details.iban` | ✅ (test 2) | ✅ (test 1) |
| `details.bankName` | ✅ (test 2) | ✅ (test 1) |
| `details.beneficiaryName` | ✅ (test 2) | ✅ (test 1) |
| `details.swiftBic` | ✅ (test 2) | ✅ (test 1) |
| `details.accountNumber` | ✅ (test 2) | ✅ (test 1) |
| `details.routingNumber` | ✅ (test 2) | ✅ (test 1) |

## Backend Bugs / Cross-File Dependencies

None found.

## Quality Loop Results

- **tsgo**: ✅ No errors in `payment-method.test.ts` (errors in other parallel-agent files are out of scope)
- **biome:check**: ✅ Passed — no fixes applied
- **lint (queue client)**: ✅ Passed — `exitCode: 0`, no output
