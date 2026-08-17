# Tasks: Teacher Profile Missing Fields

> **Implementation note:** Before executing any task, read ALL files in `.ai/plans/teacher-profile-missing-fields/outcome/`. After completing a task, write an outcome file at `.ai/plans/teacher-profile-missing-fields/outcome/<task-id>-outcome.md` and mark the checkbox `[x]`.

## Phase 1: i18n & Type Foundations

- [ ] 1. **Add `countryCode`, `nationality`, and `nationalityRequired` labels to i18n type schema and locale files**
  - Add `readonly countryCode: string;` to `ProfileTeacherLabels.fields` in `shared/locale/types/profile/index.ts` (within the existing `fields` object, after `avatar`)
  - Add `readonly nationality: string;` to `ProfileTeacherLabels.fields` (fixes DEF-1 — `nationality` label is currently mis-mapped to `nationalId`)
  - Add `readonly nationalityRequired: string;` to `ProfileTeacherLabels.validation` (new error message for Bug 3 — nationality required when nationalId is set)
  - Add to `shared/locale/en/profile/teacher/index.ts`:
    - `fields.countryCode: "Country"`
    - `fields.nationality: "Nationality"`
    - `validation.nationalityRequired: "Nationality is required when National ID is set."`
  - Add to `shared/locale/ar/profile/teacher/index.ts`:
    - `fields.countryCode: "البلد"`
    - `fields.nationality: "الجنسية"`
    - `validation.nationalityRequired: "الجنسية مطلوبة عند إدخال رقم الهوية الوطنية."`
  - _Requirements: AC-8, AC-12, AC-13_
  - _AGENTS.md: `shared/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per file

- [ ] 2. **Extend shared personal section types with `countryCode` (optional to avoid breaking staff/parent consumers)**
  - Add `readonly countryCode?: string;` (OPTIONAL, not required) to `ProfilePersonalFieldLabels` in `frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types.ts` — making it required would break `StaffExtensionProfileSection` and parent `IdentitySection` which also consume this type but don't have a `countryCode` label
  - Add `readonly countryCode?: boolean;` to `ProfilePersonalFieldVisibility` in the same file
  - _Requirements: AC-1, AC-9_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

## Phase 2: Shared Component Extension

- [ ] 3. **Extend `ProfilePersonalSection` to render `countryCode` in edit & view modes**
  - File: `frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.tsx`
  - Add `countryCode?: string;` to `ProfilePersonalFormFields` type (line 27-33)
  - Add `readonly countryCode?: ProfileFieldGroupKey;` to `ProfilePersonalFieldGroupKeys` type (line 35-41)
  - Add `"countryCode"` to `PERSONAL_FIELD_KEYS` array (line 76-82)
  - Add `readonly countryCode?: string | null;` to `ProfilePersonalViewProps` (line 54-61)
  - In `ProfilePersonalSectionEdit` (line 143-232): add a `Controller` for `countryCode` using `CountrySelect` — place it AFTER the `nationality` block (after line 177) and BEFORE the `address` block. Follow the exact same pattern as `nationality`: `getCountryByCode(field.value)` for display, `country?.code ?? ""` on change, `canViewField("countryCode")` / `canEditField("countryCode")` for gating. For the label, use `labels.countryCode ?? ""` as a fallback since `countryCode` is optional on `ProfilePersonalFieldLabels` (staff/parent consumers don't provide it).
  - In `ProfilePersonalSectionView` (line 234-287): add a `ProfileFieldRow` for `countryCode` using `CountryDisplay` — place after `nationality` view row (after line 263). Use `CountryDisplay code={props.countryCode} fallback={baseLabels.notSet}`. For the label, use `labels.countryCode` only when truthy — guard with `canViewField("countryCode")` which already checks `isFieldEnabled` (returns false when `fields.countryCode` is not `true`), so staff/parent consumers that don't opt in will never reach the label access.
  - _Requirements: AC-1, AC-2, AC-9_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 4. **Enable `countryCode` in `TeacherExtensionProfileSection`**
  - File: `frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection.tsx`
  - Add `countryCode?: string;` to `TeacherExtensionFormFields` type (line 16-22)
  - Add `countryCode: true` to `TEACHER_EXTENSION_FIELDS` constant (line 24-30)
  - Add `readonly countryCode?: string | null;` to `TeacherExtensionProfileSectionViewProps` (line 37-47)
  - In the view-mode render branch (line 88-104): pass `countryCode={props.countryCode}` to `ProfilePersonalSection`
  - _Requirements: AC-1, AC-9_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 5. **Update `toTeacherPersonalFieldLabels` to include `countryCode` label and fix `nationality` label mapping (DEF-1)**
  - File: `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils.ts`
  - In `toTeacherPersonalFieldLabels` function: add `countryCode: labels.teacher.fields.countryCode` to the returned `ProfilePersonalFieldLabels` object
  - FIX DEF-1: change `nationality: t.fields.nationalId` to `nationality: t.fields.nationality` (now that `ProfileTeacherLabels.fields.nationality` exists after Task 1). This fixes the pre-existing bug where the nationality field was labeled "National ID".
  - _Requirements: AC-8, AC-13_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

## Phase 3: Form Data & Submit Payload Fixes

- [ ] 6. **Add `countryCode` to `buildDefaultFormValues` in `TeacherAdminEditForm`**
  - File: `frontend/common/views/dashboard/profile/teacher/TeacherAdminEditForm.tsx`
  - In `buildDefaultFormValues` (line 40-58): add `countryCode: data?.countryCode ?? ""` to the returned object
  - _Requirements: AC-1_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 7. **Expand `TeacherOwnSubmitData` and fix `onSubmitOwn` to forward all fields**
  - File: `frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel.ts`
  - Expand `TeacherOwnSubmitData` type (lines 42-51) to include:
    - `countryCode: string | null`
    - `dateOfBirth: string | null`
    - `gender: Gender | null`
    - `address: string | null`
    - `qualifications: string | null`
  - Expand the `teacher` block in `onSubmitOwn` mutation variables (lines 141-147) to include:
    - `dateOfBirth: formData.dateOfBirth || null`
    - `gender: formData.gender`
    - `address: formData.address || null`
    - `qualifications: formData.qualifications || null`
    - `countryCode: formData.countryCode || null`
  - _Requirements: AC-3, AC-5, AC-6_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 8. **Add `countryCode` to `TeacherAdminSubmitData` and `onSubmitAdmin`**
  - File: `frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel.ts`
  - Add `countryCode: string | null` to `TeacherAdminSubmitData` type (lines 53-69)
  - Add `countryCode: formData.countryCode || null` to the `teacher` block in `onSubmitAdmin` (lines 179-191)
  - _Requirements: AC-4, AC-7_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 8b. **Fix Zod `superRefine` to require `nationality` when `nationalId` is set**
  - File: `frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes.ts`
  - In the `teacherOwnEditSchemaFactory` `superRefine` (lines 59-76), update the logic to:
    1. If `nationalId` is empty/missing → add `nationalIdRequired` issue on `["nationalId"]` path (existing behavior, no change)
    2. NEW: If `nationalId` is non-empty AND `nationality` is empty/missing → add `nationalityRequired` issue on `["nationality"]` path, then `return` early (skip `isValidNationalIdForCountry` since there's no country to validate against)
    3. If `nationalId` is non-empty AND `nationality` is non-empty → validate via `isValidNationalIdForCountry` (existing behavior, no change)
  - The `teacherOwnEditSchemaFactory(labels)` function must accept `labels.nationalityRequired` in addition to the existing `labels.nationalIdRequired` and `labels.nationalIdInvalid`. Verify the caller (likely in `useTeacherProfileViewModel.ts` or `TeacherProfileOwnEditFormBody.tsx`) passes the new label from `labels.teacher.validation.nationalityRequired`.
  - _Requirements: AC-11, AC-12_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

## Phase 4: View Mode & Container Integration

- [ ] 9. **Pass `countryCode` through `TeacherProfileShared` view mode**
  - File: `frontend/common/views/dashboard/profile/teacher/sections/__shared__/teacherProfileShared.tsx`
  - In `renderTeacherProfileViewSections` (lines 150-166): add `countryCode={adminData?.countryCode ?? teacherData.countryCode}` to the `<TeacherExtensionProfileSection mode="view">` render call — follows the same admin-fallback pattern as `address`, `dateOfBirth`, `gender`, `qualifications` already used there.
  - NOTE: `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes.ts` requires NO changes — `TeacherViewData` and `TeacherAdminData` are codegen-derived (`NonNullable<ProfileData["teacherOwnProfile"]>` / `NonNullable<ProfileData["teacherAdminProfile"]>`) and already include `countryCode` since the GraphQL documents select it.
  - _Requirements: AC-9_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 10. **Update view-mode section predicates to include `countryCode`**
  - File: `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileSectionPredicates.ts`
  - In `hasTeacherPersonalData` (or equivalent predicate that checks personal identity fields): add `Boolean(data.countryCode)` to the condition so the personal section renders when `countryCode` is the only personal field set.
  - _Requirements: AC-9_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 11. **Fix `TeacherProfileEditBody.tsx` — `toTeacherEditData` mapping AND submit adapters**
  - File: `frontend/common/views/dashboard/profile/teacher/TeacherProfileEditBody.tsx`
  - **11a — `toTeacherEditData` (lines 17-42):** Add `countryCode: adminData?.countryCode ?? teacherData.countryCode ?? null` to the returned object — follows the same admin-fallback pattern as `nationality`, `dateOfBirth`, `gender`, `address`, `qualifications`. This populates the form's default values so saved `countryCode` is displayed on edit.
  - **11b — Own-profile submit adapter (lines 74-84):** The `onSubmit` callback for `TeacherProfileEditForm` constructs `TeacherOwnSubmitData` from RHF form values. Currently it drops `dateOfBirth`, `gender`, `address`, `qualifications`, and `countryCode`. Add these fields to the adapter object:
    - `countryCode: values.countryCode ?? ""`
    - `dateOfBirth: values.dateOfBirth ?? null`
    - `gender: values.gender ?? null`
    - `address: values.address ?? null`
    - `qualifications: values.qualifications ?? null`
  - **11c — Admin submit adapter (lines 96-113):** The `onSubmit` callback for `TeacherAdminEditForm` constructs `TeacherAdminSubmitData` from RHF form values. Currently it drops `countryCode`. Add:
    - `countryCode: values.countryCode ?? ""`
  - _Requirements: AC-1, AC-3, AC-4, AC-5_
  - _AGENTS.md: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`_
  - _Instructions: `frontend.instructions.md`_
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

## Phase 5: Verification

- [ ] 12. **Run GraphQL codegen and type check**
  - Run `bun run generate:gqlSchema` then `bun codegen` to regenerate GraphQL types (the query documents already select `countryCode`, but verify no type drift)
  - Run `bun tsgo` to verify all type changes compile
  - Fix any type errors in the modified files
  - _Requirements: AC-1 through AC-9_

- [ ] 13. **Run full quality gate on all modified files**
  - Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` for every file touched in tasks 1-11
  - Fix all reported issues (tsgo → oxlint → biome → lint → duplicates → codescene)
  - _Requirements: All_

## Phase 6: Knowledge Propagation (skip if no new patterns)

- [ ] 14. **Knowledge Propagation & Documentation**
  - Read all outcome files in `.ai/plans/teacher-profile-missing-fields/outcome/` to synthesize learnings
  - If the implementation revealed new patterns (e.g., extending `ProfilePersonalSection` for new fields), create a canonical reference doc under `docs/frontend/profile-personal-section-extension.md` with the pattern, rules, and gotchas
  - Update `frontend/views/AGENTS.md` with a one-line rule reference if a new pattern emerged (no implementation details)
  - Update root `AGENTS.md` Important References section with a one-line reference to the new doc only if a doc was created
  - Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file
  - Write outcome file: `.ai/plans/teacher-profile-missing-fields/outcome/14-knowledge-propagation-outcome.md`
  - Update progress: Mark task 14 as `[x]` in `tasks.md`
