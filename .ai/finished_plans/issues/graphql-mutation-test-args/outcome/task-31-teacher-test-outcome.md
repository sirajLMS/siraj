# Task 31 — Teacher Test Outcome

## Mutations Found
1. `updateTeacherProfileMutationDocument` — args: `input` (TeacherProfileUpdateInput, required), `teacherId` (ID, required)

## TeacherProfileUpdateInput Fields (all optional / InputMaybe)
- `address`: String
- `countryCode`: String
- `dateOfBirth`: String
- `gender`: Gender (enum)
- `hourlyRate`: String
- `nationalId`: String
- `nationality`: String
- `phone`: String
- `qualifications`: String
- `rateCurrency`: CurrencyCode (enum)
- `status`: AccountStatus (enum)
- `timezone`: IanaTimezone (enum)

## Changes Made

### Import addition
- Added `AccountStatus` to the import from `@/frontend/common/graphql/generated/gql/graphql-types` (previously only `CountryCode`, `CurrencyCode`, `Gender`, `IanaTimezone` were imported).

### `updateTeacherProfile — returns error for non-existent teacher`
- Added `nationality: CountryCode.Us` and `countryCode: CountryCode.Us` (previously missing).
- Changed `status: null` → `status: AccountStatus.Deactivated` to cover the `status` optional field with a meaningful enum value.

### `updateTeacherProfile — admin can update teacher profile`
- Was previously passing most fields as `null`. Now populates ALL 12 input object fields with meaningful non-null values:
  - `address: "123 Updated St"`, `dateOfBirth: "1990-01-01"`, `gender: Gender.Female`, `hourlyRate: "150"`, `nationalId: "12345678901234"`, `nationality: CountryCode.Eg`, `countryCode: CountryCode.Eg`, `phone: newTeacherPhoneString`, `qualifications: "PhD Updated"`, `rateCurrency: CurrencyCode.Egp`, `status: AccountStatus.Activated`, `timezone: IanaTimezone.AmericaNewYork`.

### `updateTeacherProfile — admin can edit any teacher (no IDOR for admins)`
- Added `nationality: CountryCode.Us` and `countryCode: CountryCode.Us` (previously missing).
- Changed `status: null` → `status: AccountStatus.Activated` to cover the `status` optional field.
- `phone` remains `null` (intentional — tests null handling for that field in this call site).

### `updateTeacherProfile — can update all fields at once`
- Changed `status: null` → `status: AccountStatus.Activated` so that this test now genuinely covers all fields with non-null values (it was named "all fields at once" but previously left `status` as null).

## Variables Coverage Summary
- `teacherId`: passed in all 4 call sites ✓
- `input`: passed in all 4 call sites ✓
- All 12 input object fields: populated with meaningful non-null values in the "admin can update teacher profile" and "update all fields at once" tests ✓
- Null coverage: many individual-field tests use `makeUpdateInput({ ... })` which defaults unset fields to `null`, providing null coverage for all optional fields ✓

## Backend Bugs Found
None.

## Quality Loop Results
- **tsgo**: 0 errors in `teacher.test.ts` (other files in the repo have pre-existing errors not caused by this change) ✓
- **biome:check**: Passed (auto-formatted the multi-line import) ✓
- **lint queue** (file-scoped): exitCode 0, 0 errors, 0 warnings ✓
