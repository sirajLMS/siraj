# Teacher Reassignment Page Refactor Plan

## Route Scope
`app/[locale]/(dashboard)/teachers/[id]/reassignment/*` and its subcomponents in `frontend/views/dashboard/teachers/reassignment/*`

---

## Component Audit Report

### 1. `TeacherReassignmentContainer.tsx` (Container)
**Path:** `frontend/views/dashboard/teachers/reassignment/TeacherReassignmentContainer.tsx`
**Issues:**
- Gets data from **Zustand stores** (`useStudentsStore`, `useTeachersStore`) instead of real **Apollo GraphQL queries**
- Hardcodes student ID `"stu-005"` to find a demo student
- Passes `currentTeacherName="Unset"` as a hardcoded string instead of using `teacherName` from the GraphQL query
- No permission gating (`RequirePermission` missing)
- No `useNotifications` hook imported (no error/success feedback)
- No URL param extraction (`useParams` for `[id]` / `useSearchParams` for `studentId`)
- In-file `interface TeacherReassignmentViewProps` is fine (component props, not domain types)

**Fixes:**
- Extract `teacherId` from URL params via `useParams()`, `studentId` from `useSearchParams()`
- Add `useQuery(studentByIdQueryDocument)` to fetch the current student
- Add `useQuery(teacherDirectoryQueryDocument)` to fetch available teachers
- Pass `teacherName` from the `studentById` query result as `currentTeacherName`
- Add `useMutation(reassignStudentTeacherMutationDocument)` for the submit action
- Add `useMutation(changeStudentStatusMutationDocument)` for the status change action
- Wrap with `<RequirePermission permissions={[AppPermission.StudentReassignTeacher, AppPermission.StudentManageStatus]}>`
- Add `useNotifications` for success/error feedback
- Add loading/error states

### 2. `TeacherReassignmentView.tsx` (View)
**Path:** `frontend/views/dashboard/teachers/reassignment/TeacherReassignmentView.tsx`
**Issues:**
- In-file `interface TeacherReassignmentViewProps` — this is a component props interface, acceptable in the view file per project patterns (similar to `StudentStatusViewProps` in `students/status/types.ts`, but those are in a separate types file)
- The `breadcrumbs` links use hardcoded hrefs (`/dashboard`, `/parents`) — `/parents` is incorrect (should be `/teachers` per user instruction)
- `ReassignmentBentoGrid` has no data props (static hardcoded content)

**Fixes:**
- Move `TeacherReassignmentViewProps` to a new `types.ts` file
- Fix breadcrumb: `parentManagement` should link to `/teachers` (teacher directory, as user specified)
- Pass `studentId` and callbacks to `ReassignmentBentoGrid`
- Pass `onSubmit` and `onCancel` callbacks for `ManagementControlsCard`
- Add `loading` prop to view for GraphQL mutation states

### 3. `ManagementControlsCard.tsx`
**Path:** `frontend/views/dashboard/teachers/reassignment/components/ManagementControlsCard.tsx`
**Issues:**
- **Fake submit handler**: Uses `setTimeout` to simulate async — no real GraphQL mutation
- **No controlled state**: The `<Select>` for teacher is `defaultValue=""` (uncontrolled) — cannot read the selected teacher ID for the mutation
- **No controlled state**: The status `<Select>` is also `defaultValue="regular"` (uncontrolled) — cannot read the selected status
- **Cancel button does nothing**: `onCancel={() => {}}`
- **No notifications**: No `useNotifications` usage; success/failure not communicated
- **Hardcoded status options**: `"Regular", "On Leave", "Suspended"` as strings instead of using `StudentStatus` enum
- **`statusMap` with hardcoded string mapping** instead of using `StudentStatus` enum values
- In-file types: `ManagementControlsCardProps`, `ActionButtonsProps` — should be in types file
- `currentStatus: string` — should be typed as `StudentAccountStatus`

**Fixes:**
- Convert both `<Select>` components to **controlled** state via `useState`
- Replace `handleSubmit` with real `reassignStudentTeacher` and `changeStudentStatus` mutations
- Wire cancel button to `router.back()` (navigation to previous page)
- Add `useNotifications` for success/error feedback
- Use `StudentStatus` enum for status options
- Use `STUDENT_STATUS_TO_ACCOUNT_STATUS` mapping from `students/home/types.ts` instead of inline `statusMap`
- Move interfaces to `types.ts`

### 4. `StudentContextCard.tsx`
**Path:** `frontend/views/dashboard/teachers/reassignment/components/StudentContextCard.tsx`
**Issues:**
- In-file `interface StudentContextCardProps` — should be in types file
- Uses `StudentDirectoryRow` (from GraphQL generated types) as prop type — but the container passes `StudentDirectoryRowExtended` (from `students/home/types.ts`). The import type is mismatched with what's actually passed
- Grade has been removed from the system entirely — remove the grade cell from the Grid layout, keep only the enrollment status cell
- No `avatarUrl` from the `studentById` query (the query doesn't return it yet)

**Fixes:**
- Fix prop type to use a proper type from the reassignment `types.ts` (not from generated GraphQL types directly, to avoid coupling to query shape)
- Pass `avatarUrl: null` since the `studentById` query (backed by `AssociatedStudent` type) does NOT return `avatarUrl` — confirmed via backend investigation (adding it requires changes to `parent.repository.ts`, `parent-profile.service.ts`, and `parent-profile.pothos.ts`, all out of scope)
- Move interface to `types.ts`
- Remove grade display entirely (system has removed grade)

### 5. `CurrentTeacherCard.tsx`
**Path:** `frontend/views/dashboard/teachers/reassignment/components/CurrentTeacherCard.tsx`
**Issues:**
- In-file `interface CurrentTeacherCardProps` — should be in types file
- Accepts only `currentTeacherName: string` — should also accept teacher ID for navigation
- No click/interaction — could navigate to teacher profile

**Fixes:**
- Move interface to `types.ts`
- Optionally add teacher ID prop and onClick navigation to teacher profile page

### 6. `ReassignmentBentoGrid.tsx`
**Path:** `frontend/views/dashboard/teachers/reassignment/components/ReassignmentBentoGrid.tsx`
**Issues:**
- In-file `interface BentoCardProps` — should be in types file
- **No data**: Hardcoded `"Oct 24"` and `count: 2` instead of real data
- **No actions**: `cursor: "pointer"` on cards but no `onClick` handler
- Cards are purely decorative — clicking them does nothing

**Fixes:**
- Move `BentoCardProps` to `types.ts`
- Add `onClick` handlers: History card navigates to `/students/{studentId}/history`, Contact card could trigger a notification or navigate to parent contact
- Accept `studentId` prop for navigation
- Accept real data props (lastUpdated, pendingNotificationCount) or use meaningful defaults

### 7. `TeacherReassignmentContainer.stories.tsx`
**Path:** `frontend/views/dashboard/teachers/reassignment/TeacherReassignmentContainer.stories.tsx`
**Issues:**
- No mock data provided; the container will have empty store data
- With GraphQL queries added, stories need Apollo mock provider

**Fixes:**
- Update story to provide Apollo mock data or use mock stores (following existing Storybook patterns)

### 8. `page.tsx`
**Path:** `app/[locale]/(dashboard)/teachers/[id]/reassignment/page.tsx`
**Issues:**
- Currently a simple passthrough; no server-side data fetching
- As a Server Component, could use `getServerUserContext()` for auth verification

**Fixes:**
- Add authentication guard using `getServerUserContext()` and `redirect()` (following `app/AGENTS.md` pattern)
- Pass `locale` via `params` if needed for i18n

---

## Type Management Plan

### New File: `frontend/views/dashboard/teachers/reassignment/types.ts`

All custom interfaces currently defined in component files will be moved here:

```ts
import type { StudentAccountStatus } from "@/frontend/views/dashboard/students/home/types";
import type { StudentStatus } from "@/shared/lib/enum";

export interface TeacherReassignmentViewProps {
  readonly student: ReassignmentStudentData;
  readonly currentTeacherName: string;
  readonly teachers: readonly ReassignmentTeacherOption[];
  readonly isSubmitting: boolean;
  readonly onReassign: (input: ReassignmentSubmitInput) => Promise<void>;
  readonly onStatusChange: (input: StatusChangeInput) => Promise<void>;
  readonly onCancel: () => void;
}

export interface ReassignmentStudentData {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly accountStatus: StudentAccountStatus;
  readonly status: StudentStatus;
  readonly primaryTeacherId: string | null;
  readonly teacherName: string | null;
  readonly version: number | null;
  readonly updatedAt: string | null;
}

export interface ReassignmentTeacherOption {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly status: "active" | "offline";
}

export interface ReassignmentSubmitInput {
  readonly studentId: string;
  readonly newTeacherId: string;
  readonly expectedVersion?: number;
}

export interface StatusChangeInput {
  readonly studentId: string;
  readonly newStatus: StudentStatus;
  readonly expectedVersion?: number;
}

export interface ManagementControlsCardProps {
  readonly teachers: readonly ReassignmentTeacherOption[];
  readonly currentStatus: StudentAccountStatus;
  readonly studentId: string;
  readonly version: number | null;
  readonly isSubmitting: boolean;
  readonly onReassign: (input: ReassignmentSubmitInput) => Promise<void>;
  readonly onStatusChange: (input: StatusChangeInput) => Promise<void>;
  readonly onCancel: () => void;
}

export interface StudentContextCardProps {
  readonly student: ReassignmentStudentData;
}

export interface CurrentTeacherCardProps {
  readonly currentTeacherName: string;
  readonly teacherId?: string;
}

export interface BentoCardProps {
  readonly icon: React.ComponentType;
  readonly title: string;
  readonly subtitle: string;
  readonly onClick?: () => void;
}

export interface ReassignmentBentoGridProps {
  readonly studentId: string;
  readonly lastUpdated: string | null;
  readonly pendingNotificationCount: number;
}
```

### Types Removed from Component Files
- `TeacherReassignmentViewProps` from `TeacherReassignmentView.tsx`
- `ManagementControlsCardProps` from `ManagementControlsCard.tsx`
- `ActionButtonsProps` from `ManagementControlsCard.tsx`
- `StudentContextCardProps` from `StudentContextCard.tsx`
- `CurrentTeacherCardProps` from `CurrentTeacherCard.tsx`
- `BentoCardProps` from `ReassignmentBentoGrid.tsx`

### Enum Enforcement
- Use `StudentStatus` from `@/shared/lib/enum` instead of hardcoded status strings
- Use `StudentAccountStatus` from `students/home/types.ts` for `currentStatus` prop
- Use `AppPermission.StudentReassignTeacher` and `AppPermission.StudentManageStatus` from generated types
- Remove inline `statusMap` in `ManagementControlsCard` and use `STUDENT_STATUS_TO_ACCOUNT_STATUS` from `students/home/types.ts`

---

## Implementation Steps

### Step 1: Create `types.ts`
Create `frontend/views/dashboard/teachers/reassignment/types.ts` with all extracted types.

### Step 2: Refactor `TeacherReassignmentContainer.tsx`
- Extract `teacherId` from URL params via `useParams()` (for breadcrumb context/future use)
- Extract `studentId` from `useSearchParams()` (e.g. `?studentId=stu-005`)
- If no `studentId` is present, show error notification and redirect
- Add `useQuery(studentByIdQueryDocument)` for student data
- Add `useQuery(teacherDirectoryQueryDocument)` for teacher list
- Add `useMutation(reassignStudentTeacherMutationDocument)` with `onCompleted`/`onError` callbacks
- Add `useMutation(changeStudentStatusMutationDocument)` with `onCompleted`/`onError` callbacks (user confirmed: include both)
- Add `useNotifications` for feedback
- Wrap with `<RequirePermission permissions={[AppPermission.StudentReassignTeacher, AppPermission.StudentManageStatus]}>`
- Add loading/error states
- Transform query data into `ReassignmentStudentData` and `ReassignmentTeacherOption` types
- Add `useRef` for `version` tracking (optimistic concurrency)
- Map `s.status` (string) to `StudentStatus` enum: `s.status as StudentStatus`
- Map `StudentStatus` to `StudentAccountStatus` via `STUDENT_STATUS_TO_ACCOUNT_STATUS` for the view

### Step 3: Refactor `TeacherReassignmentView.tsx`
- Update imports: types from `./types`
- Fix breadcrumb href: `/parents` → `/teachers` (user specified)
- Pass data and callbacks to child components
- Add `isSubmitting`, `onSubmit`, `onStatusChange`, `onCancel` props

### Step 4: Refactor `ManagementControlsCard.tsx`
- Convert both `<Select>` components to **controlled** state via `useState`
- Replace `handleSubmit` with real mutation calls: first `reassignStudentTeacher` if teacher changed, then `changeStudentStatus` if status changed
- Filter status dropdown to **only allowed transitions** based on current status (use `ALLOWED_TARGET_STATUSES` pattern from `ParentStudentsDataGrid.tsx`, using `StudentStatus` enum as keys)
- Send `newStatus` as UPPERCASE `StudentStatus` enum value (matching backend expectation per `ParentStudentsDataGrid.tsx:181`)
- Wire cancel to `onCancel` prop (→ `router.back()`)
- Use `StudentStatus` enum for status dropdown options
- Remove `statusMap`, use `STUDENT_STATUS_TO_ACCOUNT_STATUS` from `students/home/types.ts`
- Update to use `useNotifications` for validation feedback (selection required before submit)
- Move types to `types.ts`

### Step 5: Refactor `StudentContextCard.tsx`
- Update prop type from `StudentDirectoryRow` to `ReassignmentStudentData`
- Import type from `./types` (via relative `../types`)
- Remove grade display entirely (grade removed from system — per user instruction)

### Step 6: Refactor `CurrentTeacherCard.tsx`
- Move interface to `types.ts`
- Add optional `teacherId` prop for future navigation

### Step 7: Refactor `ReassignmentBentoGrid.tsx`
- Add `studentId` and data props
- Add `onClick` handler for History card → navigate to `/students/{studentId}/history`
- Add `onClick` handler for Contact card → `notifications.show()` (parent contact coming soon)
- Use `useRouter` from `@/shared/i18n/routing`
- Use `useNotifications`

### Step 8: Update `page.tsx`
- Add auth guard with `getServerUserContext()` and `redirect()` (following `books-and-bags/page.tsx` pattern)
- Use `setRequestLocale(locale)` for i18n
- Add `locale` via `params` for redirect consistency
- The page.tsx is a Server Component that just renders `<TeacherReassignmentContainer />` — all data fetching happens in the client container via Apollo

### Step 9: Update Storybook
- Update `TeacherReassignmentContainer.stories.tsx` with mock Apollo provider

### Step 10: Validate
- Run `bun tsgo`
- Run `bun biome:check`
- Run `bun lint`

---

## Backend Query Changes Required
- **`studentById` query**: Currently does NOT return `avatarUrl`. The `AssociatedStudent` Pothos type (in `parent-profile.pothos.ts`) and its underlying `AssociatedStudentResult` interface (in `parent-profile.service.ts`) don't include `avatarUrl`. The `AssociatedStudentRow` in `parent.repository.ts` also doesn't fetch it from the DB. **Since adding `avatarUrl` requires backend changes (out of scope), we will pass `null` for now.** The `Student` object (in `student.pothos.ts`) DOES expose `avatarUrl`, but `studentById` reuses `AssociatedStudentRef`, not `StudentRef`. A future refactor could unify these, but that's out of scope.
- **`teacherDirectory` query**: Already returns `id`, `name`, `avatarUrl`, `status`. This is sufficient for the teacher dropdown.
- **`reassignStudentTeacher` mutation**: Already exists and works.
- **`changeStudentStatus` mutation**: Already exists and works.

**No new backend schema changes needed** — the existing queries and mutations are sufficient.

---

## Key Implementation Patterns (from codebase investigation)

### Route param extraction
- **`[id]` URL param** = teacher ID (from `useParams`, for breadcrumb consistency with other `/teachers/[id]/*` routes)
- **`?studentId=xxx` searchParam** = the student being reassigned (from `useSearchParams`, following `DashboardContainer.tsx` pattern)
- If no `studentId` is present, show error notification and redirect

### Status mapping (StudentStatus enum → AccountStatus)
`StudentStatus` enum values are UPPERCASE (`REGULAR`, `SUSPENDED`, etc.) while `StudentAccountStatus` uses lowercase (`"regular"`, `"suspended"`, etc.) — the `StatusBadge` component expects lowercase. Use `STUDENT_STATUS_TO_ACCOUNT_STATUS` from `students/home/types.ts` for mapping.

### Status transition rules
Allowed status transitions are defined in:
- Backend: `ALLOWED_STATUS_TRANSITIONS` in `backend/types/student-lifecycle.types.ts`
- Frontend duplicate: `ALLOWED_TARGET_STATUSES` in `ParentStudentsDataGrid.tsx`

For the reassignment page, the status dropdown should filter to **only allowed transitions** from the current status, matching the pattern in `ParentStudentsDataGrid.tsx`. Use `StudentStatus` enum values (UPPERCASE) as keys.

### Mutation variable format
From `ParentStudentsDataGrid.tsx:181`: `newStatus` is sent as `selectedStatus.toUpperCase()` — the backend expects UPPERCASE `StudentStatus` enum values.

### `useParams` pattern
From `StudentHistoryContainer.tsx:16`: `useParams<{ id: string }>()` — typed generic for direct destructuring.

### `router.back()` for cancel
From `StudentQuotaContainer.tsx:93`: `router.back()` via `useRouter` from `@/shared/i18n/routing`.

### Storybook with Apollo mocks
From `TeacherAvailabilityContainer.stories.tsx`: Use `MockedProvider` from `@apollo/client/testing/react` with mock query results matching the GraphQL document's shape.

### i18n keys
Current English translations at `shared/messages/en.ts:1207-1248` already have the `grade` key. Since we're removing grade display, we should not delete the i18n key (other locales/components may use it) — just stop rendering the grade cell.

### Breadcrumb `parentManagement` label — the key is `breadcrumbs.parentManagement` but the user wants it to link to `/teachers`. This mismatch between label and link should be resolved by updating both the translation key/value and the href. However, translation updates are **out of scope** for this refactor (shared messages affect all locales). We'll just update the **href** from `/parents` to `/teachers` and leave the translation key as-is for now — the label already says "Parent Management" which is the navigation category.

---

## Files Changed (In Scope Only)
1. `frontend/views/dashboard/teachers/reassignment/types.ts` — **NEW**
2. `frontend/views/dashboard/teachers/reassignment/TeacherReassignmentContainer.tsx` — Refactor
3. `frontend/views/dashboard/teachers/reassignment/TeacherReassignmentView.tsx` — Refactor
4. `frontend/views/dashboard/teachers/reassignment/components/ManagementControlsCard.tsx` — Refactor
5. `frontend/views/dashboard/teachers/reassignment/components/StudentContextCard.tsx` — Refactor
6. `frontend/views/dashboard/teachers/reassignment/components/CurrentTeacherCard.tsx` — Refactor
7. `frontend/views/dashboard/teachers/reassignment/components/ReassignmentBentoGrid.tsx` — Refactor
8. `frontend/views/dashboard/teachers/reassignment/TeacherReassignmentContainer.stories.tsx` — Update
9. `app/[locale]/(dashboard)/teachers/[id]/reassignment/page.tsx` — Add auth guard + searchParams pass-through

---

## No-Snackbar Confirmation
No direct `Snackbar` usage was found in any of the reassignment components. The notification migration requirement is satisfied by adding `useNotifications` where actions are implemented (Container and ManagementControlsCard).
