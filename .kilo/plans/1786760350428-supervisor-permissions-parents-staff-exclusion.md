# Plan: Issue #47 — Supervisor Permissions (Teachers/Students/Parents), Staff Exclusion, Teacher Permission Gating Fix

**GitHub Issue:** [#47](https://github.com/sirajLMS/siraj/issues/47)
**Supersedes:** `.ai/plans/issue-47-supervisor-permissions/plan.md` (original plan — this plan revises it)

## Overview

Three interconnected changes:

1. **Supervisor permissions expansion**: Grant `supervisor_default` full operational management over **Teachers, Students, AND Parents** (list, create, edit, view/edit profiles, manage schedules/status/lifecycle). **Staff is explicitly excluded** — no staff management or view permissions, and no field-ACL `edit_other` permissions that apply to staff audiences.
2. **Teacher permission gating fix**: Replace `StaffViewDirectory` (a staff permission) with `TeachersList` / `TeachersManageSchedule` (teacher-specific permissions) in all teacher page/nav/service gates. The `/teachers` page and nav item must be gated behind teacher permissions, not staff permissions.
3. **System group ACL customization (superadmin-only)**: Lift the `isSystem` immutability restriction so **superadmin** can customize permission bundles for `supervisor_default` and `academy_admin` via the Permission Management UI. System groups cannot be renamed, slug-changed, or deleted — only their `permissionIds` bundle is editable. **Only superadmin can manage permissions** — `academy_admin` does NOT get `permission_groups.manage` or `permission_groups.assign`.

> **⚠️ CRITICAL: DO NOT RUN UI TESTS**
> UI tests (`bun run test:ui:components`, `bun run test:ui`, navigation tests in `test/ui/`) MUST be written/updated as part of this implementation but MUST NEVER be run or executed. Write the test code, update fixtures and assertions — but do NOT execute the test runner.

---

## Key Design Decisions (Revised from Original Plan)

### D1: Staff Exclusion — Supervisor Gets NO Staff Permissions
The original plan proposed granting `staff.view_directory` to the supervisor. **This is removed.** The supervisor must NOT have any staff management or view permissions. The staff tab in `/users` must NOT be available to supervisors.

### D2: Staff Field-ACL Exclusion — No `edit_other` for Staff-Audience Field Groups
The field-ACL model uses `audiences` to determine which user types a field group applies to:
- `core_identity` and `core_contact`: `audiences: ALL_AUDIENCES` = `[TEACHER, PARENT, STAFF]` — granting `edit_other` would allow editing **staff** profiles' name/email/phone. **EXCLUDED.**
- `staff_role`: `audiences: [STAFF]` — granting `edit_other` would allow editing staff role/status/hourlyRate. **EXCLUDED.**
- `staff_permissions`: `audiences: [STAFF]` — granting `edit_other` would allow editing staff permission groups/overrides. **EXCLUDED.**
- `payment_methods`: `audiences: [TEACHER, PARENT]` — safe, no staff. **INCLUDED.**
- `meeting_configs`: `audiences: [TEACHER, PARENT]` — safe, no staff. **INCLUDED.**

The supervisor already has `view_other` for `core_identity`, `core_contact`, `staff_role`, `staff_permissions` (from the existing migration). These `view_other` permissions allow viewing staff profile fields — but the user wants NO staff management. However, removing existing `view_other` permissions would be a **backward-incompatible reduction** (violates NFR-2). The existing `view_other` permissions are kept as-is; only `edit_other` grants are excluded for staff-audience field groups.

### D3: Parent Permissions Added — Supervisor Gets Full Parent Management
The original plan only covered teachers and students. **Parents are now included.** The supervisor gets `parents.list`, `parents.create`, `parents.edit`, `parent.view_directory`, `parent.manage_status` plus parent field-ACL `edit_other` permissions (`parent_social`, `parent_identity`, `parent_billing`, `parent_account`, `parent_students` — all `audiences: [PARENT]` only, no staff).

### D4: Teacher Page/Nav Gated on Teacher Permissions, Not Staff Permissions
The `/teachers` page, `teachers` nav item, and `usersTeachers` tab are currently gated on `StaffViewDirectory` (a staff permission). This is wrong — they must be gated on `TeachersList` (a teacher-specific permission). This decouples teacher access from staff access, allowing supervisors (who have `TeachersList` but NOT `StaffViewDirectory`) to access teacher pages without granting staff access.

### D5: Weekly Schedule `isAdmin` Replaced with Permission Check
The `useTeacherWeeklyScheduleViewModel` uses `isAdmin: hasPermission(StaffViewDirectory)` to gate the teacher directory dropdown. This must be replaced with `hasScheduleManageTeacher: hasPermission(TeachersManageSchedule)` — a teacher-specific permission, not a staff permission.

### D6: `resolveTeacherId` Backend Helper Updated
The `resolveTeacherId` helper in `backend/services/schedule/__shared__/resolveTeacherId.ts` checks `StaffViewDirectory` OR `ScheduleViewAll` for the admin path. Must add `TeachersManageSchedule` as an additional admin-level permission so supervisors can view any teacher's schedule.

### D7: Nav Config — Supervisor Sees Teachers, Students, Parents (NOT Staff)
`applySupervisorNavOverrides` must remove `teachers`, `students`, `parents` from the hardcoded hide set. `staff` must REMAIN hidden (or be filtered by permission — supervisor lacks `StaffViewDirectory`). The `grp_users` nav group permission array must replace `StaffViewDirectory` with `TeachersList`.

### D8: Permission Management — Superadmin Only
Only superadmin can manage permissions. `academy_admin` does NOT get `permission_groups.manage` or `permission_groups.assign`. The system group editing feature (Phases 3-4) still works — but only superadmin can access it (the `requireManageAccess` guard already checks `isSuperAdmin || hasPermission(PERMISSION_GROUPS_MANAGE)`; since no non-superadmin group has `PERMISSION_GROUPS_MANAGE`, only superadmin passes).

### D9: Migration Execution — Run for Each `.env*` File
After SQL migration edits, run `bun db migrate --env-file <file>` for each `.env*` file in the repo root that contains a valid `DATABASE_URL`. This ensures all databases (dev, test, staging, production) receive the permission grants.

---

## Phase 0: Pre-Implementation Baseline

- [ ] 0.1 Record baseline error counts: `bun tsgo 2>&1 | grep "error TS" | wc -l`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id baseline`
- [ ] 0.2 Create `.ai/plans/issue-47-supervisor-permissions/outcome/` directory (if not exists)
- [ ] 0.3 Write baseline outcome file

---

## Phase 1: Database Migrations — Grant Permissions (In-Place Edits)

> **CRITICAL CONSTRAINT:** The existing SQL migration files MUST be updated in-place — NOT new migrations. `ON CONFLICT DO NOTHING` ensures idempotency. The migration auto-bundler (`applyCustomMigrations.ts`) generates new Drizzle mirror folders from changed raw SQL files — do NOT manually edit existing Drizzle mirror folders.

### 1A. `supervisor_default` non-field-ACL permissions → `6-lms-permissions-and-groups.sql`

**File:** `backend/db/migration/6-lms-permissions-and-groups.sql`
**Target:** `supervisor_default` block (lines 200-228) — `p.key IN (...)` clause

Add comment block above the INSERT (before line 200):
```sql
-- IMPORTANT: Supervisors are granted ALL current and future teacher/student/parent management permissions.
-- Any new teacher/student/parent management permission MUST be added to this group.
-- Staff permissions are NEVER granted to supervisors.
```

Append to `p.key IN (...)` (after line 226 `'teacher.view_profile'`):
```sql
'teachers.create',
'teachers.edit',
'teachers.manage_schedule',
'schedule.view_weekly',
'schedule.view_workload',
'schedule.create_class',
'schedule.delete_class',
'schedule.clear_weekly',
'students.create',
'students.edit',
'student.reassign_teacher',
'student.manage_status',
'parents.list',
'parents.create',
'parents.edit',
'parent.view_directory',
'parent.manage_status'
```

**Note:** `schedule.view_weekly`, `schedule.view_workload`, `schedule.create_class`, `schedule.delete_class`, `schedule.clear_weekly` are added because the supervisor needs to manage teacher weekly schedules. The `/teachers/[id]/schedule/weekly` page is gated on `SCHEDULE_VIEW_WEEKLY`, and the weekly schedule ViewModel gates schedule management actions on `ScheduleCreateClass`, `ScheduleClearWeekly`, `ScheduleViewWorkload`, `ScheduleDeleteClass`. Without these, the supervisor has `teachers.manage_schedule` but cannot actually view or modify the weekly schedule page.

**⚠️ DO NOT add `staff.view_directory`** — staff is excluded.

- [ ] 1.1 Update `backend/db/migration/6-lms-permissions-and-groups.sql` (1A permissions + comment)
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/db/migration/6-lms-permissions-and-groups.sql --lifecycle codescene`
  - **AGENTS.md:** `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`

### 1B. `supervisor_default` field-ACL `edit_other` permissions → `6d-profile-fine-grained-only.sql`

**File:** `backend/db/migration/6d-profile-fine-grained-only.sql`
**Target:** `supervisor_default` block (lines 300-333) — `p.key IN (...)` clause

Append ONLY for field groups where:
1. Supervisor already has `view_other` (lines 311-331), AND
2. The field group's `audiences` does NOT include `STAFF`

**Field group audience analysis** (from `backend/types/profile/profile-field-manifest.ts`):

| Field Group | Audiences | Include `edit_other`? | Reason |
|-------------|-----------|-----------------------|--------|
| `core_identity` | `[TEACHER, PARENT, STAFF]` | **NO** | Includes STAFF — would allow editing staff name/email |
| `core_contact` | `[TEACHER, PARENT, STAFF]` | **NO** | Includes STAFF — would allow editing staff phone/timezone |
| `teacher_professional` | `[TEACHER]` | **YES** | Teacher-only |
| `teacher_identity` | `[TEACHER]` | **YES** | Teacher-only |
| `parent_social` | `[PARENT]` | **YES** | Parent-only |
| `parent_identity` | `[PARENT]` | **YES** | Parent-only |
| `parent_billing` | `[PARENT]` | **YES** | Parent-only |
| `parent_account` | `[PARENT]` | **YES** | Parent-only |
| `parent_students` | `[PARENT]` | **YES** | Parent-only |
| `teacher_students` | `[TEACHER]` | **YES** | Teacher-only |
| `staff_role` | `[STAFF]` | **NO** | Staff-only — would allow editing staff role/status |
| `staff_permissions` | `[STAFF]` | **NO** | Staff-only — would allow editing staff permissions |
| `payment_methods` | `[TEACHER, PARENT]` | **YES** | No staff |
| `meeting_configs` | `[TEACHER, PARENT]` | **YES** | No staff |
| `student_identity` | student model | **YES** | Student-only |
| `student_academic` | student model | **YES** | Student-only |
| `student_teacher` | student model | **YES** | Student-only |
| `student_parent` | student model | **YES** | Student-only |
| `student_schedule` | student model | **YES** | Student-only |
| `student_history` | student model | **YES** | Student-only |
| `student_quota_edit` | student model | **YES** | Student-only |

Append to `p.key IN (...)`:
```sql
'profile.teacher_professional.edit_other',
'profile.teacher_identity.edit_other',
'profile.parent_social.edit_other',
'profile.parent_identity.edit_other',
'profile.parent_billing.edit_other',
'profile.parent_account.edit_other',
'profile.parent_students.edit_other',
'profile.teacher_students.edit_other',
'profile.payment_methods.edit_other',
'profile.meeting_configs.edit_other',
'student.student_identity.edit_other',
'student.student_academic.edit_other',
'student.student_teacher.edit_other',
'student.student_parent.edit_other',
'student.student_schedule.edit_other',
'student.student_history.edit_other',
'student.student_quota_edit.edit_other'
```

**⚠️ EXCLUDED (staff-audience field groups):**
- `profile.core_identity.edit_other` — `audiences: ALL_AUDIENCES` includes STAFF
- `profile.core_contact.edit_other` — `audiences: ALL_AUDIENCES` includes STAFF
- `profile.staff_role.edit_other` — `audiences: [STAFF]`
- `profile.staff_permissions.edit_other` — `audiences: [STAFF]`

**Note:** `profile.core_status.edit_other` is also excluded — supervisor doesn't have `view_other` for `core_status`.

- [ ] 1.2 Update `backend/db/migration/6d-profile-fine-grained-only.sql` (1B edit_other permissions — 17 grants, excluding staff-audience groups)
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/db/migration/6d-profile-fine-grained-only.sql --lifecycle codescene`

### 1C. `academy_admin` permissions → `3-system_permissions_and_groups.sql`

**File:** `backend/db/migration/3-system_permissions_and_groups.sql`
**Target:** `academy_admin` block (lines 1292-1358) — `p.key IN (...)` clause

Append:
```sql
'teachers.edit',
'teachers.list',
'students.edit',
'students.change_teacher',
'students.change_status'
```

**⚠️ DO NOT add `permission_groups.manage` or `permission_groups.assign`** — only superadmin manages permissions. The `requireManageAccess` guard already allows superadmin without needing the permission.

- [ ] 1.3 Update `backend/db/migration/3-system_permissions_and_groups.sql` (1C academy_admin grants — 5 permissions, NO permission_groups.manage/assign)
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/db/migration/3-system_permissions_and_groups.sql --lifecycle codescene`

### 1D. Run Migrations for Each `.env*` File

After all SQL edits, run `bun db migrate` for each `.env*` file in the repo root that contains a valid `DATABASE_URL`. The `--env-file` flag selects which database to migrate.

**Env files to migrate (verify each exists and has valid `DATABASE_URL` before running):**
```bash
bun db migrate --env-file .env
bun db migrate --env-file .env.local
bun db migrate --env-file .env.test
bun db migrate --env-file .env.mishkah
bun db migrate --env-file .env.quranAcademy
bun db migrate --env-file .env.vercel
bun db migrate --env-file .env.redis
```

**Skip:** `.env.example` (excluded by env file discovery logic), `.env.bak` (if it lacks a valid `DATABASE_URL`).

**Note:** Do NOT manually edit existing Drizzle mirror folders. The auto-bundler generates new timestamped folders from changed SQL files.

- [ ] 1.4 Run `bun db migrate --env-file <file>` for each `.env*` file in repo root with a valid `DATABASE_URL`
  - Verify new timestamped folders appear under `backend/drizzle/`
  - Query `supervisor_default` group permissions — verify all new permissions present (16 non-field-ACL + 17 field-ACL `edit_other`)
  - Query `academy_admin` group permissions — verify 5 new permissions present
  - Verify `staff.view_directory` is NOT in `supervisor_default`
  - Verify `permission_groups.manage` and `permission_groups.assign` are NOT in `academy_admin`

- [ ] 1.5 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/1-outcome.md`

---

## Phase 2: Teacher Permission Gating Fix — Replace `StaffViewDirectory` with `TeachersList`

**Goal:** Decouple teacher page/nav/service access from the `StaffViewDirectory` staff permission. Teacher pages must be gated on teacher-specific permissions (`TeachersList`, `TeachersManageSchedule`).

### 2A. `PAGE_PERMISSIONS` — Replace `StaffViewDirectory` with `TeachersList`

**File:** `frontend/common/types/page-permissions.types.ts`

| Line | Current | New |
|------|---------|-----|
| 50 | `teachers: [AppPermission.StaffViewDirectory]` | `teachers: [AppPermission.TeachersList]` |
| 56 | `usersTeachers: [AppPermission.StaffViewDirectory, AppPermission.TeachersList]` | `usersTeachers: [AppPermission.TeachersList]` |
| 51-55 | `usersDirectoryParent: [StaffViewDirectory, ParentViewDirectory, StudentsList]` | `usersDirectoryParent: [TeachersList, ParentViewDirectory, StudentsList]` |

**Note:** `PAGE_PERMISSIONS.usersStaff` (line 59) and `PAGE_PERMISSIONS.staff` (line 63) keep `StaffViewDirectory` — these are staff-specific and should NOT change.

- [ ] 2.1 Update `frontend/common/types/page-permissions.types.ts` — replace `StaffViewDirectory` with `TeachersList` in `teachers`, `usersTeachers`, and `usersDirectoryParent`
  - Quality loop: `bun run scripts/health/sub-loop.ts frontend/common/types/page-permissions.types.ts --lifecycle codescene`
  - **AGENTS.md:** `frontend/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`

### 2B. `/teachers` page — Replace `STAFF_VIEW_DIRECTORY` with `TEACHERS_LIST`

**File:** `app/(dashboard)/teachers/page.tsx` (line 16)

**Current:** `withPageAuth([AppPermission.STAFF_VIEW_DIRECTORY, AppPermission.TEACHERS_LIST], ...)`
**New:** `withPageAuth([AppPermission.TEACHERS_LIST], ...)`

- [ ] 2.2 Update `app/(dashboard)/teachers/page.tsx` — change `withPageAuth` to `[AppPermission.TEACHERS_LIST]`
  - Quality loop: `bun run scripts/health/sub-loop.ts app/(dashboard)/teachers/page.tsx --lifecycle codescene`
  - **AGENTS.md:** `app/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`

### 2C. `/users` page — Replace `STAFF_VIEW_DIRECTORY` with `TEACHERS_LIST`

**File:** `app/(dashboard)/users/page.tsx` (line 17)

**Current:** `[AppPermission.STAFF_VIEW_DIRECTORY, AppPermission.PARENT_VIEW_DIRECTORY, AppPermission.STUDENTS_LIST]`
**New:** `[AppPermission.TEACHERS_LIST, AppPermission.PARENT_VIEW_DIRECTORY, AppPermission.STUDENTS_LIST]`

**Rationale:** The supervisor has `TeachersList`, `ParentViewDirectory` (newly granted), and `StudentsList` — so they can access the page. The staff tab inside is gated on `PAGE_PERMISSIONS.usersStaff` = `[StaffViewDirectory]` which the supervisor does NOT have — so the staff tab will NOT appear for supervisors.

- [ ] 2.3 Update `app/(dashboard)/users/page.tsx` — replace `STAFF_VIEW_DIRECTORY` with `TEACHERS_LIST`
  - Quality loop: `bun run scripts/health/sub-loop.ts app/(dashboard)/users/page.tsx --lifecycle codescene`

### 2D. `grp_users` nav group — Replace `StaffViewDirectory` with `TeachersList`

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts` (line 164)

**Current:**
```typescript
permission: [
  AppPermission.StaffViewDirectory,
  AppPermission.ParentsList,
  AppPermission.TeacherViewStudents,
  AppPermission.StudentsList,
],
```

**New:**
```typescript
permission: [
  AppPermission.TeachersList,
  AppPermission.ParentsList,
  AppPermission.TeacherViewStudents,
  AppPermission.StudentsList,
],
```

- [ ] 2.4 Update `frontend/common/views/dashboard/config/navigationConfig.ts` — replace `StaffViewDirectory` with `TeachersList` in `grp_users` group permission array (line 164)
  - Quality loop: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`

### 2E. Weekly schedule ViewModel — Replace `isAdmin` with `hasScheduleManageTeacher`

**File:** `frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleViewModel.ts`

**Current (lines 68, 131, 139, 154, 491):** Uses `isAdmin: hasPermission(AppPermission.StaffViewDirectory)` to gate the teacher directory dropdown query (`skip: !isAdmin`).

**New:** Replace `isAdmin` with `hasScheduleManageTeacher: hasPermission(AppPermission.TeachersManageSchedule)`.

Changes:
- `SchedulePermissions.isAdmin` → `SchedulePermissions.hasScheduleManageTeacher`
- `useSchedulePermissions` return: `hasScheduleManageTeacher: hasPermission(AppPermission.TeachersManageSchedule)`
- `useScheduleQueries(teacherId, weekDate, hasScheduleManageTeacher)` — `skip: !hasScheduleManageTeacher`
- Line 491: `useScheduleQueries(teacherId, selectedWeekDate, permissions.hasScheduleManageTeacher)`

**Note:** Check if `isAdmin` is exposed on the `TeacherWeeklyScheduleViewModel` interface and consumed by tier views. If so, rename to `hasScheduleManageTeacher` in the ViewModel interface and all tier view consumers.

- [ ] 2.5 Update `useTeacherWeeklyScheduleViewModel.ts` — replace `isAdmin`/`StaffViewDirectory` with `hasScheduleManageTeacher`/`TeachersManageSchedule`
  - Quality loop: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleViewModel.ts --lifecycle codescene`
  - **AGENTS.md:** `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`

### 2F. `resolveTeacherId` backend helper — Add `TeachersManageSchedule`

**File:** `backend/services/schedule/__shared__/resolveTeacherId.ts` (lines 24-27)

**Current:**
```typescript
const isAdmin = await PermissionsService.hasAnyPermission(userId, [
  AppPermission.STAFF_VIEW_DIRECTORY,
  AppPermission.SCHEDULE_VIEW_ALL,
]);
```

**New:**
```typescript
const isAdmin = await PermissionsService.hasAnyPermission(userId, [
  AppPermission.STAFF_VIEW_DIRECTORY,
  AppPermission.SCHEDULE_VIEW_ALL,
  AppPermission.TEACHERS_MANAGE_SCHEDULE,
]);
```

- [ ] 2.6 Update `backend/services/schedule/__shared__/resolveTeacherId.ts` — add `TEACHERS_MANAGE_SCHEDULE` to admin permission check
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/services/schedule/__shared__/resolveTeacherId.ts --lifecycle codescene`
  - **AGENTS.md:** `backend/services/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`

### 2G. Storybook fixture — Update `StaffViewDirectory` to `TeachersList`

**File:** `frontend/common/views/dashboard/admin/parents/students/StudentsContainer.stories.tsx` (line 86)

**Current:** `AppPermission.StaffViewDirectory,`
**New:** `AppPermission.TeachersList,`

- [ ] 2.7 Update `StudentsContainer.stories.tsx` — replace `StaffViewDirectory` with `TeachersList`
  - Quality loop: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/admin/parents/students/StudentsContainer.stories.tsx --lifecycle codescene`

- [ ] 2.8 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/2-outcome.md`

---

## Phase 3: Backend — System Group Permission Bundle Editing (Superadmin-Only)

**Goal:** Allow `updateGroup` to modify the `permissionIds` of system groups while silently ignoring `name`/`slug`/`description` changes. Keep `deleteGroup` blocked for system groups. Only superadmin can access this (via `requireManageAccess` which checks `isSuperAdmin || hasPermission(PERMISSION_GROUPS_MANAGE)` — no non-superadmin group has `PERMISSION_GROUPS_MANAGE`).

### 3.1 `backend/db/repo/permissions/permission-management.repository.ts` — `updateGroup` method (lines 338-410)

**Current (lines 352-354):** `if (existing.isSystem) throw new Error(cannotModifySystemPermissionGroup)` — blocks ALL updates to system groups

**New:** Replace the throw with conditional logic:
- System group + `permissionIds` provided → replace permission bundle only (delete old + insert new), skip name/slug/description update
- System group + `permissionIds` undefined → return existing group as-is (no-op)
- System group + only name/description → return existing group as-is (silently ignore)
- Non-system group → existing behavior (lines 356-399) unchanged

Keep `deleteGroup` (lines 415-431) `isSystem` guard at line 425-427 unchanged — system groups cannot be deleted.

- [ ] 3.1 Update `backend/db/repo/permissions/permission-management.repository.ts` — `updateGroup` method
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/db/repo/permissions/permission-management.repository.ts --lifecycle codescene`
  - **AGENTS.md:** `backend/db/repo/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`

### 3.2 `backend/services/auth/permission-management.service.ts` — `updateGroup` method (lines 289-319)

**Current:** Calls `validateGroupName(input.name)` when `input.name` is provided; frontend always sends `name` even for permission-only updates.

**New:** Fetch the group first to check `isSystem`; skip `validateGroupName` for system groups; pass `name: undefined` and `description: undefined` for system groups so repository keeps existing values.

- [ ] 3.2 Update `backend/services/auth/permission-management.service.ts` — `updateGroup` method
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/services/auth/permission-management.service.ts --lifecycle codescene`
  - **AGENTS.md:** `backend/services/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`

### 3.3 Update test: `backend/db/test/logic/permissions/permission-management.service.test.ts`

- **Change** test at lines 306-312 (expects `updateGroup` on system group to throw `cannotModifySystemPermissionGroup`):
  - New: call `updateGroup` with `permissionIds` → expect SUCCESS — verify permission was added
- **Add** test: `updateGroup` on system group with `name` change → succeeds but name NOT changed (silently ignored)
- **Add** test: `updateGroup` on system group with `permissionIds: []` → succeeds and clears all permissions
- **Keep** test at lines 314-318 (deleteGroup on system group → throws `cannotDeleteSystemPermissionGroup`)
- Run: `bun run scripts/run-test/run-test.ts backend/db/test/logic/permissions/permission-management.service.test.ts`
  - **AGENTS.md:** `backend/db/test/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`, `tests.instructions.md`

- [ ] 3.3 Update test file
- [ ] 3.4 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/3-outcome.md`

---

## Phase 4: Frontend — Enable Permission Editing for System Groups (Superadmin-Only UI)

**Goal:** The Permission Management UI should allow editing the permission bundle of system groups (Add/Revoke permissions) but not renaming/deleting them. Only superadmin sees this UI (no `academy_admin` access to permissions panel).

### Affected components (10 changes):

| # | File | Line | Current behavior | New behavior |
|---|------|------|-----------------|--------------|
| 4.1 | `__shared__/singleGroupHeaderShared.tsx` | 154 | Edit button hidden when `isSystem` | Show Edit button for all groups |
| 4.2 | `__shared__/singleGroupViewShared.tsx` | 82-84 | "Add Permissions" tab hidden when `isSystem` | Show tab for all groups |
| 4.3 | `__shared__/singleGroupViewShared.tsx` | 113 | AddPermissionsTab content hidden when `isSystem` | Show content for all groups |
| 4.4 | `__shared__/currentPermissionsTabShared.tsx` | 27 | "Assign First Permission" button hidden when `isSystem` | Show button for all groups |
| 4.5 | `desktop/.../permissionGroupsDataGrid.desktop.tsx` | 66 | Edit menu item disabled when `isSystem` | Enable Edit for all groups |
| 4.6 | `desktop/.../permissionGroupsDataGrid.desktop.tsx` | 74 | Delete menu item disabled when `isSystem` | Keep disabled (system groups cannot be deleted) |
| 4.7 | `mobile/.../permissionGroupCardList.mobile.tsx` | 84 | Edit menu item disabled when `isSystem` | Enable Edit for all groups |
| 4.8 | `mobile/.../permissionGroupCardList.mobile.tsx` | 92 | Delete menu item disabled when `isSystem` | Keep disabled |
| 4.9 | `mobile/.../currentPermissionsTab.mobile.tsx` | 61 | Revoke button hidden when `isSystem` | Show Revoke button for all groups |
| 4.10 | `permissionGroupForm.types.ts` + `permissionGroupFormShared.tsx` | — | name/description editable for all | Pass `isSystem` flag; disable name/description fields when `isSystem` |

- [ ] 4.1-4.9 Remove `isSystem` guards (keep Delete disabled for system groups)
- [ ] 4.10 Pass `isSystem` flag from `PermissionGroupFormShared` to `PermissionGroupFormContentShared`; add `readonly isSystem: boolean` to `PermissionGroupFormContentProps`; change `disabled={isLoading}` to `disabled={isLoading || isSystem}` on name and description `LocalizedStringFormField` components
- Each file: Quality loop `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
  - **AGENTS.md:** `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`

- [ ] 4.11 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/4-outcome.md`

---

## Phase 5: GraphQL — Fix `superAdmin` authScopes (Blocker B)

### 5A. `student-lifecycle.pothos.ts` — Fix `reassignStudentTeacher` and `changeStudentStatus`

**File:** `backend/graphql/pothos/students/student-lifecycle.pothos.ts`

| Line | Mutation | Current authScope | New authScope |
|------|----------|-------------------|--------------|
| 36 | `reassignStudentTeacher` | `{ superAdmin: true }` | `{ permission: AppPermission.STUDENT_REASSIGN_TEACHER }` |
| 58 | `changeStudentStatus` | `{ superAdmin: true }` | `{ permission: AppPermission.STUDENT_MANAGE_STATUS }` |

- [ ] 5.1 Update `backend/graphql/pothos/students/student-lifecycle.pothos.ts`
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/graphql/pothos/students/student-lifecycle.pothos.ts --lifecycle codescene`
  - **AGENTS.md:** `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`

### 5B. `parent-profile.pothos.ts` — Fix `updateStudentQuota`

**File:** `backend/graphql/pothos/parents/parent-profile.pothos.ts` (line 189)

**Current:** `authScopes: { superAdmin: true }`
**New:** `authScopes: { permission: AppPermission.STUDENT_QUOTA_EDIT_EDIT_OTHER }`

**Rationale:** The supervisor has `student.student_quota_edit.edit_other` (granted in Phase 1B). The `superAdmin: true` authScope blocks all non-superadmin users.

**Note:** Verify the exact enum name in `backend/enum/permissions/permission.enum.ts` — it should be `STUDENT_QUOTA_EDIT_EDIT_OTHER`.

- [ ] 5.2 Update `backend/graphql/pothos/parents/parent-profile.pothos.ts` — change `updateStudentQuota` authScope
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/graphql/pothos/parents/parent-profile.pothos.ts --lifecycle codescene`

### 5C. GraphQL tests

- [ ] 5.3 Update `frontend/common/graphql/test/students/student-lifecycle.test.ts`
  - Add: supervisor with `STUDENT_REASSIGN_TEACHER` CAN reassign — succeeds
  - Add: supervisor with `STUDENT_MANAGE_STATUS` CAN change status — succeeds
  - Update: academy_admin with `STUDENT_REASSIGN_TEACHER` CAN reassign (no longer denied)
  - Keep: teacher/parent/other roles still denied
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/students/student-lifecycle.test.ts`
  - **AGENTS.md:** `frontend/common/graphql/AGENTS.md`
  - **Instructions:** `tests.instructions.md`

- [ ] 5.4 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/5-outcome.md`

---

## Phase 6: Frontend Navigation — Fix Supervisor Nav Overrides (Blocker A)

**Goal:** Remove the hardcoded hiding of teacher/student/parent nav items from supervisors. Keep staff hidden.

### 6A. Fix `applySupervisorNavOverrides`

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts` (lines 1008-1041)

**Current `hiddenKeys` set (lines 1017-1039):**
```typescript
const hiddenKeys = new Set([
  "home",
  "own-profile",
  "search-schedule",
  "schedule-tracking",
  "schedule",
  "teachers",    // ← REMOVE
  "students",    // ← REMOVE
  "parents",     // ← REMOVE
  "managers",
  "resources",
  "subjects",
  "books-and-bags",
  "reports",
  "billing-admin",
  "payment-catalogs",
  "feedback-manage",
  "dst-migration",
  "cron",
  "permissions",
  "settings",
  "whatsapp-settings",
]);
```

**New `hiddenKeys` set:**
```typescript
const hiddenKeys = new Set([
  "home",
  "own-profile",
  "search-schedule",
  "schedule-tracking",
  "schedule",
  "managers",
  "resources",
  "subjects",
  "books-and-bags",
  "reports",
  "billing-admin",
  "payment-catalogs",
  "feedback-manage",
  "dst-migration",
  "cron",
  "permissions",
  "settings",
  "whatsapp-settings",
]);
```

**Changes:**
- Remove `"teachers"` — supervisor has `TeachersList`, should see teachers nav item
- Remove `"students"` — supervisor has `StudentsList`, should see students nav item
- Remove `"parents"` — supervisor has `ParentViewDirectory` (newly granted), should see parents nav item
- Keep `"managers"` — staff/manager management, supervisor should NOT see
- Keep all other admin-only items

**Note:** `"staff"` is NOT in the `hiddenKeys` set because the `staff` nav item is already filtered out by permission-based filtering (`PAGE_PERMISSIONS.staff` = `[StaffViewDirectory]` which supervisor lacks). The `applySupervisorNavOverrides` function runs AFTER permission filtering, so items already filtered by permission won't be in the `items` array. However, to be safe, verify that `"staff"` is not needed in the hide set — if the staff nav item somehow survives permission filtering, add `"staff"` to the hide set.

- [ ] 6.1 Fix `applySupervisorNavOverrides` — remove `teachers`, `students`, `parents` from hide set; verify `staff` is filtered by permission (add to hide set if needed)
  - Quality loop: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`
  - **AGENTS.md:** `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`

- [ ] 6.2 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/6-outcome.md`

---

## Phase 7: Navigation Tests

> **⚠️ These tests are WRITTEN but NEVER RUN. Do not execute `bun run test:ui:components` or any UI test runner.**

### 7A. Supervisor navigation test

**File:** `test/ui/components/supervisorNavigationConfig.test.ts`

- [ ] 7.1 Update `SUPERVISOR_PERMISSIONS` array — add:
  - `AppPermission.TeachersCreate`
  - `AppPermission.TeachersEdit`
  - `AppPermission.TeachersManageSchedule`
  - `AppPermission.StudentsCreate`
  - `AppPermission.StudentsEdit`
  - `AppPermission.StudentReassignTeacher`
  - `AppPermission.StudentManageStatus`
  - `AppPermission.ParentsList`
  - `AppPermission.ParentsCreate`
  - `AppPermission.ParentsEdit`
  - `AppPermission.ParentViewDirectory`
  - `AppPermission.ParentManageStatus`
  - (Keep all existing permissions including `TeachersList`, `StudentsList`)

- [ ] 7.2 Change assertion: `expect(keys).not.toContain("students")` → `expect(keys).toContain("students")`
- [ ] 7.3 Add assertion: `expect(keys).toContain("teachers")`
- [ ] 7.4 Add assertion: `expect(keys).toContain("parents")`
- [ ] 7.5 Add assertion: `expect(keys).not.toContain("staff")` — supervisor lacks `StaffViewDirectory`
- [ ] 7.6 Keep `expect(keys).not.toContain("permissions")` (supervisor lacks `PermissionGroupsManage`)
- [ ] 7.7 **DO NOT RUN** these tests — write/update the test code only
  - Quality loop on test file
  - **AGENTS.md:** `test/ui/AGENTS.md`
  - **Instructions:** `tests.instructions.md`, `frontend.instructions.md`

### 7B. Academy admin navigation test

**File:** `test/ui/components/academyAdminNavigationConfig.test.ts`

- [ ] 7.8 Update `ACADEMY_ADMIN_PERMISSIONS` array — add:
  - `AppPermission.TeachersEdit`
  - `AppPermission.TeachersList`
  - `AppPermission.StudentsEdit`
  - (Keep all existing permissions)
  - **DO NOT add** `PermissionGroupsManage` or `PermissionGroupsAssign` — only superadmin manages permissions

- [ ] 7.9 Add assertion: `expect(keys).toContain("teachers")`
- [ ] 7.10 **DO NOT** add `expect(keys).toContain("permissions")` — academy_admin does NOT have `PermissionGroupsManage`
- [ ] 7.11 **DO NOT RUN** these tests — write/update the test code only
  - Quality loop on test file

- [ ] 7.12 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/7-outcome.md`

---

## Phase 8: GraphQL Codegen & Verification

- [ ] 8.1 Run `bun run generate:gqlSchema` — regenerate GraphQL schema from Pothos
- [ ] 8.2 Run `bun codegen` — regenerate TypeScript types from schema
- [ ] 8.3 Run `bun tsgo` — full type check (must be 0 errors)
- [ ] 8.4 Run `bun lint` — full lint (must be clean)
- [ ] 8.5 Run `bun biome:check` — format/lint check
- [ ] 8.6 Run `bun quality-gate` — full quality gate
- [ ] 8.7 Run permission management service tests:
  - `bun run scripts/run-test/run-test.ts backend/db/test/logic/permissions/permission-management.service.test.ts`
- [ ] 8.8 **DO NOT RUN** navigation tests — intentionally skipped
- [ ] 8.9 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/8-outcome.md`

---

## Phase 9: Verify Supervisor Access to Teacher/Student/Parent Pages

### Verification points (fix only if a guard is too restrictive):

- [ ] 9.1 Teachers directory page (`app/(dashboard)/teachers/page.tsx`) — gated on `[TEACHERS_LIST]` ✓ (fixed in Phase 2B)
- [ ] 9.2 Teacher onboarding page (`app/(dashboard)/teachers/onboarding/page.tsx`) — gated on `TEACHERS_CREATE` ✓ (supervisor has it)
- [ ] 9.3 Students directory page (`app/(dashboard)/students/page.tsx`) — `resolveStudentsPageAudience` checks `STUDENTS_LIST` ✓
- [ ] 9.4 Student onboarding page (`app/(dashboard)/students/onboarding/page.tsx`) — gated on `STUDENTS_CREATE` ✓
- [ ] 9.5 Parents directory page (`app/(dashboard)/parents/page.tsx`) — gated on `[PARENT_VIEW_DIRECTORY, PARENTS_LIST]` ✓ (supervisor has both)
- [ ] 9.6 Parent onboarding page (`app/(dashboard)/parents/onboarding/page.tsx`) — gated on `PARENTS_CREATE` ✓ (supervisor has it)
- [ ] 9.7 Parent lifecycle page (`app/(dashboard)/parents/[id]/lifecycle/page.tsx`) — uses `withPageAuth(null, ...)` (no permission gate) — verify service layer gates on `PARENT_MANAGE_STATUS` ✓
- [ ] 9.8 `/users` page — gated on `[TEACHERS_LIST, PARENT_VIEW_DIRECTORY, STUDENTS_LIST]` ✓ (supervisor has all three)
- [ ] 9.9 `/users` staff tab — gated on `PAGE_PERMISSIONS.usersStaff` = `[StaffViewDirectory]` — supervisor does NOT have it → staff tab NOT visible ✓
- [ ] 9.10 GraphQL mutations reachable by supervisors:
  - `reassignStudentTeacher` → `permission: AppPermission.STUDENT_REASSIGN_TEACHER` ✓ (fixed in Phase 5A)
  - `changeStudentStatus` → `permission: AppPermission.STUDENT_MANAGE_STATUS` ✓ (fixed in Phase 5A)
  - `updateStudentQuota` → `permission: AppPermission.STUDENT_QUOTA_EDIT_EDIT_OTHER` ✓ (fixed in Phase 5B)
  - `changeParentLifecycleStatus` → `permission: AppPermission.PARENT_MANAGE_STATUS` ✓ (supervisor has it)
  - `deactivateParent` → `permission: AppPermission.PARENT_MANAGE_STATUS` ✓
  - `reactivateParent` → `permission: AppPermission.PARENT_MANAGE_STATUS` ✓
  - `partiallyUpdateStudent` → `permission: AppPermission.STUDENTS_EDIT` ✓ (supervisor has it)
  - `deleteStudent` → `requireStudentManageStatus` checks `STUDENT_MANAGE_STATUS` ✓
- [ ] 9.11 If any guard uses hardcoded role checks instead of permission checks, fix to permission-based gating
  - Quality loop per modified file
- [ ] 9.12 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/9-outcome.md`

---

## Phase 10: Knowledge Propagation

- [ ] 10.1 Create `docs/auth/supervisor-permissions.md`
  - Document: supervisor permission model (full teacher/student/parent management)
  - Document: staff exclusion — supervisors have NO staff permissions (no `staff.view_directory`, no staff-audience field-ACL `edit_other`)
  - Document: field-ACL audience model — `core_identity`/`core_contact` are `ALL_AUDIENCES` (include STAFF), so `edit_other` is excluded for supervisor
  - Document: teacher page/nav gating on `TeachersList` (not `StaffViewDirectory`)
  - Document: permission management is superadmin-only (no `permission_groups.manage` for `academy_admin`)
  - Document: constraint that new teacher/student/parent permissions MUST be added to `supervisor_default` in `6-lms-permissions-and-groups.sql`
  - Document: system group editability (permission bundles editable by superadmin, name/slug/description immutable, delete blocked)
  - Document: GraphQL authScope pattern (`permission:` vs `superAdmin:`) — when to use each
  - Document: `applySupervisorNavOverrides` — must not override permission-based filtering for accessible items (teachers, students, parents); staff remains hidden

- [ ] 10.2 Update `backend/services/AGENTS.md`
  - Add note: system permission groups can have permission bundles edited via `updateGroup` (superadmin-only) but cannot be renamed/deleted
  - Add note: `resolveTeacherId` accepts `TEACHERS_MANAGE_SCHEDULE` as admin-level permission

- [ ] 10.3 Update `backend/graphql/AGENTS.md`
  - Add note: use `authScopes: { permission: AppPermission.X }` not `authScopes: { superAdmin: true }` for mutations accessible by non-superadmin users with the correct permission

- [ ] 10.4 Update root `AGENTS.md` Important References
  - Add `docs/auth/supervisor-permissions.md` reference

- [ ] 10.5 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/10-outcome.md`

---

## Summary of Changes from Original Plan

| Area | Original Plan | Revised Plan |
|------|---------------|--------------|
| Supervisor staff permissions | Granted `staff.view_directory` | **NOT granted** — staff excluded |
| Supervisor `core_identity.edit_other` | Granted | **NOT granted** — `ALL_AUDIENCES` includes STAFF |
| Supervisor `core_contact.edit_other` | Granted | **NOT granted** — `ALL_AUDIENCES` includes STAFF |
| Supervisor `staff_role.edit_other` | Granted | **NOT granted** — `audiences: [STAFF]` |
| Supervisor `staff_permissions.edit_other` | Granted | **NOT granted** — `audiences: [STAFF]` |
| Supervisor schedule permissions | Not included | **Added** — `schedule.view_weekly`, `schedule.view_workload`, `schedule.create_class`, `schedule.delete_class`, `schedule.clear_weekly` (needed for teacher weekly schedule management) |
| Supervisor parent permissions | Not included | **Added** — `parents.list/create/edit`, `parent.view_directory`, `parent.manage_status` + parent field-ACL `edit_other` |
| `academy_admin` `permission_groups.manage` | Granted (Blocker C) | **NOT granted** — superadmin-only |
| `academy_admin` `permission_groups.assign` | Granted (Blocker C) | **NOT granted** — superadmin-only |
| `/teachers` page gate | `[STAFF_VIEW_DIRECTORY, TEACHERS_LIST]` | `[TEACHERS_LIST]` only |
| `teachers` nav item gate | `[StaffViewDirectory]` | `[TeachersList]` |
| `usersTeachers` tab gate | `[StaffViewDirectory, TeachersList]` | `[TeachersList]` |
| `usersDirectoryParent` gate | `[StaffViewDirectory, ParentViewDirectory, StudentsList]` | `[TeachersList, ParentViewDirectory, StudentsList]` |
| `grp_users` nav group | `StaffViewDirectory` in permission array | `TeachersList` in permission array |
| Weekly schedule `isAdmin` | `hasPermission(StaffViewDirectory)` | `hasPermission(TeachersManageSchedule)` |
| `resolveTeacherId` | `StaffViewDirectory` OR `ScheduleViewAll` | + `TeachersManageSchedule` |
| Supervisor nav hide set | Remove `teachers`, `students`, `permissions` | Remove `teachers`, `students`, `parents`; keep `staff` hidden |
| `updateStudentQuota` authScope | Not addressed | `superAdmin: true` → `permission: STUDENT_QUOTA_EDIT_EDIT_OTHER` |
| Migration execution | `bun db migrate` (single) | `bun db migrate --env-file <file>` for each `.env*` file |
| Academy admin nav test | Expected `permissions` key visible | **NOT expected** — academy_admin lacks `PermissionGroupsManage` |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Removing `StaffViewDirectory` from teacher page may block staff who need teacher access | Staff who need teacher access should also have `TeachersList`; verify `academy_admin` has `teachers.list` (added in Phase 1C) |
| Supervisor lacking `schedule.view_weekly` may block weekly schedule access | **Resolved** — `schedule.view_weekly` + `schedule.view_workload` + `schedule.create_class` + `schedule.delete_class` + `schedule.clear_weekly` added to supervisor grants in Phase 1A |
| Supervisor has `view_other` for `core_identity`/`core_contact`/`staff_role`/`staff_permissions` but NOT `edit_other` | Intended — supervisor can VIEW staff profile fields (existing behavior, backward-compatible) but cannot EDIT them. This is a deliberate asymmetry. |
| In-place migration edit may not re-apply on existing databases | `ON CONFLICT DO NOTHING` ensures idempotency; running for each `.env*` file covers all databases |
| System group editability could allow privilege escalation | Only superadmin can access (no `PERMISSION_GROUPS_MANAGE` granted to any non-superadmin group); name/slug immutable; delete blocked |
| `applySupervisorNavOverrides` removal may show items supervisor shouldn't see | Permission-based filtering controls visibility; staff filtered by `StaffViewDirectory` (supervisor lacks) |

---

## Validation Plan

1. **Migration**: Query `supervisor_default` group permissions after applying migration — verify all new permissions present (16 non-field-ACL + 17 field-ACL `edit_other`). Query `academy_admin` — verify 5 new permissions present. Verify `staff.view_directory` is NOT in `supervisor_default`. Verify `permission_groups.manage` and `permission_groups.assign` are NOT in `academy_admin`. Verify `profile.core_identity.edit_other`, `profile.core_contact.edit_other`, `profile.staff_role.edit_other`, `profile.staff_permissions.edit_other` are NOT in `supervisor_default`.
2. **Backend tests**: `updateGroup` on system group with `permissionIds` succeeds; with `name` succeeds but name unchanged; `deleteGroup` on system group still throws.
3. **Frontend**: Permission Management UI shows Edit button + Add Permissions tab for system groups (superadmin only); name/description fields read-only in edit dialog; Revoke button visible for system groups.
4. **Navigation**: Supervisor sees `teachers`, `students`, `parents` in sidebar. Supervisor does NOT see `staff` in sidebar. Academy admin sees `teachers` in sidebar but does NOT see `permissions` panel. **Note: Navigation/UI tests are WRITTEN but NEVER RUN.**
5. **Users directory**: Supervisor can access `/users` page; teachers, parents, students tabs visible; staff tab NOT visible.
6. **E2E**: Supervisor can access teachers/students/parents directory, create, edit, and profile pages; can reassign teachers, change student status, edit student quotas, change parent lifecycle status via GraphQL mutations. Supervisor CANNOT edit staff profiles (no `core_identity.edit_other`, no `staff_role.edit_other`).

---

## Phase Dependency Graph

```
Phase 0 (Baseline) → Phase 1 (Migrations) → Phase 2 (Teacher gating fix)
                                                ↓
                          Phase 3 (Backend system group editing)
                                                ↓
                          Phase 4 (Frontend system group UI)
                                                ↓
Phase 5 (GraphQL authScopes) ←── independent ──→ Phase 6 (Nav overrides)
                                                ↓
                          Phase 7 (Navigation tests)
                                                ↓
                          Phase 8 (Codegen + verification)
                                                ↓
                          Phase 9 (Page access verification)
                                                ↓
                          Phase 10 (Knowledge propagation)
```

Phases 5 and 6 can run in parallel with Phase 3/4 (different files). Phase 8 must come after all code changes. Phase 1D (migration execution) must come after all SQL edits (1A-1C).
