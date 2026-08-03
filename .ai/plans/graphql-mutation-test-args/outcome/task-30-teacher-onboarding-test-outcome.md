# Task 30: Teacher Onboarding Test — Outcome

## File
`frontend/common/graphql/test/teachers/teacher-onboarding.test.ts`

## Mutations Found
1. `createTeacherMutationDocument` — mutation `createTeacher($input: TeacherOnboardingInput!)`

## Input Type: `TeacherOnboardingInput`
**Required** (no InputMaybe): `email` (Email), `name` (String), `password` (String), `timezone` (IanaTimezone)
**Optional** (InputMaybe): `address`, `avatarUrl`, `countryCode`, `dateOfBirth`, `displayCurrency`, `gender`, `hourlyRate`, `initialPayoutMethod`, `nationalId`, `nationality`, `phone`, `qualifications`, `rateCurrency`

## Analysis
All 17 fields of `TeacherOnboardingInput` are already covered across all call sites.

### How fields are covered
- A central helper `createMinimalTeacherInput()` (lines 21–57) returns ALL 17 fields:
  - 4 required fields with non-null values (`name`, `email`, `password`, `timezone`)
  - 13 optional fields with non-null values (e.g., `address`, `phone`, `gender`, `countryCode`, `hourlyRate`, `rateCurrency`, `nationality`, `nationalId`, `qualifications`, `dateOfBirth`, `initialPayoutMethod` with full nested `UserPaymentMethodInitialInput`)
  - 2 optional fields set to `null` (`avatarUrl`, `displayCurrency`)
- Nearly every call site spreads `createMinimalTeacherInput(...)` and overrides individual fields, ensuring ALL fields are always present.
- The "only required fields succeeds" test (lines 231–263) builds an inline `minimalInput` explicitly listing every optional field as `null` — providing null coverage.
- The "all fields populated succeeds" test (lines 375–401) populates every optional field with meaningful non-null values — providing non-null coverage.

### Call sites (all pass complete input):
1. `attemptCreateTeacherAs` helper (line 62–68) — `createMinimalTeacherInput()` ✓
2. "Admin can create teacher" (line 89) — `createMinimalTeacherInput({name, email})` ✓
3. "Super Admin can create teacher" (line 105) — `createMinimalTeacherInput({name, email})` ✓
4. "Teacher denied" (line 117 via helper) — `createMinimalTeacherInput()` ✓
5. "Parent denied" (line 123 via helper) — `createMinimalTeacherInput()` ✓
6. "Unauthenticated denied" (line 129) — `createMinimalTeacherInput()` ✓
7. "null phone succeeds" (line 144) — spread + phone override ✓
8. "max phone succeeds" (line 161) — spread + phone override ✓
9. "too long phone" (line 184) — spread + phone override ✓
10. "special characters phone" (line 210) — spread + phone override ✓
11. "only required fields succeeds" (line 231) — inline `minimalInput`, all fields explicitly null for optional ✓
12. "nationality set" (line 267) — spread + nationality override ✓
13. "nationalId set" (line 277) — spread + nationalId override ✓
14. "dateOfBirth set" (line 289) — spread + dateOfBirth override ✓
15. "female gender" (line 301) — spread + gender override ✓
16. "address set" (line 314) — spread + address override ✓
17. "qualifications set" (line 326) — spread + qualifications override ✓
18. "countryCode set" (line 338) — spread + countryCode override ✓
19. "hourlyRate and rateCurrency" (line 350) — spread + overrides ✓
20. "different timezone" (line 363) — spread + timezone override ✓
21. "all fields populated" (line 375) — spread + all optional overrides with non-null values ✓

## Changes Made
**No code changes were required.** The test file already satisfies the objective:
- Every mutation call passes ALL available input arguments (required AND optional) via `createMinimalTeacherInput()` or explicit inline construction.
- Required fields always have non-null values.
- Optional fields have both non-null values (in the helper) and `null` coverage (in the "only required fields" test).
- The `initialPayoutMethod` optional input includes full nested `UserPaymentMethodInitialInput` with `PaymentMethodDetailsInput`.

## Backend Bugs Found
None.

## Quality Loop Results
- **tsgo**: PASSED (0 errors in `teacher-onboarding.test.ts`) — other test files have errors but those are out of scope (assigned to other subagents).
- **biome:check**: PASSED (0 errors, 0 warnings) on the file.
- **lint (queue client)**: PASSED — `{"success":true,"output":"","exitCode":0}`.
