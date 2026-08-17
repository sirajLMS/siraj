# Pre-Implementation Baseline: Teacher Profile Missing Fields

## Date: 2026-08-16

## Research Summary (Pre-Implementation)

This document captures the complete research findings that informed the plan. All research is read-only; no files were modified.

### Bug 1: `countryCode` field missing from edit UI

**Schema:** `backend/db/schema/teachers/teachers.ts` line 26 — `countryCode: countryCodeEnum("country_code")` — a nullable country code enum column.

**Zod schema:** `frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes.ts` line 25 — `countryCode: z.string().optional()` — declared in `ownTeacherSchemaBase`, inherited by `teacherAdminEditSchema`.

**Form data type:** `teacherProfileFormTypes.ts` line 108 — `countryCode?: string | null` — present in `TeacherEditData`.

**GraphQL inputs ( BOTH already accept `countryCode`):**
- `backend/graphql/pothos/profile/profile.pothos.ts` line 136 — `TeacherOwnProfileUpdateInput` has `countryCode: t.string({ required: false })`
- `backend/graphql/pothos/teachers/staff-profile.pothos.ts` line 70 — `TeacherProfileUpdateInput` has `countryCode: t.string({ required: false, directives: { constraint: { maxLength: 255 } } })`

**GraphQL query documents already select `countryCode`:**
- `frontend/common/graphql/sharedDocuments/profile/profile.documents.ts` lines 32, 57, 232, 299 — `teacherOwnProfile` and `teacherAdminProfile` selections include `countryCode`
- `frontend/common/graphql/sharedDocuments/teachers/staff-profile.documents.ts` line 44 — `updateTeacherProfile` response includes `countryCode`

**UI rendering gap:**
- `ProfilePersonalSection` (`frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.tsx`) renders `nationality`, `address`, `dateOfBirth`, `gender`, `qualifications` — **does NOT render `countryCode`**. The `ProfilePersonalFormFields`, `ProfilePersonalFieldVisibility`, `ProfilePersonalFieldLabels`, and `ProfilePersonalFieldGroupKeys` types have no `countryCode` key.
- `TeacherExtensionProfileSection` (`frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection.tsx`) — `TEACHER_EXTENSION_FIELDS` constant (line 24-30) lists `nationality, address, dateOfBirth, gender, qualifications` — **`countryCode` absent**.
- `AdminOnlySection` — only renders `nationalId` and `status`.
- `CoreContactSection` — only renders `phone` and `timezone`.
- `AccountSection` — only renders `name`, `email`, `avatarUrl`, `displayCurrency`.

**Submit payload gap:**
- `TeacherOwnSubmitData` (`useTeacherProfileViewModel.ts` lines 42-51) — no `countryCode`. The `onSubmitOwn` handler (lines 141-147) does not send `countryCode`.
- `TeacherAdminSubmitData` (`useTeacherProfileViewModel.ts` lines 53-69) — no `countryCode`. The `onSubmitAdmin` handler (lines 179-191) does not send `countryCode`.

### Bug 2: Own-profile submit drops `dateOfBirth`, `gender`, `address`, `qualifications`

**Form rendering:** `TeacherProfileOwnEditFormBody` renders `TeacherExtensionProfileSection` which uses `ProfilePersonalSection` to render `address`, `dateOfBirth`, `gender`, `qualifications` in edit mode. These fields are visible and editable in the form.

**Submit payload gap:**
- `TeacherOwnSubmitData` (lines 42-51) includes only: `name, email, phone, nationalId, nationality, avatarUrl, displayCurrency, timezone`
- `onSubmitOwn` teacher block (lines 141-147) sends only: `phone, nationalId, nationality, timezone`
- **Missing from payload:** `dateOfBirth`, `gender`, `address`, `qualifications`

**Backend acceptance:** `TeacherOwnProfileUpdateInput` (`backend/graphql/pothos/profile/profile.pothos.ts` lines 130-144) accepts all of: `phone, nationality, countryCode, nationalId, dateOfBirth, gender, address, qualifications, timezone`. `TeacherOwnProfileUpdateInput` type (`backend/types/teachers/teacher.types.ts` lines 177-193) includes all these fields.

**Contrast with admin path:** `TeacherAdminSubmitData` (lines 53-69) and `onSubmitAdmin` (lines 179-191) correctly include all fields: `dateOfBirth, gender, address, qualifications, hourlyRate, rateCurrency, status` (but still missing `countryCode`).

### Component Palette Research

**Existing `CountrySelect` component:**
- Primary: `frontend/common/components/ui/input/countrySelect/CountrySelect.tsx` — viewport-agnostic facade
- Engine: `frontend/common/components/ui/input/countrySelect/CountryAutocompleteShared.tsx` — MUI Autocomplete + TextField with flag emoji
- Tier variants: `CountrySelectDesktop` / `CountrySelectMobile` exist
- Display component: `frontend/common/components/ui/display/countryDisplay/CountryDisplay.tsx` — read-only flag + localized name
- Lookup helpers: `frontend/common/lib/locale/country/lookup.ts` — `getCountryByCode(code: string)`

**Established conversion idiom (used in onboarding `OfficialDetailsSection`, `UserPersonalNationalityField`, and `ProfilePersonalSection` for `nationality`):**
```tsx
const selectedCountry = field.value ? getCountryByCode(field.value) : undefined;
<CountrySelect
  country={selectedCountry}
  setCountryAction={country => field.onChange(country?.code ?? "")}
  label={labels.countryCode}
  error={Boolean(fieldState.error)}
  helperText={fieldState.error?.message}
  onBlurAction={field.onBlur}
  fullWidth
  disabled={!canEditField("countryCode")}
/>
```

**View mode pattern (from `nationality` in `ProfilePersonalSectionView`):**
```tsx
{canViewField("nationality") ? (
  <ProfileFieldRow
    icon={PersonOutlined}
    label={labels.nationality}
    value={props.nationality ? <CountryDisplay code={props.nationality} fallback={baseLabels.notSet} /> : baseLabels.notSet}
  />
) : null}
```

### Permission System Research

**Existing field group keys (no new key needed):**
- `shared/constants/profile-field-groups.ts` — `PROFILE_FIELD_GROUP_KEYS` includes `"teacher_identity"` and `"teacher_professional"`
- `backend/types/profile/profile-field-manifest.ts` — `teacher_identity` group paths include `nationalId`, `dateOfBirth`, `gender`, `address`, `status`
- `useProfileFieldAccess` hook resolves `ProfileFieldGroupKey` + action → `AppPermission` enum name → `hasPermission` check
- `ProfilePersonalSection.resolveFieldGroupKey` logic: per-field override in `fieldGroupKeys` → `qualificationsFieldGroupKey` for qualifications → fall back to `fieldGroupKey`
- `TeacherExtensionProfileSection` passes `fieldGroupKey="teacher_identity"`, `qualificationsFieldGroupKey="teacher_professional"` — so `countryCode` will resolve to `teacher_identity` by default

### i18n Research

**Current state:** `ProfileTeacherLabels.fields` (in `shared/locale/types/profile/index.ts` lines 73-89) does NOT include `countryCode` or `nationality`. It has `nationalId` but not `nationality`. The EN locale (`shared/locale/en/profile/teacher/index.ts`) and AR locale (`shared/locale/ar/profile/teacher/index.ts`) have no `countryCode` or `nationality` key.

**Added in this plan:**
- `countryCode: "Country"` / `countryCode: "البلد"` to EN/AR locale files
- `nationality: "Nationality"` / `nationality: "الجنسية"` to EN/AR locale files (fixes DEF-1)
- `nationalityRequired: "Nationality is required when National ID is set."` / `"الجنسية مطلوبة عند إدخال رقم الهوية الوطنية."` to EN/AR `validation` object (Bug 3)
- `readonly countryCode: string;`, `readonly nationality: string;` to `ProfileTeacherLabels.fields` type
- `readonly nationalityRequired: string;` to `ProfileTeacherLabels.validation` type

### Bug 3: `nationalId` required but `nationality` (validation dependency) not enforced

**Zod schema:** `frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes.ts`
- Line 57: `nationalId` is required — `.refine(value => value?.trim() !== "", { message: labels.nationalIdRequired })`
- Line 22: `nationality` is optional — `z.string().optional()`
- Line 69: `superRefine` validates `isValidNationalIdForCountry(data.nationalId, data.nationality)` — runs with `undefined` if nationality not selected
- No validation enforces that `nationality` must be set when `nationalId` is provided

**Backend (confirmed consistent):** `backend/services/teacher/teacher-portal.service.ts` line 160 — `effectiveNationality = input.nationality ?? teacher.nationality` — falls back to existing teacher nationality. But frontend doesn't enforce this, so a teacher with no nationality saved can submit a national ID with `undefined` nationality.

**Validation message:** `nationalIdInvalid` says "National ID is invalid for the selected nationality." — but there's no "Nationality is required when National ID is set" message.

### Baseline Counts

No implementation has started. The following counts are pre-existing:

```
tsgo errors: unknown (not run — read-only mode)
biome warnings: unknown (not run — read-only mode)
lint errors: unknown (not run — read-only mode)
```

### Files Identified for Modification

1. `shared/locale/types/profile/index.ts` — add `countryCode`, `nationality`, `nationalityRequired` to type
2. `shared/locale/en/profile/teacher/index.ts` — add EN labels
3. `shared/locale/ar/profile/teacher/index.ts` — add AR labels
4. `frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types.ts` — extend types
5. `frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.tsx` — add render branches
6. `frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection.tsx` — enable field
7. `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils.ts` — add label adapter + fix nationality mapping
8. `frontend/common/views/dashboard/profile/teacher/TeacherAdminEditForm.tsx` — default form value
9. `frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel.ts` — submit payload fix
10. `frontend/common/views/dashboard/profile/teacher/TeacherProfileEditBody.tsx` — `toTeacherEditData` + submit adapters
11. `frontend/common/views/dashboard/profile/teacher/sections/__shared__/teacherProfileShared.tsx` — pass `countryCode` in view mode
12. `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes.ts` — NO changes (codegen-derived)
13. `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileSectionPredicates.ts` — view predicate
14. `frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes.ts` — Zod `superRefine` nationality-required check (Bug 3)

### Key Met/Not-Met Conditions

- **No backend changes needed:** The `teachers.countryCode` column exists, GraphQL inputs accept `countryCode`, repository `updateTeacherProfile` handles `countryCode` via `Object.fromEntries` pass-through, `TeacherOwnProfileUpdateInput` type accepts `countryCode`.
- **No new files needed:** All changes are extensions to existing files.
- **No new permission keys:** `teacher_identity` already exists and gates `nationality`/`address`/`dateOfBirth`/`gender`.
- **Zod schema changes needed (Bug 3):** `ownTeacherSchemaBase` already declares `countryCode: z.string().optional()` and `teacherAdminEditSchema` inherits it — no change for `countryCode`. But the `superRefine` in `teacherOwnEditSchemaFactory` needs a new check requiring `nationality` when `nationalId` is set.
- **i18n type changes needed:** `ProfileTeacherLabels.fields` needs `countryCode` and `nationality` keys; `ProfileTeacherLabels.validation` needs `nationalityRequired` key.
