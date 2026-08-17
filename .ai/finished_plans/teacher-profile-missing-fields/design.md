# Design: Teacher Profile Missing Fields

## Overview

This design adds the missing `countryCode` field to the teacher profile edit UI, fixes the own-profile submit handler that silently drops `dateOfBirth`, `gender`, `address`, and `qualifications`, and fixes the `nationalId`→`nationality` validation dependency where `nationality` is not enforced as required when `nationalId` is set. The approach extends the existing shared `ProfilePersonalSection` component (which already renders `nationality` via `CountrySelect`) to also render `countryCode`, fixes the viewmodel's submit payloads to include all fields the form already collects, and tightens the Zod `superRefine` to require `nationality` when `nationalId` is present.

## Design Goals

1. **Zero new component files**: Reuse `CountrySelect`, `CountryDisplay`, and `ProfilePersonalSection` — extend them in place.
2. **End-to-end coverage**: `countryCode` must flow from form input → Zod validation → submit payload → GraphQL mutation → backend. Own-profile submit must forward all rendered fields.
3. **Permission parity**: `countryCode` is gated under the existing `teacher_identity` field group key, the same as `nationality`, `dateOfBirth`, `gender`, and `address`.
4. **Validation dependency enforcement**: `nationality` must be required when `nationalId` is set, so `isValidNationalIdForCountry` always has a valid country to validate against.

## Key Design Decisions

### Decision 1: Extend `ProfilePersonalSection` to support `countryCode`
**Context:** `ProfilePersonalSection` is the shared component rendering personal fields (nationality, address, DOB, gender, qualifications) in both edit and view modes. `countryCode` is semantically a personal identity field like `nationality`.

**Options Considered:**
1. Add `countryCode` to `ProfilePersonalSection` (extend `ProfilePersonalFormFields`, `ProfilePersonalFieldVisibility`, `ProfilePersonalFieldLabels`, and add edit/view render branches) — *Pros: consistent with `nationality` rendering, reuses permission/access logic, single place to maintain* / *Cons: touches a shared component used by parent profile too, but the field is opt-in via `fields` prop so parent is unaffected*.
2. Create a separate `CountryCodeField` component rendered directly in `TeacherExtensionProfileSection` — *Pros: minimal shared-component changes* / *Cons: bypasses existing permission/access framework, duplicates the `nationality` rendering pattern, inconsistent*.

**Decision:** Option 1 — extend `ProfilePersonalSection`.

**Rationale:** `ProfilePersonalSection` already handles `nationality` with the exact same `CountrySelect` + `CountryDisplay` pattern. Extending it with `countryCode` as another opt-in field (via `fields.countryCode: true`) keeps the permission gating, field access checks, and view/edit alignment centralized. Parent profile consumers simply don't set `fields.countryCode: true`, so they're unaffected.

### Decision 2: Gate `countryCode` under existing `teacher_identity` group key
**Context:** `countryCode` represents the teacher's country of residence — semantically part of identity, alongside `nationality` and `address`.

**Options Considered:**
1. Gate under `teacher_identity` (existing key) — *Pros: no new permission keys, no backend manifest changes, immediate parity with sibling personal fields* / *Cons: none*.
2. Create a new `ProfileFieldGroupKey` (e.g. `teacher_location`) — *Pros: finer-grained permissions* / *Cons: requires changes to `shared/constants/profile-field-groups.ts`, `backend/types/profile/profile-field-manifest.ts`, new `AppPermission` enum values, GraphQL permission resolver, seed data — massive scope for a single field*.

**Decision:** Option 1 — use `teacher_identity`.

**Rationale:** The existing `teacher_identity` group already gates `nationality`, `address`, `dateOfBirth`, `gender` — `countryCode` belongs in the same group. No permission system changes needed.

### Decision 3: `TeacherOwnSubmitData` expansion
**Context:** `TeacherOwnSubmitData` currently only includes `phone`, `nationalId`, `nationality`, `timezone` from the teacher block. The form renders `dateOfBirth`, `gender`, `address`, `qualifications` (and now `countryCode`), and the backend `TeacherOwnProfileUpdateInput` accepts all of them.

**Options Considered:**
1. Expand `TeacherOwnSubmitData` to include `dateOfBirth`, `gender`, `address`, `qualifications`, `countryCode` and forward them in `onSubmitOwn` — *Pros: complete, correct, matches form rendering* / *Cons: none — these fields already work in admin scope*.
2. Remove the fields from the own-edit form instead — *Pros: smaller payload* / *Cons: teachers can't edit their own DOB/gender/address/qualifications — user-hostile*.

**Decision:** Option 1 — expand and forward all fields.

**Rationale:** The fields are already rendered and accepted by the backend. Dropping them was a bug, not an intentional restriction.

### Decision 4: Require `nationality` when `nationalId` is set in the own-edit Zod schema
**Context:** The own-edit `superRefine` (`teacherProfileFormTypes.ts` lines 59-76) validates `nationalId` format against `isValidNationalIdForCountry(data.nationalId, data.nationality)`, but `nationality` is `z.string().optional()` — there's no enforcement that nationality must be present when nationalId is set. If a teacher enters a national ID without selecting a nationality, the format validation runs with `undefined` as the country, giving no actionable feedback.

**Options Considered:**
1. Add a `superRefine` check: when `nationalId` is non-empty, require `nationality` to be non-empty — add a validation issue on the `nationality` field path if missing — *Pros: actionable error message on the nationality field itself, prevents format validation with undefined country, minimal schema change* / *Cons: none — this is the pre-existing validation intent*.
2. Make `nationality` globally required (always) — *Pros: simplest* / *Cons: forces all teachers to have nationality even if they haven't entered a national ID yet — too strict for incomplete profiles in progress*.
3. Make `nationalId` optional — *Pros: removes the dependency* / *Cons: violates business requirement — national ID is mandatory for teachers per the `nationalIdCompletion` banner*.

**Decision:** Option 1 — conditional requirement via `superRefine`.

**Rationale:** `nationalId` is required (business rule — the profile completion banner forces it). `nationality` is the issuing country whose ID format is used for validation (confirmed by user). The `superRefine` already exists at line 69; we add a check BEFORE the `isValidNationalIdForCountry` call: if `nationality` is empty when `nationalId` is set, add a validation issue on the `nationality` field path with a "Nationality is required when National ID is set" message and `return` early (skip the format check since there's no country to validate against).

## Architecture

### Data Flow

```
Edit Form (React Hook Form)
  ↓ register/Controller for countryCode
ProfilePersonalSection (extended: fields.countryCode = true)
  ↓ CountrySelect → field.onChange(country?.code)
TeacherExtensionProfileSection (TEACHER_EXTENSION_FIELDS includes countryCode)
  ↓ form data
useTeacherProfileViewModel.onSubmitOwn / onSubmitAdmin
  ↓ mutation variables: { teacher: { ..., countryCode: value || null, dateOfBirth, gender, address, qualifications } }
updateOwnProfile / updateUserProfile mutation (GraphQL)
  ↓ TeacherOwnProfileUpdateInput / TeacherProfileUpdateInput (already accepts countryCode)
ProfileService / StaffProfileService
  ↓ TeacherRepository.updateTeacherProfile (already handles countryCode via Object.fromEntries)
teachers table (countryCode column already exists)
```

### Component Interaction

```
TeacherAdminEditForm / TeacherProfileOwnEditFormBody
  └─ TeacherExtensionProfileSection
       └─ ProfilePersonalSection
            ├─ nationality: CountrySelect (existing)
            ├─ countryCode: CountrySelect (NEW — added in this plan)
            ├─ address: TextField (existing)
            ├─ dateOfBirth: DateOfBirthControllerField (existing)
            ├─ gender: GenderSelector (existing)
            └─ qualifications: TextField (existing)
```

## UX/Navigation Specification

### New Routes & URLs
None — this plan modifies the existing teacher profile edit page at `/profile/edit` (own scope) and `/users/[userId]/profile` (admin scope). No new routes.

### Sidebar/Navigation Integration
No changes. The profile edit page is accessed via existing "Edit Profile" action buttons on the profile view page.

### Role-Based Access Matrix

| Route | Super Admin | Academy Admin | Supervisor | Teacher (own) | Parent | Student | Staff |
|---|---|---|---|---|---|---|---|
| `/profile/edit` (own) | — | — | — | ✅ full edit | — | — | — |
| `/users/[id]/profile` (admin) | ✅ full admin edit | ✅ full admin edit | ✅ limited (teacher_identity view+edit) | — | — | — | — |

### Per-Audience Rendering
- **Teacher (own scope):** All personal fields editable including `countryCode`. `hourlyRate`/`rateCurrency`/`status` hidden (admin-only).
- **Super Admin / Academy Admin (admin scope):** All fields visible and editable including `countryCode`, `hourlyRate`, `rateCurrency`, `status`, `nationalId`.
- **Supervisor (admin scope):** `countryCode` visible+editable under `teacher_identity` permission; fields outside their permission scope are disabled/hidden.

### Mobile vs Desktop Variants
No differences — `ProfilePersonalSection` and `CountrySelect` are viewport-agnostic. The tier-specific variants (`CountrySelectDesktop`/`CountrySelectMobile`) are resolved by the existing `CountrySelect` facade via the mobile/desktop view switcher pattern already in place for other fields.

### Permission Mapping
- `countryCode` view (own): `PROFILE_TEACHER_IDENTITY_VIEW_OWN` — always granted to the teacher themselves.
- `countryCode` view (other): `PROFILE_TEACHER_IDENTITY_VIEW_OTHER` — granted to super admin, academy admin, supervisor.
- `countryCode` edit (own): `PROFILE_TEACHER_IDENTITY_EDIT_OWN` — always granted to the teacher.
- `countryCode` edit (other): `PROFILE_TEACHER_IDENTITY_EDIT_OTHER` — granted to super admin, academy admin, supervisor.
- All resolved via `useProfileFieldAccess.canView("teacher_identity")` / `canEdit("teacher_identity")` — the same group key used for `nationality`, `address`, `dateOfBirth`, `gender`.

## Detailed Component Changes

### 1. i18n Type Schema & Locales

**File:** `shared/locale/types/profile/index.ts`
- Add `readonly countryCode: string;` to `ProfileTeacherLabels.fields` (after `avatar` or near `nationalId`).
- Add `readonly nationality: string;` to `ProfileTeacherLabels.fields` (fixes DEF-1 — currently `nationality` label is mis-mapped to `nationalId`).
- Add `readonly nationalityRequired: string;` to `ProfileTeacherLabels.validation` (new error message for Bug 3).

**File:** `shared/locale/en/profile/teacher/index.ts`
- Add `countryCode: "Country"` to `fields`.
- Add `nationality: "Nationality"` to `fields`.
- Add `nationalityRequired: "Nationality is required when National ID is set."` to `validation`.

**File:** `shared/locale/ar/profile/teacher/index.ts`
- Add `countryCode: "البلد"` to `fields`.
- Add `nationality: "الجنسية"` to `fields`.
- Add `nationalityRequired: "الجنسية مطلوبة عند إدخال رقم الهوية الوطنية."` to `validation`.

### 2. Shared Section Types

**File:** `frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types.ts`
- `ProfilePersonalFieldLabels`: add `readonly countryCode?: string;` (OPTIONAL — required would break `StaffExtensionProfileSection` and parent `IdentitySection` which also consume this type)
- `ProfilePersonalFieldVisibility`: add `readonly countryCode?: boolean;`

### 3. `ProfilePersonalSection` Component

**File:** `frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.tsx`
- `ProfilePersonalFormFields`: add `countryCode?: string;`
- `ProfilePersonalFieldGroupKeys`: add `readonly countryCode?: ProfileFieldGroupKey;`
- `PERSONAL_FIELD_KEYS`: add `"countryCode"` to the array
- Edit mode: add a `Controller` for `countryCode` using `CountrySelect` (same pattern as `nationality` — `getCountryByCode` for display, `country?.code ?? ""` on change), placed after `nationality` and before `address`.
- View mode: add a `ProfileFieldRow` for `countryCode` using `CountryDisplay` (same pattern as `nationality`).

### 4. `TeacherExtensionProfileSection` Component

**File:** `frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection.tsx`
- `TeacherExtensionFormFields`: add `countryCode?: string;`
- `TEACHER_EXTENSION_FIELDS`: add `countryCode: true`
- `TeacherExtensionProfileSectionViewProps`: add `readonly countryCode?: string | null;`
- Pass `countryCode={props.countryCode}` to `ProfilePersonalSection` in view mode

### 5. View Label Adapter

**File:** `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils.ts`
- `toTeacherPersonalFieldLabels`: include `countryCode` in the returned `ProfilePersonalFieldLabels` object, sourcing from `labels.teacher.fields.countryCode`.

### 6. `TeacherProfileOwnEditFormBody`

**File:** `frontend/common/views/dashboard/profile/teacher/TeacherProfileOwnEditFormBody.tsx`
- No structural changes needed — `TeacherExtensionProfileSection` already renders `ProfilePersonalSection` with the form's `register`/`control`. Once `TEACHER_EXTENSION_FIELDS` includes `countryCode` and `ProfilePersonalSection` renders it, the field appears automatically.

### 7. `TeacherAdminEditForm`

**File:** `frontend/common/views/dashboard/profile/teacher/TeacherAdminEditForm.tsx`
- `buildDefaultFormValues`: add `countryCode: data?.countryCode ?? ""` to the returned object.

### 8. `useTeacherProfileViewModel` — Submit Handlers

**File:** `frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel.ts`
- `TeacherOwnSubmitData`: add `countryCode: string | null`, `dateOfBirth: string | null`, `gender: Gender | null`, `address: string | null`, `qualifications: string | null`.
- `TeacherAdminSubmitData`: add `countryCode: string | null`.
- `onSubmitOwn`: expand the `teacher` block in the mutation variables to include: `dateOfBirth`, `gender`, `address`, `qualifications`, `countryCode` — all using `formData.xxx || null`.
- `onSubmitAdmin`: add `countryCode: formData.countryCode || null` to the `teacher` block.

### 9. `TeacherProfileEditBody`

**File:** `frontend/common/views/dashboard/profile/teacher/TeacherProfileEditBody.tsx`
- `toTeacherEditData` helper: add `countryCode: adminData?.countryCode ?? teacherData.countryCode ?? null` to the returned object (admin-fallback pattern matching other personal fields). This ensures saved `countryCode` populates the form on edit.
- **OWN submit adapter (lines 74-84):** The `onSubmit` callback for `TeacherProfileEditForm` constructs `TeacherOwnSubmitData` from RHF form values. Currently drops `dateOfBirth`, `gender`, `address`, `qualifications`, and `countryCode`. Add:
  - `countryCode: values.countryCode ?? ""`
  - `dateOfBirth: values.dateOfBirth ?? null`
  - `gender: values.gender ?? null`
  - `address: values.address ?? null`
  - `qualifications: values.qualifications ?? null`
- **ADMIN submit adapter (lines 96-113):** The `onSubmit` callback for `TeacherAdminEditForm` constructs `TeacherAdminSubmitData` from RHF form values. Currently drops `countryCode`. Add `countryCode: values.countryCode ?? ""`.

### 10. Section Predicates (View Mode Gating)

**File:** `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileSectionPredicates.ts`
- `hasTeacherPersonalData`: add `countryCode` to the truthiness check so the personal section renders in view mode when `countryCode` is set.

### 11. Zod Schema — `superRefine` nationality-required check

**File:** `frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes.ts`
- In the `teacherOwnEditSchemaFactory` `superRefine` (lines 59-76): add a check BEFORE the `isValidNationalIdForCountry` call. The updated `superRefine` logic:
  1. If `nationalId` is empty/missing → add `nationalIdRequired` issue on `["nationalId"]` path (existing behavior, no change).
  2. If `nationalId` is non-empty AND `nationality` is empty/missing → add `nationalityRequired` issue on `["nationality"]` path, then `return` early (skip format validation since there's no country to validate against).
  3. If `nationalId` is non-empty AND `nationality` is non-empty → validate via `isValidNationalIdForCountry` (existing behavior, no change).
- The `teacherOwnEditSchemaFactory(labels)` function signature must accept `labels.nationalityRequired` in addition to the existing `labels.nationalIdRequired` and `labels.nationalIdInvalid`. Verify that the caller passes the new label from the `validation` namespace.

### 12. Label Adapter — Fix `nationality` label mapping (DEF-1)

**File:** `frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils.ts`
- In `toTeacherPersonalFieldLabels`: change `nationality: t.fields.nationalId` to `nationality: t.fields.nationality` (now that `ProfileTeacherLabels.fields.nationality` exists after the i18n type schema update in section 1). This fixes the pre-existing bug where the nationality field was labeled "National ID".

## Error Handling

- **Form validation**: `countryCode` is optional in both own and admin scopes (matches `nationality` validation — `z.string().optional()`). No Zod schema changes needed for `countryCode` since `ownTeacherSchemaBase` already declares `countryCode: z.string().optional()`.
- **`nationality` required when `nationalId` is set**: The `superRefine` in `teacherOwnEditSchemaFactory` now checks that `nationality` is non-empty when `nationalId` is non-empty. If missing, a validation issue is added on the `["nationality"]` path with `nationalityRequired` message, and the format check is skipped. When `nationalId` is empty, `nationality` remains optional (no change).
- **Empty submission**: When `countryCode` is empty string, `onSubmitOwn`/`onSubmitAdmin` send `null` to clear the value — consistent with how `phone`, `nationalId`, `nationality`, etc. are handled (`formData.xxx || null`).
- **Permission denial**: If the user lacks `teacher_identity` view permission, `ProfilePersonalSection`'s `canViewField("countryCode")` returns `false` and the field is not rendered — consistent with other personal fields.

## Testing Strategy

- **Unit/component tests**: Verify `ProfilePersonalSection` renders `countryCode` when `fields.countryCode: true` and doesn't render it when `fields.countryCode` is falsy/absent.
- **Integration tests (GraphQL)**: Verify `updateOwnProfile` mutation accepts `countryCode` and `dateOfBirth`/`gender`/`address`/`qualifications`, and persists to the `teachers` table.
- **Manual E2E**: Edit own profile → set `countryCode` → save → verify persisted. Edit admin profile → set `countryCode` → save → verify persisted. Edit own profile → change `dateOfBirth`/`gender`/`address`/`qualifications` → save → verify persisted (bug 2 fix).

## Outcome & Knowledge Transfer Protocol

See `.ai/plans/teacher-profile-missing-fields/outcome/` for prior research and findings.
