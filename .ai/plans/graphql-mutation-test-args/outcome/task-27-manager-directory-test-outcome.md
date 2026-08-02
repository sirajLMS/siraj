# Task 27: Manager Directory Test Outcome

## Mutations Found
- `updateManagerProfileMutationDocument` — defined in `frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents.ts`

## Mutation Args Type
- **Args type**: `MutationUpdateManagerProfileArgs`
- **Variables**: `staffProfileId` (ID!, required), `input` (UpdateManagerProfileInput!, required)
- **Input type**: `UpdateManagerProfileInput` — all 4 fields are optional (`InputMaybe`):
  - `phone: InputMaybe<String>`
  - `status: InputMaybe<AccountStatus>`
  - `hourlyRate: InputMaybe<String>`
  - `rateCurrency: InputMaybe<CurrencyCode>`

## State Before Changes
All 5 mutation call sites already passed both `staffProfileId` and `input` with all 4 input fields. However, every call site (including the happy-path "Super Admin can update" test) passed `null` for `status`, `hourlyRate`, and `rateCurrency`. This meant no test case exercised the non-null code path for these optional fields.

## Changes Made
1. **Import**: Added `AccountStatus` and `CurrencyCode` enum imports alongside the existing `ManagerAccountType` import from `@/frontend/common/graphql/generated/gql/graphql-types`.
2. **Happy-path test ("Super Admin can update any manager profile")**: Changed the `input` object from all-null optional fields to meaningful non-null values:
   - `status: null` → `status: AccountStatus.Activated`
   - `hourlyRate: null` → `hourlyRate: "50"`
   - `rateCurrency: null` → `rateCurrency: CurrencyCode.Usd`
   - `phone` already had a meaningful non-null value (unchanged)

This ensures at least one test case passes non-null values for all optional fields, while the denial/error tests (which already pass `null`) cover the null case.

## Call Sites Summary
| Test | staffProfileId | input.phone | input.status | input.hourlyRate | input.rateCurrency |
|---|---|---|---|---|---|
| Super Admin update (happy path) | ✓ real | ✓ uniquePhone | ✓ Activated | ✓ "50" | ✓ Usd |
| Admin denied (fallback) | ✓ fake | ✓ phone | ✓ null | ✓ null | ✓ null |
| Admin denied (main) | ✓ real | ✓ phone | ✓ null | ✓ null | ✓ null |
| Admin denied staff | ✓ real | ✓ phone | ✓ null | ✓ null | ✓ null |
| Non-existent profile | ✓ fake | ✓ phone | ✓ null | ✓ null | ✓ null |

## Backend Bugs
None found.

## Quality Loop Results
- **tsgo**: PASS — 0 errors for this file (other files have pre-existing errors, unrelated to this task)
- **biome:check**: PASS — 0 errors, 0 warnings
- **lint (queue client)**: PASS — `{"success":true,"output":"","exitCode":0}`
