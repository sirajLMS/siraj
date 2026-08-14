# Plan: Grant Supervisors Full Teacher/Student Management + Enable Manager Role ACL Customization

**GitHub Issue:** [#47](https://github.com/sirajLMS/siraj/issues/47)

## Overview

Two changes:
1. **Supervisor permissions expansion**: Grant `supervisor_default` group full operational management over Teachers and Students (list, create, edit, view/edit profiles, manage schedules/dues, reassign teachers, change student status, edit student identity/academic fields).
2. **System group ACL customization**: Lift the `isSystem` immutability restriction so academy admins can customize permission bundles for `supervisor_default` and `academy_admin` via the Permission Management UI. System groups cannot be renamed, slug-changed, or deleted — only their `permissionIds` bundle is editable.

---

## CRITICAL CONSTRAINT (from user)

> **The existing SQL migration files MUST be updated in-place — NOT new migrations.** The user explicitly requires modifying the existing migration files. Add a comment block noting that supervisors are granted ALL current and future teacher/student management permissions.

---

## Phase 0: Pre-Implementation Baseline

- [ ] 0.1 Record baseline: `bun tsgo 2>&1 | grep "error TS" | wc -l`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id baseline`
- [ ] 0.2 Create `.ai/plans/supervisor-permissions-manager-acl/outcome/` directory
- [ ] 0.3 Write baseline outcome file

---

## Phase 1: Database Migrations — Grant Supervisor Permissions

### Split by domain (user-confirmed decision):

**File A: `6-lms-permissions-and-groups.sql`** — non-field-ACL permissions
**File B: `6d-profile-fine-grained-only.sql`** — field-ACL `edit_other` permissions (alongside existing `view_other`)

Each raw SQL file has a Drizzle mirror that must also be updated:
- `6` → `backend/drizzle/20260729025951_custom_6-lms-permissions-and-groups/migration.sql`
- `6d` → `backend/drizzle/20260729155331_custom_6d-profile-fine-grained-only/migration.sql`

### 1A. Non-field-ACL permissions to ADD to `6-lms-permissions-and-groups.sql` `supervisor_default` block (lines 205-227):

Append to the existing `p.key IN (...)` clause:
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

### 1B. Field-ACL `edit_other` permissions to ADD to `6d-profile-fine-grained-only.sql` `supervisor_default` block (lines 305-331):

Append to the existing `p.key IN (...)` clause (only for field groups where supervisor already has `view_other`):
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

### Tasks

- [ ] 1.1 Update `backend/db/migration/6-lms-permissions-and-groups.sql`
  - Add comment block above the `supervisor_default` INSERT (before line 200): `-- IMPORTANT: Supervisors are granted ALL current and future teacher/student management permissions. Any new teacher/student management permission MUST be added to this group.`
  - Append the 1A permissions to the `p.key IN (...)` clause
  - Quality loop: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

- [ ] 1.2 Update `backend/drizzle/20260729025951_custom_6-lms-permissions-and-groups/migration.sql`
  - Apply identical changes (same comment, same permissions)
  - Preserve `--> statement-breakpoint` separators
  - Quality loop

- [ ] 1.3 Update `backend/db/migration/6d-profile-fine-grained-only.sql`
  - Append the 1B `edit_other` permissions to the `supervisor_default` `p.key IN (...)` clause (after line 331, before closing `)`)
  - Quality loop

- [ ] 1.4 Update `backend/drizzle/20260729155331_custom_6d-profile-fine-grained-only/migration.sql`
  - Apply identical changes
  - Preserve `--> statement-breakpoint` separators
  - Quality loop

- [ ] 1.5 Write outcome file: `.ai/plans/supervisor-permissions-manager-acl/outcome/1-outcome.md`

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

- [ ] 2.4 Write outcome file: `.ai/plans/supervisor-permissions-manager-acl/outcome/2-outcome.md`

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

- [ ] 3.11 Write outcome file: `.ai/plans/supervisor-permissions-manager-acl/outcome/3-outcome.md`

---

## Phase 4: Frontend — Verify Supervisor Access to Teacher/Student Pages

**Goal:** Confirm supervisors can access and use teacher/student directory, create, edit, and profile pages. Most should "just work" once the migration grants the permissions. Verify each guard is permission-based (not role-based).

### Verification points (fix only if a guard is too restrictive):

- [ ] 4.1 Teachers directory page (`app/(dashboard)/teachers/page.tsx`) — gated on `[STAFF_VIEW_DIRECTORY, TEACHERS_LIST]` (OR) ✓
- [ ] 4.2 Teacher onboarding page (`app/(dashboard)/teachers/onboarding/page.tsx`) — gated on `TEACHERS_CREATE` ✓
- [ ] 4.3 Students directory page (`app/(dashboard)/students/page.tsx`) — `resolveStudentsPageAudience` checks `STUDENTS_LIST` ✓
- [ ] 4.4 Student onboarding page (`app/(dashboard)/students/onboarding/page.tsx`) — gated on `STUDENTS_CREATE` ✓
- [ ] 4.5 Student profile/status pages — edit actions gated on student field-group ACL (`STUDENT_*_EDIT_OTHER`) ✓
  - `changeStudentStatus` in `student-lifecycle.service.ts:83` uses `assertStudentFieldEdit(fieldCtx, "student_academic")` ✓
  - `reassignTeacher` in `student-lifecycle.service.ts:24` checks `STUDENT_REASSIGN_TEACHER` ✓
- [ ] 4.6 Teacher profile pages — edit actions gated on profile field-group ACL (`PROFILE_*_EDIT_OTHER`) ✓
- [ ] 4.7 Sidebar navigation (`navigationConfig.ts`) — teachers/students nav items appear for supervisors ✓
- [ ] 4.8 If any guard uses hardcoded role checks instead of permission checks, fix to permission-based gating
  - Quality loop per modified file

- [ ] 4.9 Write outcome file: `.ai/plans/supervisor-permissions-manager-acl/outcome/4-outcome.md`

---

## Phase 5: Testing

- [ ] 5.1 Run updated permission management service tests (Phase 2.3)
  - Run: `bun run scripts/run-test/run-test.ts backend/db/test/logic/permissions/permission-management.service.test.ts`

- [ ] 5.2 Verify migration applies cleanly
  - Run: `bun db push` (or apply migration to test database)
  - Query `supervisor_default` group permissions and verify all new permissions present

- [ ] 5.3 Write outcome file: `.ai/plans/supervisor-permissions-manager-acl/outcome/5-outcome.md`

---

## Phase 6: Knowledge Propagation

- [ ] 6.1 Create `docs/auth/supervisor-permissions.md`
  - Document: supervisor permission model (full teacher/student management)
  - Document: constraint that new teacher/student management permissions MUST be added to `supervisor_default` in `6-lms-permissions-and-groups.sql`
  - Document: system group editability change (permission bundles editable, name/slug/description immutable, delete blocked)

- [ ] 6.2 Update `backend/services/AGENTS.md`
  - Add note: system permission groups can have permission bundles edited via `updateGroup` but cannot be renamed or deleted

- [ ] 6.3 Update root `AGENTS.md` Important References
  - Add `docs/auth/supervisor-permissions.md` reference

- [ ] 6.4 Write outcome file: `.ai/plans/supervisor-permissions-manager-acl/outcome/6-outcome.md`

---

## Key Design Decisions

1. **In-place migration edit**: User explicitly requires modifying existing migration files. `ON CONFLICT DO NOTHING` ensures idempotency — new permissions insert, existing ones skip.

2. **Split by domain**: Non-field-ACL permissions go in `6-lms-permissions-and-groups.sql`; field-ACL `edit_other` permissions go in `6d-profile-fine-grained-only.sql` alongside existing `view_other` field ACLs. Both raw SQL files + their Drizzle mirrors updated.

3. **System group permission editing**: System groups can have `permissionIds` updated via `updateGroup`. `name`, `slug`, and `description` are silently ignored (not thrown). Delete remains blocked.

4. **Backend silently ignores name/description for system groups**: The frontend `handleUpdateGroup` always sends `name` and `description` (the group's existing values) even for permission-only updates. Throwing would break the "Add Permissions" / "Revoke Permission" flows. Silently ignoring is simplest.

5. **Supervisor = full teacher/student management**: All current teacher/student management permissions granted. Comment in migration notes future permissions must also be added.

6. **No new AppPermission enum values**: All permissions already exist in the `AppPermission` enum.

7. **System permissions vs system groups**: Individual permission catalog entries with `isSystem = true` (like `auth.login`) remain immutable — their checkboxes stay disabled. This is separate from system *groups* and is not changed.

8. **`profile.core_status.edit_other` excluded**: Supervisor doesn't have `view_other` for `core_status`, so `edit_other` is not added.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| In-place migration edit may not re-apply on existing databases | `ON CONFLICT DO NOTHING` ensures idempotency |
| System group editability could allow privilege escalation | Only `PERMISSION_GROUPS_MANAGE` holders can edit; name/slug immutable; delete blocked |
| Supervisor getting `staff.view_directory` may show staff they shouldn't see | Intended per issue — supervisors manage all staff types |
| Frontend sends name/description for system group updates | Backend silently ignores them — no error |
| Existing test expects `updateGroup` to throw for system groups | Test updated in Phase 2.3 to expect success |
| 4 Drizzle mirrors exist for `6d` | Only update the latest: `20260729155331_custom_6d-profile-fine-grained-only` |

---

## Validation Plan

1. **Migration**: Query `supervisor_default` group permissions after applying migration — verify all 29 new permissions present (8 non-field-ACL + 21 field-ACL `edit_other`)
2. **Backend tests**: `updateGroup` on system group with `permissionIds` succeeds; with `name` succeeds but name unchanged; `deleteGroup` on system group still throws
3. **Frontend**: Permission Management UI shows Edit button + Add Permissions tab for system groups; saving updates permissions; name/description fields are read-only in edit dialog; Revoke button visible in current permissions tab for system groups
4. **E2E**: Supervisor user can access teachers/students directory, create, edit, and profile pages; can reassign teachers and change student status
