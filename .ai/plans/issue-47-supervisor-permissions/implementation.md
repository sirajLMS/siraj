# Technical Design: Supervisor Permissions & Manager ACL Customization

**GitHub Issue:** [#47](https://github.com/sirajLMS/siraj/issues/47)

## Overview

Two interconnected changes:
1. **Supervisor permissions expansion**: Grant the `supervisor_default` permission group full operational management over Teachers and Students by adding grants to existing in-place SQL migrations.
2. **System group ACL customization**: Allow `updateGroup` to modify the `permissionIds` bundle of system groups (while keeping `name`/`slug`/`description` immutable and `deleteGroup` blocked), and enable the frontend UI to show permission editing controls for system groups.

### Three Critical Blockers (discovered in deep investigation, NOT in `.kilo` plan)

| # | Blocker | File | Root Cause | Fix |
|---|---------|------|-----------|-----|
| A | `applySupervisorNavOverrides` hardcodes hiding nav items | `frontend/common/views/dashboard/config/navigationConfig.ts:1008-1041` | Unconditionally hides `teachers`, `students`, `permissions` from "pure supervisor portal users" — runs AFTER permission filtering, overriding it | Remove these items from the unconditional hide set; let permission-based filtering control visibility |
| B | GraphQL `superAdmin: true` authScopes block supervisors | `backend/graphql/pothos/students/student-lifecycle.pothos.ts:36,58` | `reassignStudentTeacher` and `changeStudentStatus` use `authScopes: { superAdmin: true }` — blocks all non-superadmin users including supervisors with the correct permission | Change to `authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER }` and `{ permission: AppPermission.STUDENT_MANAGE_STATUS }` |
| C | Academy admin missing `permission_groups.manage` | `backend/db/migration/3-system_permissions_and_groups.sql:1292-1358` | `requireManageAccess` checks `PERMISSION_GROUPS_MANAGE`; academy_admin doesn't have it | Add `permission_groups.manage`, `permission_groups.assign`, `teachers.edit`, `students.edit`, `students.change_teacher`, `students.change_status`, `teachers.list` to `academy_admin` block |

> **⚠️ CRITICAL: DO NOT RUN UI TESTS**
> UI tests (`bun run test:ui:components`, `bun run test:ui`, navigation tests in `test/ui/`) MUST be written/updated as part of this implementation but MUST NEVER be run or executed. Write the test code, update fixtures and assertions — but do NOT execute the test runner.

### Additional Bug

| # | Bug | File | Fix |
|---|-----|------|-----|
| D | `PAGE_PERMISSIONS.teachers` missing `TeachersList` | `frontend/common/types/page-permissions.types.ts:50` | Currently `[StaffViewDirectory]` only — should be `[StaffViewDirectory, TeachersList]` (OR-logic, matching `usersTeachers` pattern at line 56) |

## Design Goals

- Grant supervisors full teacher/student management without breaking portal identity routing
- Allow system group permission bundle customization without enabling rename/delete (privilege escalation risk)
- Fix GraphQL auth gates that block supervisors despite having correct service-level permissions
- Preserve the 3-tier permission model (server page guard -> service/GraphQL -> client RequirePermission)

## CRUDITICAL CONSTRAINT (from user)

> **The existing SQL migration files MUST be updated in-place — NOT new migrations.** Add comment blocks noting supervisor grant scope.

### Migration Auto-Bundler

`applyCustomMigrations.ts` auto-generates new Drizzle migration folders from raw SQL files when their SHA-256 hash changes. Only modify raw SQL files in `backend/db/migration/`, then run `bun db migrate`.

## UX/Navigation Specification

### New Routes & URLs
No new routes — existing routes become accessible to supervisors.

### Route Permission Matrix (after changes)

| Route | Permission Gate | Supervisor? | Academy Admin? |
|-------|----------------|-------------|----------------|
| `/teachers` | `[StaffViewDirectory, TeachersList]` (OR) | Yes (has both after migration) | Yes (has `StaffViewDirectory`) |
| `/teachers/onboarding` | `TeachersCreate` | Yes (granted) | Yes (already had) |
| `/students` | `[StudentsList, TeacherViewStudents, ParentViewStudents]` (OR) → admin audience | Yes (has `StudentsList`) | Yes (already had) |
| `/students/onboarding` | `StudentsCreate` | Yes (granted) | Yes (already had) |
| `/permissions` | `PermissionGroupsManage` | No (not granted to supervisor) | Yes (granted via migration 3) |

### Sidebar/Navigation Integration

| Nav Item | Group | Supervisor Sees? | Academy Admin Sees? |
|----------|-------|-----------------|---------------------|
| `teachers` | grp_users | Yes (after Blocker A fix) | Yes |
| `students` | grp_users | Yes (after Blocker A fix) | Yes |
| `permissions` | grp_admin | No (no `PermissionGroupsManage`) | Yes (after Blocker C fix) |

### Role-Based Access Matrix

| Role | teachers | students | permissions panel | supervisor dashboard | teacher/student create/edit |
|------|----------|----------|-------------------|---------------------|---------------------------|
| SUPER_ADMIN | Yes | Yes | Yes | Yes (inherits) | Yes |
| ACADEMY_ADMIN | Yes | Yes | Yes (NEW) | — | Yes (enhanced) |
| SUPERVISOR | Yes (NEW) | Yes (NEW) | No | Yes | Yes (NEW) |
| TEACHER | — (portal) | — (portal) | No | — | No |
| PARENT | — | — (portal) | No | — | No |
| STUDENT | — | — (portal) | No | — | No |

### Mobile vs Desktop
No differences — permission gates are identical across tiers. Nav filtering runs before tier selection.

## Phase 1: Database Migrations (In-Place Edits)

### 1A. supervisor_default non-field-ACL grants

**File:** `backend/db/migration/6-lms-permissions-and-groups.sql` — `supervisor_default` block (lines 205-227)

Add comment + 8 permissions to `p.key IN (...)` clause.

### 1B. supervisor_default field-ACL `edit_other` grants

**File:** `backend/db/migration/6d-profile-fine-grained-only.sql` — `supervisor_default` block (lines 305-331)

Append 21 `edit_other` field-ACL permissions for groups where supervisor already has `view_other`.

### 1C. academy_admin grants (Blocker C)

**File:** `backend/db/migration/3-system_permissions_and_groups.sql` — `academy_admin` block (lines 1292-1358)

Append 7 permissions: `permission_groups.manage/assign`, `teachers.edit`, `teachers.list`, `students.edit`, `students.change_teacher`, `students.change_status`.

**Drizzle mirrors:** Do NOT manually edit. Run `bun db migrate` after SQL edits — auto-bundler generates new timestamped folders.

## Phase 2: Backend — System Group Permission Bundle Editing

### Repository: `permission-management.repository.ts` `updateGroup`

Replace the `isSystem` throw (line 352-354) with conditional logic:
- System group + `permissionIds` provided → replace permission bundle only, skip name/slug/description update
- System group + `permissionIds` undefined → return existing group as-is (no-op)
- System group + `name`/`description` only → silently ignore, return existing group
- Non-system group → existing behavior unchanged

`deleteGroup` `isSystem` guard (line 425-427) stays unchanged.

### Service: `permission-management.service.ts` `updateGroup`

Fetch group first to check `isSystem`. Skip `validateGroupName` for system groups. Pass `name: undefined` and `description: undefined` for system groups so the repository keeps existing values.

### Tests

- Change existing "updateGroup on system group should throw" test → now expects success with `permissionIds`
- Add: system group + name change → succeeds, name unchanged
- Add: system group + empty `permissionIds: []` → succeeds, clears all permissions
- Keep: deleteGroup on system group → still throws

## Phase 3: Frontend — Enable Permission Editing for System Groups

### Affected components (10 changes):

| # | File | Change |
|---|------|--------|
| 3.1 | `singleGroupHeaderShared.tsx:154` | Remove `isSystem` guard on Edit button |
| 3.2 | `singleGroupViewShared.tsx:82-84` | Remove `isSystem` guard on "Add Permissions" tab |
| 3.3 | `singleGroupViewShared.tsx:113` | Remove `isSystem` guard on AddPermissionsTab content |
| 3.4 | `currentPermissionsTabShared.tsx:27` | Remove `isSystem` guard on "Assign First Permission" button |
| 3.5 | `desktop/.../permissionGroupsDataGrid.desktop.tsx:66` | Enable Edit menu item for system groups |
| 3.6 | `desktop/.../permissionGroupsDataGrid.desktop.tsx:74` | Keep Delete disabled for system groups |
| 3.7 | `mobile/.../permissionGroupCardList.mobile.tsx:84` | Enable Edit menu item for system groups |
| 3.8 | `mobile/.../permissionGroupCardList.mobile.tsx:92` | Keep Delete disabled for system groups |
| 3.9 | `mobile/.../currentPermissionsTab.mobile.tsx:61` | Show Revoke button for system groups |
| 3.10 | `permissionGroupForm.types.ts` + `permissionGroupFormShared.tsx` | Pass `isSystem` flag; disable name/description fields when `isSystem` |

## Phase 4: GraphQL — Fix `superAdmin` authScopes (Blocker B)

**File:** `backend/graphql/pothos/students/student-lifecycle.pothos.ts`
- Line 36: `reassignStudentTeacher` → `authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER }`
- Line 58: `changeStudentStatus` → `authScopes: { permission: AppPermission.STUDENT_MANAGE_STATUS }`

The `permission` authScope (from `gqlSchemaBuilder.ts:111`) passes for `ctx.isSuperAdmin || ctx.permissions.includes(key)`. SuperAdmin unchanged; supervisors with the permission now pass; everyone else still blocked.

## Phase 5: Frontend Navigation — Fix Supervisor Nav + Bug D (Blocker A + D)

### 5A. `applySupervisorNavOverrides` fix

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts`
- Remove `teachers`, `students`, `permissions` from the hardcoded hide set in `applySupervisorNavOverrides` (lines 1017-1038)
- Let `getNavItemsForPermissions` (permission-based filtering) control their visibility
- Keep other supervisor overrides intact

### 5B. `PAGE_PERMISSIONS.teachers` bug fix

**File:** `frontend/common/types/page-permissions.types.ts:50`
- Change: `teachers: [AppPermission.StaffViewDirectory]` → `teachers: [AppPermission.StaffViewDirectory, AppPermission.TeachersList]`

## Phase 6: Navigation Tests

> **⚠️ These tests are WRITTEN but NEVER RUN. Do not execute `bun run test:ui:components` or any UI test runner.**

### Supervisor test (`supervisorNavigationConfig.test.ts`)
- Add new permissions to `SUPERVISOR_PERMISSIONS` fixture array
- Change `expect(keys).not.toContain("students")` → `expect(keys).toContain("students")`
- Add `expect(keys).toContain("teachers")`
- Keep `expect(keys).not.toContain("permissions")` (supervisor lacks `PermissionGroupsManage`)

### Academy admin test (`academyAdminNavigationConfig.test.ts`)
- Add `PermissionGroupsManage`, `PermissionGroupsAssign`, `TeachersEdit`, `StudentsEdit`, `TeachersList`
- Add `expect(keys).toContain("permissions")`
- Add `expect(keys).toContain("teachers")`

## Phase 7: Codegen & Verification

1. `bun run generate:gqlSchema` — regenerate schema (no schema fields changed, but verify)
2. `bun codegen` — regenerate types
3. `bun tsgo` — type check (0 errors)
4. `bun lint` — lint clean
5. `bun biome:check` — format
6. `bun quality-gate` — full quality gate
7. `bun db migrate` — apply migrations, verify grants in DB
8. Run service tests ONLY — **DO NOT RUN navigation/UI tests**

## Phase 8: Verify Supervisor Page Access

Verify all teacher/student page guards are permission-based (not role-based):
- `/teachers` page → `[StaffViewDirectory, TeachersList]`
- `/teachers/onboarding` → `TeachersCreate`
- `/students` page → `resolveStudentsPageAudience` checks `StudentsList`
- `/students/onboarding` → `StudentsCreate`
- `reassignStudentTeacher` → permission-based (fixed in Phase 4)
- `changeStudentStatus` → permission-based (fixed in Phase 4)
- `partiallyUpdateStudent` → `StudentsEdit` (supervisor now has it)
- `deleteStudent` → `StudentManageStatus` check (supervisor now has it)

## Phase 9: Knowledge Propagation

- Create `docs/auth/supervisor-permissions.md`
- Update `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`, root `AGENTS.md`

## Key Design Decisions

1. **In-place migration edit** — user requirement; `ON CONFLICT DO NOTHING` ensures idempotency
2. **Migration auto-bundler** — don't manually edit Drizzle mirror folders
3. **Split by domain** — non-field-ACL in `6-`, field-ACL in `6d-`, academy_admin in `3-`
4. **System group permission editing** — `permissionIds` editable, name/slug/description immutable, delete blocked
5. **Silently ignore name/description** — frontend always sends them; throwing would break add/revoke permission flows
6. **Supervisor = full teacher/student management** — all current permissions granted; comment notes future ones must be added
7. **No new AppPermission enum values** — all permissions already exist
8. **System permissions vs system groups** — individual `isSystem = true` permissions (like `auth.login`) remain immutable
9. **`profile.core_status.edit_other` excluded** — supervisor lacks `view_other` for `core_status`
10. **GraphQL authScope fix** — `permission:` scope checks `isSuperAdmin || hasPermission`; still secure
11. **`applySupervisorNavOverrides` fix** — must not override permission-based filtering for accessible items
12. **`academy_admin` gets `permission_groups.manage`** — enables system group bundle editing
13. **`PAGE_PERMISSIONS.teachers` bug fix** — add `TeachersList` to match `usersTeachers` pattern

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| In-place migration edit may not re-apply on existing databases | `ON CONFLICT DO NOTHING` ensures idempotency |
| System group editability could allow privilege escalation | Only `PERMISSION_GROUPS_MANAGE` holders can edit; name/slug immutable; delete blocked |
| Supervisor getting `staff.view_directory` may show staff they shouldn't see | Intended per issue — supervisors manage all staff types |
| Frontend sends name/description for system group updates | Backend silently ignores them — no error |
| Existing test expects `updateGroup` to throw for system groups | Test updated to expect success |
| `applySupervisorNavOverrides` removal may show items supervisor shouldn't see | Permission-based filtering controls visibility |
| GraphQL authScope change could allow unauthorized access | `permission:` scope still checks `isSuperAdmin || hasPermission` — secure |
| Academy admin getting `permission_groups.manage` + `assign` | Intended — they need it to customize system group bundles |

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

Phases 4 and 5 can run in parallel with Phase 2/3 (different files). Phase 7 must come after all code changes.
