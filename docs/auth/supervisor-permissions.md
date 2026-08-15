# Supervisor Permissions Model

## Overview

The `supervisor_default` permission group grants full operational management over **Teachers, Students, and Parents** — list, create, edit, view/edit profiles, manage schedules/status/lifecycle. **Staff is explicitly excluded** — supervisors have NO staff management or view permissions.

## Staff Exclusion (Absolute)

Supervisors do NOT receive:
- `staff.view_directory` — no staff directory access
- `permission_groups.manage` / `permission_groups.assign` — no permission management (superadmin-only)
- `profile.core_identity.edit_other` — `core_identity` has `audiences: ALL_AUDIENCES` (includes STAFF), so `edit_other` is excluded
- `profile.core_contact.edit_other` — same reason as `core_identity`
- `profile.staff_role.edit_other` — `staff_role` has `audiences: [STAFF]`
- `profile.staff_permissions.edit_other` — `staff_permissions` has `audiences: [STAFF]`

Supervisors DO have `view_other` for `core_identity`, `core_contact`, `staff_role`, `staff_permissions` (existing behavior, backward-compatible). This is a deliberate asymmetry: supervisors can VIEW staff profile fields but cannot EDIT them.

## Field-ACL Audience Model

The field-ACL model uses `audiences` to determine which user types a field group applies to. When granting `edit_other` to a role, only field groups whose `audiences` do NOT include `STAFF` are safe:

| Field Group | Audiences | `edit_other` for supervisor? |
|-------------|-----------|------------------------------|
| `core_identity` | `[TEACHER, PARENT, STAFF]` | NO — includes STAFF |
| `core_contact` | `[TEACHER, PARENT, STAFF]` | NO — includes STAFF |
| `teacher_professional` | `[TEACHER]` | YES |
| `teacher_identity` | `[TEACHER]` | YES |
| `parent_social` | `[PARENT]` | YES |
| `parent_identity` | `[PARENT]` | YES |
| `parent_billing` | `[PARENT]` | YES |
| `parent_account` | `[PARENT]` | YES |
| `parent_students` | `[PARENT]` | YES |
| `teacher_students` | `[TEACHER]` | YES |
| `staff_role` | `[STAFF]` | NO — staff-only |
| `staff_permissions` | `[STAFF]` | NO — staff-only |
| `payment_methods` | `[TEACHER, PARENT]` | YES |
| `meeting_configs` | `[TEACHER, PARENT]` | YES |

## Teacher Page/Nav Gating

Teacher pages and nav items are gated on `TeachersList` (a teacher-specific permission), NOT `StaffViewDirectory` (a staff permission). This decouples teacher access from staff access:

- `/teachers` page → `withPageAuth([AppPermission.TEACHERS_LIST])`
- `/users` page → `withPageAuth([AppPermission.TEACHERS_LIST, AppPermission.PARENT_VIEW_DIRECTORY, AppPermission.STUDENTS_LIST])`
- `teachers` nav item → `PAGE_PERMISSIONS.teachers = [AppPermission.TeachersList]`
- `usersTeachers` tab → `PAGE_PERMISSIONS.usersTeachers = [AppPermission.TeachersList]`
- `usersDirectoryParent` → `PAGE_PERMISSIONS.usersDirectoryParent = [AppPermission.TeachersList, AppPermission.ParentViewDirectory, AppPermission.StudentsList]`
- `grp_users` nav group → `permission: [AppPermission.TeachersList, ...]`
- Weekly schedule ViewModel → `hasScheduleManageTeacher: hasPermission(AppPermission.TeachersManageSchedule)` (replaces `isAdmin: hasPermission(AppPermission.StaffViewDirectory)`)
- `resolveTeacherId` backend helper → accepts `TEACHERS_MANAGE_SCHEDULE` as admin-level permission

## Permission Management (Superadmin-Only)

Only superadmin can manage permissions. `academy_admin` does NOT get `permission_groups.manage` or `permission_groups.assign`. The `requireManageAccess` guard checks `isSuperAdmin || hasPermission(PERMISSION_GROUPS_MANAGE)` — since no non-superadmin group has `PERMISSION_GROUPS_MANAGE`, only superadmin passes.

### System Group Editing

System permission groups (`supervisor_default`, `academy_admin`, etc.) can have their **permission bundle** (`permissionIds`) edited by superadmin via `updateGroup`. However:
- Name, slug, and description are **immutable** for system groups
- System groups **cannot be deleted** (`deleteGroup` throws `cannotDeleteSystemPermissionGroup`)
- The frontend shows the Edit button and Add Permissions tab for all groups, but name/description fields are disabled when `isSystem` is true

## GraphQL authScope Pattern

Use `authScopes: { permission: AppPermission.X }` (not `authScopes: { superAdmin: true }`) for mutations accessible by non-superadmin users with the correct permission. The `superAdmin: true` authScope blocks ALL non-superadmin users.

Mutations fixed to use permission-based authScopes:
- `reassignStudentTeacher` → `permission: AppPermission.STUDENT_REASSIGN_TEACHER`
- `changeStudentStatus` → `permission: AppPermission.STUDENT_MANAGE_STATUS`
- `updateStudentQuota` → `permission: AppPermission.STUDENT_QUOTA_EDIT_EDIT_OTHER`

## Supervisor Nav Overrides

`applySupervisorNavOverrides` hides admin-only items from supervisors. Teachers, students, and parents are NO LONGER hidden — supervisors have the permissions to see them. Staff remains hidden (filtered by `StaffViewDirectory` which supervisors lack).

Items still hidden from supervisors: `home`, `own-profile`, `search-schedule`, `schedule-tracking`, `schedule`, `managers`, `resources`, `subjects`, `books-and-bags`, `reports`, `billing-admin`, `payment-catalogs`, `feedback-manage`, `dst-migration`, `cron`, `permissions`, `settings`, `whatsapp-settings`.

## Migration Constraint

Any new teacher/student/parent management permission MUST be added to the `supervisor_default` block in `backend/db/migration/6-lms-permissions-and-groups.sql`. Staff permissions must NEVER be added to `supervisor_default`.
