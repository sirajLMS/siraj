# Task 28: Manager Onboarding Test — Outcome

## Mutations Found
- `createManagerMutationDocument` — defined in `frontend/common/graphql/sharedDocuments/teachers/staff-onboarding.documents.ts`
  - Input type: `ManagerOnboardingInput` (single required `input` variable)

## ManagerOnboardingInput Fields (from `graphql-types.ts`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `accountType` | `ManagerAccountType` (enum) | Yes | `Admin`, `Manager`, `Supervisor` |
| `email` | `String` | Yes | |
| `name` | `String` | Yes | |
| `password` | `String` | Yes | |
| `avatarUrl` | `String` | No (InputMaybe) | |
| `displayCurrency` | `CurrencyCode` (enum) | No (InputMaybe) | `Usd`, `Egp`, `Eur`, … |
| `phone` | `String` | No (InputMaybe) | |
| `timezone` | `IanaTimezone` (enum) | No (InputMaybe) | `Utc`, `AfricaCairo`, … |

## Changes Made

### 1. Helper function renamed and typed
- **Before**: `createMinimalManagerInput` — weakly typed, used `??` defaults for required fields, always set optional fields to `null`/`IanaTimezone.Utc`
- **After**: `buildManagerInput` — strongly typed via `Partial<ManagerOnboardingInput> & { name, email, accountType }` intersection, returns `ManagerOnboardingInput`. Required fields (`name`, `email`, `accountType`) are mandatory call-site arguments; `password` defaults to a random UUID. Optional fields default to `null` when not overridden.

### 2. Test: "Super Admin can create manager with admin type" → renamed + enriched
- **Before**: Only passed `name`, `email`, `accountType` overrides; optional fields defaulted to `null` inside the helper.
- **After**: Now explicitly passes all 4 optional fields with realistic non-null values:
  - `avatarUrl: "https://example.com/avatar.png"`
  - `displayCurrency: CurrencyCode.Usd`
  - `phone: "+201000000000"`
  - `timezone: IanaTimezone.AfricaCairo`

This ensures the backend receives meaningful optional-field values and validates the full input shape.

### 3. Test: "Super Admin can create manager with manager type" → renamed + explicit nulls
- **Before**: Only passed `name`, `email` overrides; optional fields defaulted to `null` inside the helper.
- **After**: Explicitly passes `accountType: ManagerAccountType.Manager` and all 4 optional fields as `null`, making the null-case visible at the call site.

This covers the "at least one test should pass `null`" requirement.

### 4. Authorization denial tests — refactored to use `assertOperationDenied`
- **Before**: Inline `assertManagerCreationDeniedForRole` helper that called `loginDemoUser` + `testClient.mutate` with raw headers.
- **After**: Uses the shared `assertOperationDenied` helper from `helpers.ts` (per AGENTS.md rule 8 — "Use `assertOperationDenied` for authorization denial tests"). Each denial test now passes a fully-populated `buildManagerInput({ ... })` object.

### 5. Unauthenticated denial test — enriched
- **Before**: Called `createMinimalManagerInput()` with no overrides.
- **After**: Calls `buildManagerInput({ ... })` with explicit `name`, `email`, `accountType`, and all 4 optional fields as `null`.

### 6. Import changes
- Added: `CurrencyCode`, `IanaTimezone`, `type ManagerOnboardingInput` from `graphql-types`
- Added: `assertOperationDenied` from `helpers`

## Coverage Summary

| Field | Test with value | Test with null |
|---|---|---|
| `accountType` | Admin test, Manager test, all denial tests | N/A (required) |
| `email` | All tests | N/A (required) |
| `name` | All tests | N/A (required) |
| `password` | All tests (auto-generated) | N/A (required) |
| `avatarUrl` | Admin test (`"https://..."`) | Manager test, all denial tests |
| `displayCurrency` | Admin test (`CurrencyCode.Usd`) | Manager test, all denial tests |
| `phone` | Admin test (`"+201..."`) | Manager test, all denial tests |
| `timezone` | Admin test (`IanaTimezone.AfricaCairo`) | Manager test, all denial tests |

All 8 input fields are included in every mutation call site.

## Backend Bugs
None found.

## Quality Loop Results
- **tsgo**: ✅ 0 errors for this file (pre-existing errors in other files are unrelated)
- **biome:check**: ✅ passed
- **lint (queue client, port 4777)**: ✅ `{"success":true,"output":"","exitCode":0}`
