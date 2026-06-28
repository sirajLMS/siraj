# /classes/new - Fake Data & Stub Actions Report

## Page Structure

```
app/[locale]/(dashboard)/classes/new/page.tsx
  └── CreateRecurringClassContainer (client)
        ├── userStore - permissions check
        ├── createRecurringClassStore - state management
        ├── createRecurringClass() - server action (FAKE)
        └── CreateRecurringClassView (pure UI)
              ├── PageHeader + breadcrumbs
              ├── RecurringClassForm
              │     ├── StudentGroupSelect (dropdown - EMPTY DATA)
              │     ├── TimeInput (start time picker)
              │     ├── DurationInput (hours/minutes fields)
              │     └── DaysScheduleSection
              │           └── DayScheduleRow (×7, weekend rows, override toggles)
              │                 └── MobileDayOverrideRow (mobile variant)
              └── SuccessSnackbar (mobile) / SuccessBadge (desktop)
```

---

## Issues Found

### 1. `createRecurringClass` Server Action — ENTIRELY FAKE
**File:** `frontend/views/dashboard/classes/recurring/actions/createRecurringClass.ts`

The server action is a complete mock:
- Uses `_data` (ignores input entirely)
- `setTimeout` to simulate latency (800-1400ms)
- 90% random success rate with random `classId` generation via `webcrypto`
- Never calls any service, repository, or GraphQL API
- Returns hardcoded English strings (no i18n)

**Real implementation should:** Call the real `RecurringClassService.createRecurringClass()` from the service layer, which already exists at `backend/services/schedule/recurring-class.service.ts` and is wired to the GraphQL mutation `createRecurringClass`.

**Suggestion:** Rewrite this server action to call `RecurringClassService.createRecurringClass(userId, input, locale)` directly (Server Actions can call services, per `app/AGENTS.md`). Map `RecurringClassFormData` to the service's `CreateRecurringClassInput` type. Get the current user ID via `getServerUserContext()` or `getCurrentUser()` cached wrapper.

---

### 2. `studentGroups` in Store — ALWAYS EMPTY
**File:** `frontend/stores/createRecurringClassStore.ts`

The store initializes `studentGroups: []` and never populates it. No action exists to fetch or set student groups. As a result, the `StudentGroupSelect` dropdown always renders empty.

**Real implementation should:** The GraphQL API does NOT have a `studentGroup` concept. The `CreateRecurringClassInput` schema requires `studentId` and `teacherId` (not a group). This needs to be reframed:

**Suggestion:** Replace the `StudentGroup` / `studentGroupId` concept with **two** selects:
- **Student select** — use `students` query (`studentsQueryDocument` from `student.documents.ts`), which returns `{ id, name }[]`
- **Teacher select** — use `teachers` query (`teachersQueryDocument` from `teacher.documents.ts`), which returns `{ id, name }[]`

This aligns with the actual `CreateRecurringClassInput` which requires `studentId` and `teacherId`.

The form schema (`recurringClassSchema.ts`) must be updated to replace `studentGroupId` with `studentId` and `teacherId`. The store must be updated similarly.

---

### 3. Missing Form Fields — `teacherId`, `timezone`, `classType`, `effectiveFrom/Until`, `generateInstancesForWeeks`
**File:** `frontend/views/dashboard/classes/recurring/recurringClassSchema.ts`

The form schema only has: `studentGroupId`, `defaultStartTime`, `durationHours`, `durationMinutes`, `days`.

The real `CreateRecurringClassInput` requires:
| Field | Status |
|---|---|
| `studentId` | Missing (replaced via issue #2) |
| `teacherId` | **Missing entirely** |
| `durationMinutes` | Collected as hours+minutes, needs computation |
| `defaultStartTime` | Present |
| `timezone` | **Missing entirely** |
| `timezoneId` | Optional, **missing** |
| `classType` | Optional, **missing** |
| `generateInstancesForWeeks` | Optional, **missing** |
| `effectiveFrom` | Optional, **missing** |
| `effectiveUntil` | Optional, **missing** |
| `days` | Present but uses wrong format (see #4) |

**Suggestion:** Add `teacherId` (required) and `timezone` (required) at minimum. Optional fields (`classType`, `effectiveFrom/Until`, `generateInstancesForWeeks`) can be added as collapsible "Advanced options" section to avoid cluttering the form.

---

### 4. `days` Field Format Mismatch
**Files:** `types.ts`, `recurringClassSchema.ts`, `createRecurringClassStore.ts`

The form uses lowercase day names (`"monday"`) in `DayScheduleConfig`.
The GraphQL `RecurringClassDayInput` expects uppercase (`"MONDAY"`).
The store defines a SECOND `DayOfWeek` type with uppercase, but the form's local `types.ts` overrides it with lowercase.

**Suggestion:** Unify on uppercase day names (`"MONDAY"`, `"TUESDAY"`, etc.) to match the GraphQL API and the store. Remove the duplicate lowercase `DayOfWeek` type from the form's local `types.ts` and use the store's `DayOfWeek` type instead. In the server action, map days from the form format to `RecurringClassDayInput` with proper `dayOfWeek`, `startTime`, and `isActive` fields.

Additionally, the form captures `timeOverride` per day but the API expects `startTime` — these need to be mapped in the server action.

---

### 5. Breadcrumb "Classes" Links to `/classes/new` (Itself)
**File:** `CreateRecurringClassView.tsx:153`

```ts
{ label: labels.breadcrumbs.classes, href: "/classes/new" }
```

There's no `/classes` list page (only `/classes/[id]` detail pages). The breadcrumb links back to the current page.

**Suggestion:** The "Classes" breadcrumb should either:
- (a) Link to `/dashboard` (or the daily schedule page) since there's no classes list page, OR
- (b) A `/classes` list page route should be created (out of scope for this task)

---

### 6. `handleClose` Navigates to `/dashboard`
**File:** `CreateRecurringClassContainer.tsx:28-30`

```ts
const handleClose = () => {
  router.push(`/${locale}/dashboard`);
};
```

This is functionally correct but semantically odd — the close button on a "Create Class" page sends you to the dashboard. After successful creation, there's no redirect to the created class's detail page.

**Suggestion:** After successful creation, redirect to the class detail page: `router.push(\`/${locale}/classes/${response.classId}\`)`. The close button can keep its dashboard redirect for "cancel" behavior.

---

### 7. No Error Handling/Display for Failed Creation
**File:** `CreateRecurringClassContainer.tsx:32-51`

When the mutation fails, only a `logger.warn` is emitted. The user sees no feedback. The form stays in place with no indication of what went wrong.

**Suggestion:** Add an error state (snackbar/badge) similar to the success indicator. Surface the error message from the service to the user (translated via i18n).

---

### 8. `StudentGroup` Type is a Local Re-invention
**File:** `frontend/views/dashboard/classes/recurring/types.ts`

```ts
export interface StudentGroup {
  readonly id: string;
  readonly name: string;
}
```

This type doesn't exist in the GraphQL schema. Per `AGENTS.md` (stores layer), types should come from generated GraphQL types.

**Suggestion:** Replace with `Pick<Types.Student, 'id' | 'name'>` or use `TeacherSimple` from generated types, imported from `graphql-types.ts`.

---

## Summary of Required Changes

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | Fake server action → call real service | **Critical** | Medium |
| 2 | Empty studentGroups → student + teacher selects with GraphQL data | **Critical** | Large |
| 3 | Missing required fields (teacherId, timezone) | **High** | Medium |
| 4 | Day format mismatch (lowercase vs uppercase) | **High** | Small |
| 5 | Breadcrumb self-link | Low | Small |
| 6 | No post-creation redirect to class detail | **Medium** | Small |
| 7 | No error feedback on failure | **Medium** | Medium |
| 8 | Local `StudentGroup` type instead of generated | Low | Small |

---

## Implementation Plan

### Phase 1: Types & Schema (Fix #3, #4, #8)

**1a. Update `frontend/views/dashboard/classes/recurring/types.ts`:**
- Replace `DayOfWeek` lowercase type — use uppercase from store: `import type { DayOfWeek } from "@/frontend/stores/createRecurringClassStore"`
- Replace `DayScheduleConfig` — use the store's `DayScheduleConfig<DayOfWeek>` 
- Update `DEFAULT_DAY_SCHEDULE` to uppercase day names (`"MONDAY"`, etc.)
- Remove local `StudentGroup` interface (Fix #8)
- Export a `SimpleEntity` type alias: `type SimpleEntity = { readonly id: string; readonly name: string }` for reuse by student/teacher selects (or use generated types directly)

**1b. Update `frontend/views/dashboard/classes/recurring/recurringClassSchema.ts`:**
- Replace `studentGroupId` with `studentId` (required) and `teacherId` (required)
- Add `timezone` field (required, default to `Intl.DateTimeFormat().resolvedOptions().timeZone`)
- Add optional fields: `classType`, `effectiveFrom`, `effectiveUntil`, `generateInstancesForWeeks`
- Keep `durationHours` + `durationMinutes` for UI; compute `durationMinutes` total at submission
- Update `days` sub-schema day enum to uppercase values

**1c. Update `frontend/stores/createRecurringClassStore.ts`:**
- Remove `studentGroups` state (fetching moves to Apollo queries in container)
- Remove `StudentGroup` import
- Remove duplicate `DayOfWeek`, `DayScheduleConfig`, `DEFAULT_DAY_SCHEDULE` (use shared from local `types.ts`)
- Add `errorMessage: string | null` state for error feedback
- Add `setErrorMessage` and `clearError` actions

### Phase 2: Server Action (Fix #1)

**Rewrite `frontend/views/dashboard/classes/recurring/actions/createRecurringClass.ts`:**
- Import `RecurringClassService` from `@/backend/services/schedule/recurring-class.service`
- Import `getServerUserContext` from `@/backend/lib/auth/server-auth`
- Get `locale` from `headers()` → `getLocale()` (next-intl/server)
- Map `RecurringClassFormData` to `CreateRecurringClassInput`:
  - `studentId` → `input.studentId`
  - `teacherId` → `input.teacherId`
  - `durationHours * 60 + durationMinutes` → `input.durationMinutes`
  - `defaultStartTime` → `input.defaultStartTime` (add `:00` seconds if needed)
  - `timezone` → `input.timezone`
  - `days` → map each: `{ dayOfWeek: day.day.toUpperCase(), startTime: day.showOverride ? day.timeOverride : formData.defaultStartTime, isActive: day.enabled }` (skip weekend days or send with `isActive: false`)
  - `classType` → `input.classType`
  - `effectiveFrom`, `effectiveUntil`, `generateInstancesForWeeks` → map from optional fields
- Call `RecurringClassService.createRecurringClass(userId, input, locale)`
- Return `{ success: true, classId: result.id }` or `{ success: false, message: error.message }`
- Remove fake random logic, `webcrypto`, `setTimeout`

### Phase 3: Student + Teacher Selects (Fix #2, #8)

**3a. Replace `StudentGroupSelect` with `EntitySelect` generic component:**
- Create `frontend/views/dashboard/classes/recurring/EntitySelect.tsx` (or keep `StudentGroupSelect` and rename)
- Accept `entities: readonly { id: string; name: string }[]`, `value`, `label`, `placeholder`, `loading`, `error` props
- Render MUI `Select` with entities mapped as `MenuItem`s
- Can reuse for both student and teacher selects

**3b. Update `RecurringClassFormFields.tsx`:**
- Import `useQuery` from `@apollo/client/react`
- Import `studentsQueryDocument` from `student.documents.ts`
- Import `teachersQueryDocument` from `teacher.documents.ts`
- Add two `useQuery` calls:
  - `const { data: studentsData, loading: studentsLoading } = useQuery(studentsQueryDocument, { variables: { paginationArgs: { page: 1, pageSize: 100 }, filterArgs: {}, orderBy: [] } })`
  - `const { data: teachersData, loading: teachersLoading } = useQuery(teachersQueryDocument, { variables: { search: "", limit: 50 } })`
- Replace single `StudentGroupSelect` with two selects: Student + Teacher
- Map query data to `{ id, name }[]` arrays for the select components
- Watch `studentId` and `teacherId` from form

**3c. Update `CreateRecurringClassView.tsx`:**
- Remove `studentGroups` prop — data fetching now in `RecurringClassFormFields`

**3d. Update `CreateRecurringClassContainer.tsx`:**
- Remove `studentGroups` from store usage
- Remove `studentGroups` prop passthrough to View

**3e. Update `RecurringClassForm.tsx`:**
- Remove `studentGroups` from props interface
- Remove `studentGroups` passthrough to `RecurringClassFormFields`

### Phase 4: Error Feedback (Fix #7)

**4a. Update `CreateRecurringClassContainer.tsx`:**
- Add `errorMessage` and `setErrorMessage`/`clearError` from store
- In `handleSubmit` catch/error path: `setErrorMessage(response.message || t('errors.createFailed'))`
- On success: `clearError()`
- Pass `errorMessage` and `onDismissError` to View

**4b. Update `CreateRecurringClassView.tsx`:**
- Add `ErrorSnackbar` component (mirror of `SuccessSnackbar` but with error colors/icon)
- Add `errorMessage` and `onDismissError` props
- Show error snackbar when `errorMessage` is non-null

### Phase 5: Post-Creation Redirect (Fix #6)

**Update `CreateRecurringClassContainer.tsx` handleSubmit:**
- On success: `router.push(\`/${locale}/classes/${response.classId}\`)` instead of staying on form
- Optionally add a small delay (1-2s) so user sees the success badge before redirecting

### Phase 6: Breadcrumb Fix (Fix #5)

**Update `CreateRecurringClassView.tsx`:**
- Change `{ label: labels.breadcrumbs.classes, href: "/classes/new" }` → `{ label: labels.breadcrumbs.classes, href: "/dashboard" }`

### Phase 7: i18n Keys

**Add new translation keys in the createRecurringClass namespace:**
- `teacher` / `teacherPlaceholder` — for teacher select label
- `timezone` / `timezonePlaceholder` — for timezone field
- `classType` / `classTypeOptions` — optional field labels
- `effectiveFrom` / `effectiveUntil` — optional date fields
- `generateInstancesForWeeks` — optional number field
- `validation.teacherRequired` / `validation.timezoneRequired` — validation messages
- `errors.createFailed` — error feedback message

### Phase 8: Storybook Update

**Update `CreateRecurringClassContainer.stories.tsx`:**
- Ensure story renders correctly with new schema (mock Apollo provider for students/teachers queries)

### Files Modified (Summary)

| File | Changes |
|---|---|
| `frontend/views/dashboard/classes/recurring/types.ts` | Uppercase days, remove StudentGroup, add SimpleEntity |
| `frontend/views/dashboard/classes/recurring/recurringClassSchema.ts` | New fields, uppercase days |
| `frontend/stores/createRecurringClassStore.ts` | Remove studentGroups/StudentGroup, add error state |
| `frontend/views/dashboard/classes/recurring/actions/createRecurringClass.ts` | Full rewrite — call real service |
| `frontend/views/dashboard/classes/recurring/StudentGroupSelect.tsx` | Rename/genericize to EntitySelect |
| `frontend/views/dashboard/classes/recurring/RecurringClassFormFields.tsx` | Add useQuery for students/teachers, two selects |
| `frontend/views/dashboard/classes/recurring/RecurringClassForm.tsx` | Remove studentGroups prop |
| `frontend/views/dashboard/classes/recurring/CreateRecurringClassView.tsx` | Remove studentGroups prop, add error UI, fix breadcrumb |
| `frontend/views/dashboard/classes/recurring/CreateRecurringClassContainer.tsx` | Remove studentGroups, add error handling, add redirect |
| `frontend/views/dashboard/classes/recurring/DayScheduleRow.tsx` | Update day label key access for uppercase |
| `frontend/views/dashboard/classes/recurring/DaysScheduleSection.tsx` | Update day label key access for uppercase |
| `frontend/views/dashboard/classes/recurring/MobileDayOverrideRow.tsx` | No structural change (uses DayScheduleConfig) |
