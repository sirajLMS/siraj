# Supervisor Permissions & System Group Management

This document covers the supervisor permission model, system permission group editability rules, the GraphQL authScope pattern, and navigation override behavior. Implemented as part of [GitHub issue #47](https://github.com/sirajLMS/siraj/issues/47).

## Supervisor Permission Model

Supervisors (users assigned the `supervisor_default` system permission group) have **full teacher and student management permissions** — they can create, edit, manage schedules, reassign teachers, and change student status exactly like a superAdmin, with one exception: they **cannot manage permission groups** (they lack `PermissionGroupsManage`).

### Permissions Granted to Supervisors

The `supervisor_default` group carries 74 total permissions (was 34 before issue #47). The 29 new permissions added fall into two categories:

#### Non-Field-ACL Permissions (8)

Granted via `backend/db/migration/6-lms-permissions-and-groups.sql`:

| Permission Key | Description |
|---|---|
| `teachers.create` | Create new teacher accounts |
| `teachers.edit` | Edit teacher profiles |
| `teachers.manage_schedule` | Manage teacher schedules |
| `students.create` | Create new student accounts |
| `students.edit` | Edit student profiles |
| `student.reassign_teacher` | Reassign a student to a different teacher |
| `student.manage_status` | Change student status (regular, suspended, on-leave) |
| `staff.view_directory` | View the staff directory |

#### Field-ACL `edit_other` Permissions (21)

Granted via `backend/db/migration/6d-profile-fine-grained-only.sql`. These allow supervisors to edit **other users'** profile fields (not just their own). Covers:

- `profile.core_identity.edit_other`, `profile.core_contact.edit_other`
- `profile.teacher_professional.edit_other`, `profile.teacher_identity.edit_other`
- `profile.parent_social.edit_other`, `profile.parent_identity.edit_other`, `profile.parent_billing.edit_other`, `profile.parent_account.edit_other`, `profile.parent_students.edit_other`
- `profile.teacher_students.edit_other`
- `profile.staff_role.edit_other`, `profile.staff_permissions.edit_other`
- `profile.payment_methods.edit_other`
- `profile.meeting_configs.edit_other`
- `profile.student_identity.edit_other`, `profile.student_academic.edit_other`, `profile.student_teacher.edit_other`, `profile.student_parent.edit_other`, `profile.student_schedule.edit_other`, `profile.student_history.edit_other`, `profile.student_quota_edit.edit_other`

**Deliberately excluded**: `profile.core_status.edit_other` — supervisors lack the `view_other` permission for `core_status`, so the `edit_other` grant would be ineffective.

### What Supervisors Cannot Do

- **Manage permission groups** — supervisors lack `PermissionGroupsManage`. The `permissions` nav item is hidden for them.
- **Access admin-only settings** — settings, whatsapp-settings, dst-migration, cron, etc. remain hidden via `applySupervisorNavOverrides`.

## Migration Maintenance Rule

> **Any new teacher/student management permission MUST be added to the `supervisor_default` group in `backend/db/migration/6-lms-permissions-and-groups.sql`.**

There is a comment block above the `supervisor_default` INSERT statement documenting this requirement:

```sql
-- IMPORTANT: Supervisors are granted ALL current and future teacher/student management permissions.
-- Any new teacher/student management permission MUST be added to this group.
```

When adding a new permission enum value that relates to teacher or student management, append it to the `p.key IN (...)` clause for the `supervisor_default` group. The INSERT uses `ON CONFLICT DO NOTHING`, making it idempotent and safe to re-run.

## System Permission Group Editability

System permission groups (those with `isSystem = true`, such as `super_admin`, `supervisor_default`, `academy_admin`, `teacher_default`, `parent_default`) have special editability rules:

| Operation | Allowed? | Notes |
|---|---|---|
| **Edit permission bundle** (add/revoke permissions via `updateGroup`) | ✅ Yes | The `permissionIds` array can be freely replaced |
| **Rename group** (change `name`/`slug`) | ❌ No | Name/slug/description are immutable |
| **Delete group** | ❌ No | Delete is blocked at both service and repository layers |

### Frontend Behavior

The frontend shows **Edit** and **Revoke** buttons for system groups, but:
- The **Edit dialog** makes `name` and `description` fields read-only (via `disabled={isLoading || isSystem}`) when editing a system group — only the permission bundle section remains editable.
- The **Delete** menu item remains disabled (`disabled={group.isSystem ?? false}`) for system groups.

### Backend Behavior

The service layer (`permission-management.service.ts`) and repository layer (`permission-management.repository.ts`) enforce these rules:

1. **Service `updateGroup`**: For system groups, skips `validateGroupName` and passes `undefined` for `name` and `description` to the repository (silently ignored).
2. **Repository `updateGroup`**: For system groups, only replaces the `group_permissions` join table entries (delete old + insert new). Name/slug/description columns are never touched.
3. **Repository `deleteGroup`**: Throws `cannotDeleteSystemPermissionGroup` for system groups — unchanged.

## GraphQL authScope Pattern

### When to use `permission:` vs `superAdmin:`

Use `authScopes: { permission: AppPermission.X }` (not `authScopes: { superAdmin: true }`) for any mutation accessible by non-superadmin users with the correct permission.

| authScope | Passes for |
|---|---|
| `{ superAdmin: true }` | Only `ctx.isSuperAdmin === true` (superAdmins only) |
| `{ permission: AppPermission.X }` | `ctx.isSuperAdmin \|\| ctx.permissions.includes(key)` (superAdmins **and** users with the permission) |

The `permission:` check is defined in `gqlSchemaBuilder.ts` and automatically passes for superAdmins (via `ctx.isSuperAdmin` bypass), so existing superAdmin tests remain valid without changes.

### Example

```typescript
// ✅ Correct — allows supervisors and academy admins with the permission
authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER },

// ❌ Wrong — blocks non-superAdmin users even if they have the permission
authScopes: { superAdmin: true },
```

`AppPermission` must be imported as a **value import** (not type-only) when used in runtime expressions like `authScopes`:

```typescript
import { AppPermission } from "@/backend/enum";
```

## `applySupervisorNavOverrides` Function

The `applySupervisorNavOverrides` function in `frontend/common/views/dashboard/config/navigationConfig.ts` runs **AFTER** `getNavItemsForPermissions` permission-based filtering. It applies additional hiding rules specific to the supervisor role.

### Critical Rule

`applySupervisorNavOverrides` must **NOT** override permission-based filtering for items the supervisor has permissions for. Only genuinely admin-only items should remain hidden.

### Items still hidden by `applySupervisorNavOverrides`

These items have no relevant permission for supervisors and are correctly hidden:

- `settings`
- `whatsapp-settings`
- `dst-migration`
- `cron`
- `home`
- `own-profile`
- `search-schedule`
- `schedule-tracking`
- `status-tracking`
- `schedule-alerts`
- `feedback-manage`

### Items removed from the override hide set (now permission-based)

As of issue #47, the following items were removed from the hardcoded supervisor hide set and now rely on `getNavItemsForPermissions` for visibility:

- `teachers` — visible because supervisor has `StaffViewDirectory` + `TeachersList`
- `students` — visible because supervisor has `StudentsList`
- `permissions` — still hidden because supervisor lacks `PermissionGroupsManage`

## Manager (Academy Admin) ACL Customization

The `academy_admin` (manager) role now has the following permissions, allowing them to customize permission groups for their academy staff:

| Permission Key | Description |
|---|---|
| `permission_groups.manage` | Create, edit, and delete custom permission groups |
| `permission_groups.assign` | Assign/revoke permission groups to users |
| `teachers.edit` | Edit teacher profiles |
| `teachers.list` | List/view teachers |
| `students.edit` | Edit student profiles |
| `students.change_teacher` | Reassign students to different teachers |
| `students.change_status` | Change student status |

These permissions were added via `backend/db/migration/3-system_permissions_and_groups.sql` and allow academy admins to access the Permissions management page, create custom permission groups for their staff, and manage teacher/student profiles.
