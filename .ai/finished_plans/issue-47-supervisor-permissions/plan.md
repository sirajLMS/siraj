# Reconciled Plan: Issue #47 — Supervisor Permissions & Manager ACL Customization

**GitHub Issue:** [#47](https://github.com/sirajLMS/siraj/issues/47)
**Source Plans:**
- `.kilo/plans/1786716293839-supervisor-permissions-manager-acl.md` (user-authored, 6 phases)
- Deep investigation findings (3 parallel background agents — services/GraphQL, frontend/nav, migrations/translations)

## Overview

Two changes:
1. **Supervisor permissions expansion**: Grant `supervisor_default` group full operational management over Teachers and Students (list, create, edit, view/edit profiles, manage schedules/dues, reassign teachers, change student status, edit student identity/academic fields).
2. **System group ACL customization**: Lift the `isSystem` immutability restriction so academy admins can customize permission bundles for `supervisor_default` and `academy_admin` via the Permission Management UI. System groups cannot be renamed, slug-changed, or deleted — only their `permissionIds` bundle is editable.

> **⚠️ CRITICAL: DO NOT RUN UI TESTS**
> UI tests (`bun run test:ui:components`, `bun run test:ui`, navigation tests in `test/ui/`) MUST be written/updated as part of this implementation but MUST NEVER be run or executed. Write the test code, update fixtures and assertions — but do NOT execute the test runner.

### Three Critical Blockers (discovered in deep investigation, NOT in `.kilo` plan)

These must be fixed for the feature to actually work end-to-end:

| # | Blocker | File | Root Cause | Fix |
|---|---------|------|-----------|-----|
| A | `applySupervisorNavOverrides` hardcodes hiding nav items | `frontend/common/views/dashboard/config/navigationConfig.ts:1008-1041` | Unconditionally hides `teachers`, `students`, `permissions` from "pure supervisor portal users" (has `SupervisorViewDashboard` AND NOT `DashboardViewMetrics`) — runs AFTER permission filtering, overriding it | Remove these items from unconditional hide set; let permission-based filtering control visibility |
| B | GraphQL `superAdmin: true` authScopes block supervisors | `backend/graphql/pothos/students/student-lifecycle.pothos.ts:36,58` | `reassignStudentTeacher` and `changeStudentStatus` use `authScopes: { superAdmin: true }` — only passes for `users.isSuperAdmin = true`, blocks all non-superadmin users including supervisors with the correct permission | Change to `authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER }` and `{ permission: AppPermission.STUDENT_MANAGE_STATUS }` |
| C | Academy admin missing `permission_groups.manage` | `backend/db/migration/3-system_permissions_and_groups.sql:1292-1358` | `requireManageAccess` (service line 63) checks `PERMISSION_GROUPS_MANAGE`; academy_admin doesn't have it → Phase 2/3 system-group-editing feature is unreachable for academy admins | Add `permission_groups.manage`, `permission_groups.assign`, `teachers.edit`, `students.edit`, `students.change_teacher`, `students.change_status`, `teachers.list` to the `academy_admin` block in migration 3 |

### Additional Bug (found in investigation)

| # | Bug | File | Fix |
|---|-----|------|-----|
| D | `PAGE_PERMISSIONS.teachers` missing `TeachersList` | `frontend/common/types/page-permissions.types.ts:50` | Currently `[StaffViewDirectory]` only — supervisor has `StaffViewDirectory` but academy_admin doesn't have `TeachersList`, so both can reach the page but for wrong reasons. Should be `[StaffViewDirectory, TeachersList]` (OR-logic, either suffices) |

---

## CRITICAL CONSTRAINT (from user)

> **The existing SQL migration files MUST be updated in-place — NOT new migrations.** The user explicitly requires modifying the existing migration files. Add a comment block noting that supervisors are granted ALL current and future teacher/student management permissions.

### Migration Auto-Bundler Note (correction to `.kilo` plan)

The `.kilo` plan says to manually update Drizzle mirror folders. However, `applyCustomMigrations.ts` auto-generates new Drizzle migration folders from raw SQL files when their SHA-256 hash changes. **Do NOT manually edit existing Drizzle mirror folders.** Only modify the raw SQL files in `backend/db/migration/`, then run `bun db migrate` — the auto-bundler creates new timestamped Drizzle folders automatically.

---

## Phase 0: Pre-Implementation Baseline

- [ ] 0.1 Record baseline: `bun tsgo 2>&1 | grep "error TS" | wc -l`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id baseline`
- [ ] 0.2 Create `.ai/plans/issue-47-supervisor-permissions/outcome/` directory
- [ ] 0.3 Write baseline outcome file

---

## Phase 1: Database Migrations — Grant Permissions (In-Place Edits)

### 1A. `supervisor_default` non-field-ACL permissions → `6-lms-permissions-and-groups.sql`

**File:** `backend/db/migration/6-lms-permissions-and-groups.sql`
**Target:** `supervisor_default` block (lines 205-227) — `p.key IN (...)` clause

Add comment block above the INSERT (before line 200):
```sql
-- IMPORTANT: Supervisors are granted ALL current and future teacher/student management permissions.
-- Any new teacher/student management permission MUST be added to this group.
```

Append to `p.key IN (...)`:
```
'teachers.create',
'teachers.edit',
'teachers.manage_schedule',
'students.create',
'students.edit',
'student.reassign_teacher',
'student.manage_status',
'staff.view_directory'
```

### 1B. `supervisor_default` field-ACL `edit_other` permissions → `6d-profile-fine-grained-only.sql`

**File:** `backend/db/migration/6d-profile-fine-grained-only.sql`
**Target:** `supervisor_default` block (lines 305-331) — `p.key IN (...)` clause

Append ONLY for field groups where supervisor already has `view_other`:
```
'profile.core_identity.edit_other',
'profile.core_contact.edit_other',
'profile.teacher_professional.edit_other',
'profile.teacher_identity.edit_other',
'profile.parent_social.edit_other',
'profile.parent_identity.edit_other',
'profile.parent_billing.edit_other',
'profile.parent_account.edit_other',
'profile.parent_students.edit_other',
'profile.teacher_students.edit_other',
'profile.staff_role.edit_other',
'profile.staff_permissions.edit_other',
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

**Note:** `profile.core_status.edit_other` is NOT added — supervisor doesn't have `view_other` for `core_status`.

### 1C. `academy_admin` permissions → `3-system_permissions_and_groups.sql` (Blocker C fix)

**File:** `backend/db/migration/3-system_permissions_and-groups.sql`
**Target:** `academy_admin` block (lines 1292-1358) — `p.key IN (...)` clause

Append:
```
'permission_groups.manage',
'permission_groups.assign',
'teachers.edit',
'students.edit',
'students.change_teacher',
'students.change_status',
'teachers.list'
```

### Tasks

- [ ] 1.1 Update `backend/db/migration/6-lms-permissions-and-groups.sql` (1A permissions + comment)
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
- [ ] 1.2 Update `backend/db/migration/6d-profile-fine-grained-only.sql` (1B edit_other permissions)
  - Quality loop
- [ ] 1.3 Update `backend/db/migration/3-system_permissions_and_groups.sql` (1C academy_admin grants)
  - Quality loop
- [ ] 1.4 Run `bun db migrate` — auto-bundler generates new Drizzle mirror folders from changed SQL files
  - Verify new timestamped folders appear under `backend/drizzle/`
  - Do NOT manually edit existing Drizzle mirror folders
- [ ] 1.5 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/1-outcome.md`

---

## Phase 2: Backend — Allow System Group Permission Bundle Editing

**Goal:** Allow `updateGroup` to modify the `permissionIds` of system groups while silently ignoring `name`/`slug`/`description` changes. Keep `deleteGroup` blocked for system groups.

### Key architecture insight:
The frontend `handleUpdateGroup` (`usePermissionManagementData.ts:194`) always sends `name`, `description`, AND `permissionIds` — even for the "Add Permissions" / "Revoke Permission" flows (which go through `handleAssignPermissions` / `handleRevokePermission` in `useGroupMutationActions.ts`). The `name` and `description` are the group's existing values (passed through). So the backend must **silently ignore** `name`/`description` for system groups rather than throwing.

### Files to modify:

- [ ] 2.1 `backend/db/repo/permissions/permission-management.repository.ts` — `updateGroup` method (lines 338-410)
  - **Current:** Lines 352-354: `if (existing.isSystem) throw new Error(cannotModifySystemPermissionGroup)` — blocks ALL updates to system groups
  - **New:** Replace the throw with conditional logic:
    ```typescript
    if (existing.isSystem) {
      // System groups: only permissionIds can be updated; name/slug/description are immutable
      if (input.permissionIds === undefined) {
        // Nothing to update — return existing group as-is
        const gpList = await t.select().from(groupPermissions).where(eq(groupPermissions.groupId, input.id));
        return toGroupReturn(existing, gpList.map(gp => gp.permissionId), locale);
      }
      // Skip name/slug/description update; only replace permissionIds
      await t.delete(groupPermissions).where(eq(groupPermissions.groupId, input.id));
      if (input.permissionIds.length > 0) {
        await t.insert(groupPermissions).values(
          input.permissionIds.map(permissionId => ({ groupId: input.id, permissionId }))
        );
      }
      const gpList = await t.select().from(groupPermissions).where(eq(groupPermissions.groupId, input.id));
      return toGroupReturn(existing, gpList.map(gp => gp.permissionId), locale);
    }
    // Non-system: existing behavior (lines 356-399) continues unchanged
    ```
  - Keep `deleteGroup` (lines 415-431) `isSystem` guard at line 425-427 unchanged — system groups cannot be deleted
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 2.2 `backend/services/auth/permission-management.service.ts` — `updateGroup` method (lines 289-319)
  - **Current:** Lines 304-307: when `input.name` is provided, calls `validateGroupName(input.name, tErrors)` which derives a slug. The frontend always sends `name` (the existing name) even for permission-only updates.
  - **New:** Fetch the group first to check `isSystem`, then skip `validateGroupName` for system groups:
    ```typescript
    export async function updateGroup(actorUserId, input, tErrors, locale) {
      await requireManageAccess(actorUserId, tErrors);

      const group = await requireGroupExists(input.groupId, tErrors);

      let slug: string | undefined;
      if (input.name !== undefined && !group.isSystem) {
        const validated = await validateGroupName(input.name, tErrors);
        slug = validated.slug;
      }

      return PermissionManagementRepository.updateGroup(
        {
          id: input.groupId,
          name: group.isSystem ? undefined : input.name,
          slug,
          description: group.isSystem ? undefined : trimLocalizedString(input.description),
          permissionIds: input.permissionIds,
        },
        locale
      );
    }
    ```
  - This uses the existing `requireGroupExists` helper (line 97-101) which calls `PermissionManagementRepository.getGroupById`
  - For system groups: `name`, `slug`, and `description` are all `undefined` — the repository keeps existing values
  - For non-system groups: unchanged behavior
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 2.3 Update existing test: `backend/db/test/logic/permissions/permission-management.service.test.ts`
  - **Change** test at lines 306-312 ("updateGroup on system group should throw cannotModifySystemPermissionGroup"):
    - Currently calls `updateGroup(adminUser.id, { groupId, name: loc("New System Name") }, tErrors, "ar")` and expects throw
    - New: call `updateGroup(adminUser.id, { groupId, permissionIds: [<some_perm_id>] }, tErrors, "ar")` and expect SUCCESS — verify the permission was added
  - **Add** test: `updateGroup` on system group with `name` change — succeeds but name is NOT changed (silently ignored). Verify group name remains the original system name.
  - **Add** test: `updateGroup` on system group with `permissionIds: []` (empty array) — succeeds and clears all permissions from the system group
  - **Keep** test at lines 314-318 ("deleteGroup on system group should throw cannotDeleteSystemPermissionGroup") — delete still blocked
  - Note: `testSystemGroupGuard` helper (lines 77-88) uses `assertThrows` — the changed test must use a different pattern (direct call + assert success) since it no longer expects a throw
  - Run: `bun run scripts/run-test/run-test.ts backend/db/test/logic/permissions/permission-management.service.test.ts`

- [ ] 2.4 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/2-outcome.md`

---

## Phase 3: Frontend — Enable Permission Editing for System Groups

**Goal:** The Permission Management UI should allow editing the permission bundle of system groups (Add/Revoke permissions) but not renaming/deleting them.

### Current frontend restrictions on system groups (all must be changed):

| # | File | Line | Current behavior | New behavior |
|---|------|------|-----------------|--------------|
| 3.1 | `__shared__/singleGroupHeaderShared.tsx` | 154 | Edit button hidden when `isSystem` | Show Edit button for all groups |
| 3.2 | `__shared__/singleGroupViewShared.tsx` | 82-84 | "Add Permissions" tab hidden when `isSystem` | Show tab for all groups |
| 3.3 | `__shared__/singleGroupViewShared.tsx` | 113 | AddPermissionsTab content hidden when `isSystem` | Show content for all groups |
| 3.4 | `__shared__/currentPermissionsTabShared.tsx` | 27 | "Assign First Permission" button hidden when `isSystem` | Show button for all groups |
| 3.5 | `desktop/.../permissionGroupsDataGrid.desktop.tsx` | 66 | Edit menu item disabled when `isSystem` | Enable Edit for all groups |
| 3.6 | `desktop/.../permissionGroupsDataGrid.desktop.tsx` | 74 | Delete menu item disabled when `isSystem` | Keep disabled (system groups cannot be deleted) |
| 3.7 | `mobile/.../permissionGroupCardList.mobile.tsx` | 84 | Edit menu item disabled when `isSystem` | Enable Edit for all groups |
| 3.8 | `mobile/.../permissionGroupCardList.mobile.tsx` | 92 | Delete menu item disabled when `isSystem` | Keep disabled |
| 3.9 | `mobile/.../currentPermissionsTab.mobile.tsx` | 61 | Revoke button hidden when `isSystem` | Show Revoke button for all groups |

### Edit dialog form — make name/description read-only for system groups:

The edit dialog (`permissionGroupFormShared.tsx`) renders `name` (line 124-131) and `description` (line 134-142) via `LocalizedStringFormField` with `disabled={isLoading}`. For system groups, these fields should be disabled (read-only). The `group` prop is available in `PermissionGroupFormShared` (line 178) but NOT passed to `PermissionGroupFormContentShared`.

- [ ] 3.10 Pass `isSystem` flag from `PermissionGroupFormShared` to `PermissionGroupFormContentShared`
  - Add `readonly isSystem: boolean` to `PermissionGroupFormContentProps` in `permissionGroupForm.types.ts`
  - Pass `isSystem={!!group?.isSystem}` from `PermissionGroupFormShared` to `PermissionGroupFormContentShared`
  - In `PermissionGroupFormContentShared`, change `disabled={isLoading}` to `disabled={isLoading || isSystem}` on both `LocalizedStringFormField` components (name and description)
  - Quality loop per file

- [ ] 3.11 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/3-outcome.md`

---

## Phase 4: GraphQL — Fix `superAdmin` authScopes (Blocker B)

**Goal:** Replace `superAdmin: true` authScopes with permission-based authScopes so supervisors with the correct permissions can execute these mutations.

### Files to modify:

- [ ] 4.1 `backend/graphql/pothos/students/student-lifecycle.pothos.ts`
  - Line 36: `reassignStudentTeacher` — change `authScopes: { superAdmin: true }` → `authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER }`
  - Line 58: `changeStudentStatus` — change `authScopes: { superAdmin: true }` → `authScopes: { permission: AppPermission.STUDENT_MANAGE_STATUS }`
  - Verify `AppPermission` is imported as a value (not type-only)
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
  - **AGENTS.md:** `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`

### Why this works:
The `permission` authScope (defined in `gqlSchemaBuilder.ts:111`) passes for `ctx.isSuperAdmin || ctx.permissions.includes(key)`. So:
- SuperAdmin → passes (unchanged behavior)
- Supervisor with `STUDENT_REASSIGN_TEACHER` permission → passes (new — was blocked before)
- Any other user without the permission → blocked (correct)

- [ ] 4.2 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/4-outcome.md`

---

## Phase 5: Frontend Navigation — Fix Supervisor Nav Overrides (Blocker A + Bug D)

**Goal:** Remove the hardcoded hiding of teacher/student/permission nav items from supervisors, and fix the `PAGE_PERMISSIONS.teachers` bug.

### 5A. Fix `applySupervisorNavOverrides` (Blocker A)

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts`

**Current behavior (lines 1008-1041):**
- `isSupervisorPortalUser` (lines 1001-1006): returns `true` if user has `SupervisorViewDashboard` AND NOT `DashboardViewMetrics`
- `applySupervisorNavOverrides` (lines 1008-1041): runs AFTER `getNavItemsForPermissions` filtering, then unconditionally hides `teachers`, `students`, `permissions`, and other items from supervisor portal users

**New behavior:**
- Remove `teachers`, `students`, `permissions` from the unconditional hide set
- Let `getNavItemsForPermissions` (which already filters by permission) control their visibility
- Keep other supervisor overrides (e.g., hiding `staff` if appropriate, dashboard metrics override)
- The function should only hide items that are genuinely supervisor-inappropriate regardless of permissions

**Implementation:**
- Inspect the full `applySupervisorNavOverrides` function (lines 1008-1041) to see the exact hide set
- Remove `teachers`, `students`, `permissions` keys from the hardcoded hide set
- Keep the rest of the function intact (other overrides may be valid)

- [ ] 5.1 Fix `applySupervisorNavOverrides` — remove `teachers`, `students`, `permissions` from hide set
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
  - **AGENTS.md:** `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`

### 5B. Fix `PAGE_PERMISSIONS.teachers` bug (Bug D)

**File:** `frontend/common/types/page-permissions.types.ts`

**Current (line 50):** `teachers: [AppPermission.StaffViewDirectory]`
**New:** `teachers: [AppPermission.StaffViewDirectory, AppPermission.TeachersList]`

This matches the pattern used by `usersTeachers` (line 56): `[StaffViewDirectory, TeachersList]` — OR-logic, either permission suffices.

- [ ] 5.2 Fix `PAGE_PERMISSIONS.teachers` to include `TeachersList`
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 5.3 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/5-outcome.md`

---

## Phase 6: Navigation Tests

**Goal:** Update existing navigation test files to reflect the new supervisor/academy_admin permissions and verify correct nav item visibility.

> **⚠️ These tests are WRITTEN but NEVER RUN. Do not execute `bun run test:ui:components` or any UI test runner.**

### 6A. Supervisor navigation test

**File:** `test/ui/components/supervisorNavigationConfig.test.ts` (107 lines)

- [ ] 6.1 Update `SUPERVISOR_PERMISSIONS` array (lines 9-27) — add:
  - `AppPermission.StaffViewDirectory`
  - `AppPermission.TeachersCreate`
  - `AppPermission.TeachersEdit`
  - `AppPermission.StudentsCreate`
  - `AppPermission.StudentsEdit`
  - `AppPermission.StudentReassignTeacher`
  - `AppPermission.StudentManageStatus`
  - (Keep all existing permissions in the array)

- [ ] 6.2 Change assertion at line 47: `expect(keys).not.toContain("students")` → `expect(keys).toContain("students")`
- [ ] 6.3 Add assertion: `expect(keys).toContain("teachers")`
- [ ] 6.4 Verify `permissions` key is NOT expected (supervisor doesn't have `PermissionGroupsManage`)
  - If there's an existing `not.toContain("permissions")` assertion, keep it
- [ ] 6.5 **DO NOT RUN** these tests — write/update the test code only, never execute `bun run test:ui:components`
  - Quality loop on the test file

### 6B. Academy admin navigation test

**File:** `test/ui/components/academyAdminNavigationConfig.test.ts` (89 lines)

- [ ] 6.6 Update `ACADEMY_ADMIN_PERMISSIONS` array (lines 8-63) — add:
  - `AppPermission.PermissionGroupsManage`
  - `AppPermission.PermissionGroupsAssign`
  - `AppPermission.TeachersEdit`
  - `AppPermission.StudentsEdit`
  - `AppPermission.TeachersList`
  - (Keep all existing permissions)

- [ ] 6.7 Add assertion: `expect(keys).toContain("permissions")`
- [ ] 6.8 Add assertion: `expect(keys).toContain("teachers")`
  - (academy_admin now has `TeachersList` + `StaffViewDirectory`)
- [ ] 6.9 **DO NOT RUN** these tests — write/update the test code only, never execute `bun run test:ui:components`
  - Quality loop on the test file

- [ ] 6.10 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/6-outcome.md`

---

## Phase 7: GraphQL Codegen & Verification

**Goal:** Regenerate GraphQL schema and types after schema/document changes, verify full build.

- [ ] 7.1 Run `bun run generate:gqlSchema` — regenerate GraphQL schema from Pothos
- [ ] 7.2 Run `bun codegen` — regenerate TypeScript types from schema
- [ ] 7.3 Run `bun tsgo` — full type check (must be 0 errors)
- [ ] 7.4 Run `bun lint` — full lint (must be clean)
- [ ] 7.5 Run `bun biome:check` — format/lint check
- [ ] 7.6 Run `bun quality-gate` — full quality gate
- [ ] 7.7 Verify migration applies cleanly:
  - Run: `bun db migrate`
  - Query `supervisor_default` group permissions — verify all 29 new permissions present (8 non-field-ACL + 21 field-ACL `edit_other`)
  - Query `academy_admin` group permissions — verify 7 new permissions present
- [ ] 7.8 Run permission management service tests:
  - `bun run scripts/run-test/run-test.ts backend/db/test/logic/permissions/permission-management.service.test.ts`
- [ ] 7.9 **DO NOT RUN** navigation tests — this step is intentionally skipped. UI tests are never run during this implementation.
- [ ] 7.10 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/7-outcome.md`

---

## Phase 8: Verify Supervisor Access to Teacher/Student Pages

**Goal:** Confirm supervisors can access and use teacher/student directory, create, edit, and profile pages. Most should "just work" once the migration grants the permissions + nav overrides are fixed. Verify each guard is permission-based (not role-based).

### Verification points (fix only if a guard is too restrictive):

- [ ] 8.1 Teachers directory page (`app/(dashboard)/teachers/page.tsx`) — gated on `[STAFF_VIEW_DIRECTORY, TEACHERS_LIST]` (OR) ✓
- [ ] 8.2 Teacher onboarding page (`app/(dashboard)/teachers/onboarding/page.tsx`) — gated on `TEACHERS_CREATE` ✓
- [ ] 8.3 Students directory page (`app/(dashboard)/students/page.tsx`) — `resolveStudentsPageAudience` checks `STUDENTS_LIST` ✓
- [ ] 8.4 Student onboarding page (`app/(dashboard)/students/onboarding/page.tsx`) — gated on `STUDENTS_CREATE` ✓
- [ ] 8.5 Student profile/status pages — edit actions gated on student field-group ACL (`STUDENT_*_EDIT_OTHER`) ✓
  - `changeStudentStatus` in `student-lifecycle.service.ts:83` uses `assertStudentFieldEdit(fieldCtx, "student_academic")` ✓
  - `reassignTeacher` in `student-lifecycle.service.ts:24` checks `STUDENT_REASSIGN_TEACHER` ✓
- [ ] 8.6 Teacher profile pages — edit actions gated on profile field-group ACL (`PROFILE_*_EDIT_OTHER`) ✓
- [ ] 8.7 Sidebar navigation (`navigationConfig.ts`) — teachers/students nav items appear for supervisors ✓ (fixed in Phase 5)
- [ ] 8.8 GraphQL mutations reachable by supervisors:
  - `reassignStudentTeacher` — `authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER }` ✓ (fixed in Phase 4)
  - `changeStudentStatus` — `authScopes: { permission: AppPermission.STUDENT_MANAGE_STATUS }` ✓ (fixed in Phase 4)
  - `partiallyUpdateStudent` — `authScopes: { permission: AppPermission.STUDENTS_EDIT }` ✓ (supervisor now has `students.edit`)
  - `deleteStudent` — `requireStudentManageStatus` checks `STUDENT_MANAGE_STATUS` ✓ (supervisor now has this)
- [ ] 8.9 If any guard uses hardcoded role checks instead of permission checks, fix to permission-based gating
  - Quality loop per modified file

- [ ] 8.10 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/8-outcome.md`

---

## Phase 9: Knowledge Propagation

- [ ] 9.1 Create `docs/auth/supervisor-permissions.md`
  - Document: supervisor permission model (full teacher/student management)
  - Document: constraint that new teacher/student management permissions MUST be added to `supervisor_default` in `6-lms-permissions-and-groups.sql`
  - Document: system group editability change (permission bundles editable, name/slug/description immutable, delete blocked)
  - Document: GraphQL authScope pattern (`permission:` vs `superAdmin:`) — when to use each
  - Document: `applySupervisorNavOverrides` — must not override permission-based filtering for items that supervisors should access

- [ ] 9.2 Update `backend/services/AGENTS.md`
  - Add note: system permission groups can have permission bundles edited via `updateGroup` but cannot be renamed or deleted

- [ ] 9.3 Update `backend/graphql/AGENTS.md`
  - Add note: use `authScopes: { permission: AppPermission.X }` not `authScopes: { superAdmin: true }` for mutations that should be accessible by non-superadmin users with the correct permission

- [ ] 9.4 Update root `AGENTS.md` Important References
  - Add `docs/auth/supervisor-permissions.md` reference

- [ ] 9.5 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/9-outcome.md`

---

## Key Design Decisions

1. **In-place migration edit**: User explicitly requires modifying existing migration files. `ON CONFLICT DO NOTHING` ensures idempotency — new permissions insert, existing ones skip.

2. **Migration auto-bundler**: Do NOT manually edit existing Drizzle mirror folders. `applyCustomMigrations.ts` auto-generates new timestamped folders when raw SQL SHA-256 changes. Only modify raw SQL files, then run `bun db migrate`.

3. **Split by domain**: Non-field-ACL permissions go in `6-lms-permissions-and-groups.sql`; field-ACL `edit_other` permissions go in `6d-profile-fine-grained-only.sql` alongside existing `view_other` field ACLs. Academy admin grants go in `3-system_permissions_and_groups.sql`.

4. **System group permission editing**: System groups can have `permissionIds` updated via `updateGroup`. `name`, `slug`, and `description` are silently ignored (not thrown). Delete remains blocked.

5. **Backend silently ignores name/description for system groups**: The frontend `handleUpdateGroup` always sends `name` and `description` (the group's existing values) even for permission-only updates. Throwing would break the "Add Permissions" / "Revoke Permission" flows. Silently ignoring is simplest.

6. **Supervisor = full teacher/student management**: All current teacher/student management permissions granted. Comment in migration notes future permissions must also be added.

7. **No new AppPermission enum values**: All permissions already exist in the `AppPermission` enum.

8. **System permissions vs system groups**: Individual permission catalog entries with `isSystem = true` (like `auth.login`) remain immutable — their checkboxes stay disabled. This is separate from system *groups* and is not changed.

9. **`profile.core_status.edit_other` excluded**: Supervisor doesn't have `view_other` for `core_status`, so `edit_other` is not added.

10. **GraphQL authScope fix (Blocker B)**: `superAdmin: true` only passes for real superadmin users. `permission: AppPermission.X` passes for superAdmin OR anyone with that permission. All mutations intended for supervisor use must use `permission:` authScope.

11. **`applySupervisorNavOverrides` fix (Blocker A)**: The function runs AFTER permission-based filtering and overrides it. Must not hide items that supervisors now have permission to access (`teachers`, `students`, `permissions`).

12. **Academy admin `permission_groups.manage` (Blocker C)**: `requireManageAccess` checks `PERMISSION_GROUPS_MANAGE`. Without this permission, the Phase 2/3 system-group-editing feature is unreachable for academy admins. Added in migration 3.

13. **`PAGE_PERMISSIONS.teachers` bug fix (Bug D)**: Was missing `TeachersList`. Now `[StaffViewDirectory, TeachersList]` (OR-logic), matching `usersTeachers` pattern.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| In-place migration edit may not re-apply on existing databases | `ON CONFLICT DO NOTHING` ensures idempotency |
| System group editability could allow privilege escalation | Only `PERMISSION_GROUPS_MANAGE` holders can edit; name/slug immutable; delete blocked |
| Supervisor getting `staff.view_directory` may show staff they shouldn't see | Intended per issue — supervisors manage all staff types |
| Frontend sends name/description for system group updates | Backend silently ignores them — no error |
| Existing test expects `updateGroup` to throw for system groups | Test updated in Phase 2.3 to expect success |
| `applySupervisorNavOverrides` removal may show items supervisor shouldn't see | Permission-based filtering (already runs before this function) controls visibility — only items with matching permissions appear |
| GraphQL authScope change could allow unauthorized access | `permission:` scope checks `ctx.isSuperAdmin || ctx.permissions.includes(key)` — still secure, just not superadmin-only |
| Academy admin getting `permission_groups.manage` + `assign` | Intended — they need it to customize system group bundles per the issue |

---

## Validation Plan

1. **Migration**: Query `supervisor_default` group permissions after applying migration — verify all 29 new permissions present (8 non-field-ACL + 21 field-ACL `edit_other`). Query `academy_admin` — verify 7 new permissions present.
2. **Backend tests**: `updateGroup` on system group with `permissionIds` succeeds; with `name` succeeds but name unchanged; `deleteGroup` on system group still throws.
3. **Frontend**: Permission Management UI shows Edit button + Add Permissions tab for system groups; saving updates permissions; name/description fields are read-only in edit dialog; Revoke button visible in current permissions tab for system groups.
4. **Navigation**: Supervisor sees `teachers` and `students` in sidebar. Academy admin sees `teachers`, `students`, and `permissions` in sidebar. **Note: Navigation/UI tests are WRITTEN but NEVER RUN during this implementation.**
5. **E2E**: Supervisor user can access teachers/students directory, create, edit, and profile pages; can reassign teachers and change student status via GraphQL mutations.

---

## Phase Dependency Graph

```
Phase 0 (Baseline) → Phase 1 (Migrations) → Phase 2 (Backend repo+service+tests)
                                                ↓
                                          Phase 3 (Frontend UI for system groups)
                                                ↓
Phase 4 (GraphQL authScopes) ←── independent ──→ Phase 5 (Nav overrides + PAGE_PERMISSIONS fix)
                                                ↓
                                          Phase 6 (Navigation tests)
                                                ↓
                                          Phase 7 (Codegen + verification)
                                                ↓
                                          Phase 8 (Page access verification)
                                                ↓
                                          Phase 9 (Knowledge propagation)
```

Phases 4 and 5 can be done in parallel with Phase 2/3 since they touch different files, but Phase 7 (codegen + verification) must come after all code changes.

---

## AGENTS.md & Instructions Reference (per task)

| Phase | Files modified | Applicable AGENTS.md | Applicable instructions |
|-------|----------------|---------------------|----------------------|
| 1 | `backend/db/migration/*.sql` | `backend/AGENTS.md` | `backend.instructions.md` |
| 2 | `backend/db/repo/`, `backend/services/` | `backend/db/repo/AGENTS.md`, `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |
| 3 | `frontend/views/permissions/` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| 4 | `backend/graphql/pothos/` | `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| 5 | `frontend/common/views/dashboard/config/`, `frontend/common/types/` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md` |
| 6 | `test/ui/components/` | `test/ui/AGENTS.md` | `tests.instructions.md`, `frontend.instructions.md` |
| 9 | `docs/auth/`, `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`, `AGENTS.md` | root `AGENTS.md` | — |
