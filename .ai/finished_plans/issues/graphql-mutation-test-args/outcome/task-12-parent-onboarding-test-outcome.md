# Task 12: parent-onboarding.test.ts — Outcome

## Mutations Found

- `createParentMutationDocument` — defined in `frontend/common/graphql/sharedDocuments/parents/parent-onboarding.documents.ts`
  - Top-level args: `input: ParentOnboardingInput!` (required, no optional top-level args)

## ParentOnboardingInput Fields (from generated types)

| Field | Required | Tested non-null | Tested null |
|---|---|---|---|
| `email` | Yes | `createFullParentInput` | `createMinimalParentInput` |
| `name` | Yes | `createFullParentInput` | `createMinimalParentInput` |
| `password` | Yes | `createFullParentInput` | `createMinimalParentInput` |
| `timezone` | Yes | `createFullParentInput` (`IanaTimezone.AmericaChicago`) | `createMinimalParentInput` (`IanaTimezone.Utc`) |
| `address` | optional | `createFullParentInput` (`"123 Main St"`) | `createMinimalParentInput` (`null`) |
| `avatarUrl` | optional | `createFullParentInput` (`"https://example.com/avatar.png"`) **— NEW** | `createMinimalParentInput` (`null`) |
| `currency` | optional | `createFullParentInput` (`CurrencyCode.Usd`) | `createMinimalParentInput` (`null`) |
| `displayCurrency` | optional | `createFullParentInput` (`CurrencyCode.Eur`) **— NEW** | `createMinimalParentInput` (`null`) |
| `facebook` | optional | `createFullParentInput` | `createMinimalParentInput` (`null`) |
| `feeAmount` | optional | `createFullParentInput` (`"500.00"`) | `createMinimalParentInput` (`null`) |
| `initialPayinMethod` | optional | `createFullParentInput` (full `UserPaymentMethodInitialInput` object) | `createMinimalParentInput` (`null`) |
| `invoiceType` | optional | `createFullParentInput` (`InvoiceType.Monthly`) | `createMinimalParentInput` (`null`) |
| `nationality` | optional | `createFullParentInput` (`"US"`) | `createMinimalParentInput` (`null`) |
| `phone` | optional | `createFullParentInput` (non-null phone) | `createMinimalParentInput` (`null`) |
| `twitter` | optional | `createFullParentInput` (`"@testparent"`) | `createMinimalParentInput` (`null`) |
| `whatsapp` | optional | `createFullParentInput` (non-null phone) | `createMinimalParentInput` (`null`) |

## What Was Missing Before Changes

In `createFullParentInput`:
1. **`avatarUrl`** — was hardcoded to `null` (never tested with a non-null value). Now defaults to `"https://example.com/avatar.png"` and is overridable.
2. **`displayCurrency`** — was hardcoded to `null` at the end of the object (never tested with a non-null value). Now defaults to `CurrencyCode.Eur` and is overridable, positioned right after `phone`.
3. **`skype`** — was in the `overrides` type parameter but `skype` is **NOT** a field of `ParentOnboardingInput`. Removed.
4. **`avatarUrl`** and **`displayCurrency`** were not in the `overrides` type parameter for `createFullParentInput`. Added so they can be overridden in tests.

## Changes Made

1. **`createFullParentInput` overrides type:**
   - Added `avatarUrl: string | null`
   - Added `phone: string | null` (moved from bottom to group with other override-able fields)
   - Added `displayCurrency: CurrencyCode | null`
   - Removed `skype: string | null` (not a `ParentOnboardingInput` field)

2. **`createFullParentInput` body:**
   - `avatarUrl`: changed from `null` to `overrides?.avatarUrl ?? "https://example.com/avatar.png"`
   - `displayCurrency`: changed from `null` (at end) to `overrides?.displayCurrency ?? CurrencyCode.Eur` (moved after `phone`)

## Imports

No changes were needed. All `CurrencyCode`, `IanaTimezone`, `InvoiceType`, `PaymentDirection`, `PaymentMethodType` are used as **values** (e.g., `CurrencyCode.Eur`, `InvoiceType.Monthly`, `IanaTimezone.Utc`) and remained as value imports. `UserPaymentMethodInitialInput` remained as `type` import (only used as a type).

## Mutation Call Sites

All 5 mutation call sites pass the `input` variable with all `ParentOnboardingInput` fields:
- `Admin can create parent with billing` → uses `createFullParentInput` (all fields non-null)
- `Super Admin can create parent` → uses `createMinimalParentInput` (all optionals `null`)
- `Teacher denied creating parent` → uses `createMinimalParentInput`
- `Unauthenticated denied creating parent` → uses `createMinimalParentInput`

No mutation call was missing the `input` variable.

## Backend Bugs Found

None.

## Quality Loop Results

- **tsgo**: `bun tsgo` — 0 errors in `parent-onboarding.test.ts` (pre-existing errors in `impersonation.test.ts` and `usePhoneInput.ts` are in other files, unrelated to this task)
- **biome:check**: `bun biome:check frontend/common/graphql/test/parents/parent-onboarding.test.ts` — No fixes applied, clean
- **lint (queue client)**: `curl -s -X POST http://localhost:4777/lint ... task-12 ...` — `{"success":true,"output":"","exitCode":0}`
