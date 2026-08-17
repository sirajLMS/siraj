# Requirements: Teacher Profile Missing Fields

## Problem Statement

The `teachers` table schema includes a `countryCode` column, and the teacher profile edit form already renders `nationality`, `dateOfBirth`, `gender`, `address`, and `qualifications` fields. However, three bugs exist:

1. **`countryCode` field is missing from the edit UI** — No form section renders an editable input for `countryCode`, despite it being declared in the Zod schema (`teacherProfileFormTypes.ts`), the `TeacherEditData` type, and accepted by the GraphQL `TeacherOwnProfileUpdateInput` and `TeacherProfileUpdateInput` input types.

2. **Own-profile submit drops `dateOfBirth`, `gender`, `address`, `qualifications`** — When a teacher edits their own profile, `TeacherOwnSubmitData` and `onSubmitOwn` in `useTeacherProfileViewModel.ts` omit these fields entirely. The form collects them (via `TeacherExtensionProfileSection`) and the backend `TeacherOwnProfileUpdateInput` accepts them, but the mutation payload never includes them — changes are silently discarded.

3. **`nationalId` is required but `nationality` (its validation dependency) is optional and not enforced** — The own-edit Zod schema (`teacherProfileFormTypes.ts` line 57) requires `nationalId` to be non-empty via `.refine()`, and the `superRefine` (line 69) validates `nationalId` format against `isValidNationalIdForCountry(data.nationalId, data.nationality)`. But `nationality` is declared as `z.string().optional()` (line 22) — there is no validation enforcing that `nationality` must be set when `nationalId` is provided. If a teacher enters a national ID without selecting a nationality, `isValidNationalIdForCountry` runs with `undefined` as the country, and the format check either silently passes (no country-specific rules) or returns false (generic rejection) — either way the user gets no actionable feedback that they need to select a nationality first. The `nationalIdInvalid` message says "for the selected nationality" but there's no "Nationality is required when National ID is set" error.

## Scope

- **In scope:** Teacher profile edit page (own scope + admin scope), specialized section components (`TeacherExtensionProfileSection`, `ProfilePersonalSection`, `CoreContactSection`), form types, viewmodel submit handlers, i18n labels for `countryCode`.
- **Out of scope:** Backend schema/column changes (`countryCode` already exists on the table), GraphQL input type changes (`countryCode` already accepted), permission group key additions (reuse existing `teacher_identity` group), teacher onboarding form, parent/staff profiles.

## User Stories

**US-1:** As a teacher editing my own profile, I want to set my country code (country of residence), so that my location is accurately recorded alongside my nationality.

**US-2:** As a teacher editing my own profile, I want changes to my date of birth, gender, address, and qualifications to be saved, so that my profile stays up-to-date.

**US-3:** As an admin editing a teacher's profile, I want to set the teacher's country code, so that I can maintain accurate demographic records for faculty.

**US-4:** As a teacher editing my own profile, I want to be told that I must select a nationality before entering my national ID, so that my national ID format can be properly validated.

## Acceptance Criteria (EARS Format)

### AC-1: `countryCode` field rendered in edit forms
1. WHEN a teacher opens their own profile edit page THEN the system SHALL render a `CountrySelect` input for `countryCode` within the identity/personal section.
2. WHEN an admin opens a teacher's profile edit page THEN the system SHALL render a `CountrySelect` input for `countryCode` within the identity/personal section.
3. WHEN the `countryCode` field is rendered THEN the system SHALL use the existing `CountrySelect` component from `@/frontend/common/components/ui/input/countrySelect/CountrySelect` with the established `getCountryByCode` / `country?.code` conversion idiom.
4. WHEN the `countryCode` field has a saved value THEN the system SHALL display the saved country (flag emoji + localized name) pre-selected in the `CountrySelect`.
5. WHEN the `countryCode` field has no saved value THEN the system SHALL render an empty `CountrySelect` with a placeholder.

### AC-2: `countryCode` field gated by `teacher_identity` permission
6. WHEN a user lacks `PROFILE_TEACHER_IDENTITY_VIEW_OTHER` permission THEN the system SHALL NOT render the `countryCode` field (own-scope: always visible to the teacher themselves).
7. WHEN a user lacks `PROFILE_TEACHER_IDENTITY_EDIT_OTHER` permission THEN the system SHALL render the `countryCode` field as disabled (admin scope).

### AC-3: `countryCode` sent in own-profile mutation payload
8. WHEN a teacher submits their own-profile edit form with a `countryCode` value THEN the `onSubmitOwn` handler SHALL include `countryCode` in the `teacher` block of the `updateOwnProfile` mutation input.
9. WHEN a teacher submits their own-profile edit form with an empty `countryCode` THEN the `onSubmitOwn` handler SHALL send `countryCode: null` to clear the value.

### AC-4: `countryCode` sent in admin-profile mutation payload
10. WHEN an admin submits the admin-profile edit form with a `countryCode` value THEN the `onSubmitAdmin` handler SHALL include `countryCode` in the `teacher` block of the `updateUserProfile` mutation input.
11. WHEN an admin submits the admin-profile edit form with an empty `countryCode` THEN the `onSubmitAdmin` handler SHALL send `countryCode: null`.

### AC-5: Own-profile submit includes all rendered fields
12. WHEN a teacher submits their own-profile edit form THEN the `onSubmitOwn` handler SHALL include `dateOfBirth`, `gender`, `address`, and `qualifications` in the `teacher` block of the `updateOwnProfile` mutation input (all currently-rendered fields that were previously dropped).
13. WHEN a teacher clears `dateOfBirth`, `gender`, `address`, or `qualifications` THEN the `onSubmitOwn` handler SHALL send `null` for the cleared field(s).

### AC-6: `countryCode` included in `TeacherOwnSubmitData`
14. WHEN `TeacherOwnSubmitData` is constructed THEN it SHALL include `countryCode: string | null` alongside the existing fields.

### AC-7: `countryCode` included in `TeacherAdminSubmitData`
15. WHEN `TeacherAdminSubmitData` is constructed THEN it SHALL include `countryCode: string | null`.

### AC-8: i18n labels for `countryCode`
16. WHEN the `countryCode` field is rendered THEN the system SHALL display a translated label from the `Translation.Profile.Teacher` namespace `fields` object.
17. WHEN the Arabic locale is active THEN the system SHALL display the Arabic translation for the `countryCode` field label.

### AC-9: `countryCode` displayed in view mode
18. WHEN the teacher profile is displayed in view mode AND `countryCode` has a value THEN the system SHALL render the country via the existing `CountryDisplay` component (flag emoji + localized name).
19. WHEN the teacher profile is displayed in view mode AND `countryCode` is null/empty THEN the system SHALL render the `notSet` fallback.

### AC-10: Knowledge base & progress tracking
20. WHEN any task is executed THEN the executing agent SHALL read all existing files in `.ai/plans/teacher-profile-missing-fields/outcome/` before starting.
21. WHEN any task is completed THEN the executing agent SHALL create an outcome document at `.ai/plans/teacher-profile-missing-fields/outcome/<task-id>-outcome.md`.
22. WHEN any task is completed THEN the executing agent SHALL update the task checkbox `[ ]` -> `[x]` in `tasks.md`.

### AC-11: `nationality` required when `nationalId` is set (own-edit form)
23. WHEN a teacher enters a `nationalId` without selecting a `nationality` THEN the Zod schema `superRefine` SHALL add a validation issue on the `nationality` field with a "Nationality is required when National ID is set" message.
24. WHEN a teacher has both `nationalId` and `nationality` set THEN the system SHALL validate `nationalId` format against `nationality` via `isValidNationalIdForCountry` (existing behavior, no change).
25. WHEN a teacher clears `nationalId` THEN the system SHALL NOT require `nationality` (nationality remains optional when nationalId is empty).

### AC-12: i18n labels for nationality validation
26. WHEN the `nationality` required validation fires THEN the system SHALL display a translated error message from the `Translation.Profile.Teacher` namespace `validation` object.
27. WHEN the Arabic locale is active THEN the system SHALL display the Arabic translation for the nationality required validation message.

### AC-13: `nationality` field label added to i18n (fixes pre-existing DEF-1)
28. WHEN the `nationality` field is rendered in the edit form THEN the system SHALL display a translated label "Nationality" from the `Translation.Profile.Teacher` namespace `fields` object (currently `nationality` label is mis-mapped to `nationalId` — "National ID" — in `toTeacherPersonalFieldLabels`).
29. WHEN the Arabic locale is active THEN the system SHALL display "الجنسية" for the nationality field label.

## Constraints

- **No backend schema changes**: The `teachers.countryCode` column already exists. No migrations or `db push` needed.
- **No GraphQL input type changes**: `TeacherOwnProfileUpdateInput` and `TeacherProfileUpdateInput` already accept `countryCode`.
- **Reuse existing component palette**: The `countryCode` field MUST use the existing `CountrySelect` component (not a raw `TextField` or `Select`), following the established conversion idiom (`getCountryByCode` for display, `country?.code ?? ""` on change).
- **Reuse existing permission group**: `countryCode` is gated under the existing `teacher_identity` field group key — no new `ProfileFieldGroupKey` needs to be added.
- **No new files**: Extend existing section components and types rather than creating new ones.

## Dependencies

- `ProfilePersonalSection` must be extended to support an optional `countryCode` field slot in both edit and view modes.
- `TEACHER_EXTENSION_FIELDS` in `TeacherExtensionProfileSection` must include `countryCode: true`.
- `ProfilePersonalFieldVisibility`, `ProfilePersonalFieldLabels`, and `ProfilePersonalFormFields` types must be extended with `countryCode`.
- `TeacherOwnSubmitData` and `TeacherAdminSubmitData` in `useTeacherProfileViewModel.ts` must include `countryCode`.
- i18n type schema (`ProfileTeacherLabels.fields`) must include `countryCode`, and EN/AR locale files must provide translations.
