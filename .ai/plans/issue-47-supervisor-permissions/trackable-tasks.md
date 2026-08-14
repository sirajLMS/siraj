# Trackable Tasks: Supervisor Permissions & Manager ACL Customization

**GitHub Issue:** [#47](https://github.com/sirajLMS/siraj/issues/47)

> **Execution Rules:**
> 1. Before ANY task, read ALL existing files in `.ai/plans/issue-47-supervisor-permissions/outcome/`
> 2. After completing a task, create `.ai/plans/issue-47-supervisor-permissions/outcome/<task-id>-outcome.md`
> 3. Mark each checkbox `[ ]` -> `[x]` in this file upon completion
> 4. Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file

> **⚠️ CRITICAL: DO NOT RUN UI TESTS**
> UI tests (`bun run test:ui:components`, `bun run test:ui`, navigation tests in `test/ui/`) MUST be written/updated as part of this implementation but MUST NEVER be run or executed during this implementation. Write the test code, update fixtures and assertions, mark the task complete — but do NOT execute the test runner.

---

## Phase 0: Pre-Implementation Baseline

- [ ] 0.1 Record baseline error counts
  - `bun tsgo 2>&1 | grep "error TS" | wc -l`
  - `bun biome:check`
  - `bun run scripts/lint-service.ts --json --id baseline`
  - _Requirements: NFR-6_

- [ ] 0.2 Create outcome directory at `.ai/plans/issue-47-supervisor-permissions/outcome/`
  - _Requirements: AC-7_

- [ ] 0.3 Write baseline outcome file
  - _Requirements: AC-7_

---

## Phase 1: Database Migrations — Grant Permissions (In-Place Edits)

- [ ] 1.1 Update `backend/db/migration/6-lms-permissions-and-groups.sql`
  - Add comment block above `supervisor_default` INSERT: `-- IMPORTANT: Supervisors are granted ALL current and future teacher/student management permissions. Any new teacher/student management permission MUST be added to this group.`
  - Append to `p.key IN (...)` clause (lines 205-227):
    - `teachers.create`, `teachers.edit`, `teachers.manage_schedule`
    - `students.create`, `students.edit`
    - `student.reassign_teacher`, `student.manage_status`
    - `staff.view_directory`
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/db/migration/6-lms-permissions-and-groups.sql --lifecycle codescene`
  - **AGENTS.md:** `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`
  - _Requirements: AC-1.1-1.3, AC-2.1-2.3, NFR-3, NFR-7_

- [ ] 1.2 Update `backend/db/migration/6d-profile-fine-grained-only.sql`
  - Append 21 `edit_other` field-ACL permissions to `supervisor_default` `p.key IN (...)` clause (lines 305-331):
    - `profile.core_identity.edit_other`, `profile.core_contact.edit_other`
    - `profile.teacher_professional.edit_other`, `profile.teacher_identity.edit_other`
    - `profile.parent_social.edit_other`, `profile.parent_identity.edit_other`
    - `profile.parent_billing.edit_other`, `profile.parent_account.edit_other`
    - `profile.parent_students.edit_other`, `profile.teacher_students.edit_other`
    - `profile.staff_role.edit_other`, `profile.staff_permissions.edit_other`
    - `profile.payment_methods.edit_other`, `profile.meeting_configs.edit_other`
    - `student.student_identity.edit_other`, `student.student_academic.edit_other`
    - `student.student_teacher.edit_other`, `student.student_parent.edit_other`
    - `student.student_schedule.edit_other`, `student.student_history.edit_other`
    - `student.student_quota_edit.edit_other`
  - Do NOT add `profile.core_status.edit_other` (supervisor lacks `view_other` for `core_status`)
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/db/migration/6d-profile-fine-grained-only.sql --lifecycle codescene`
  - **AGENTS.md:** `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`
  - _Requirements: AC-1.4-1.7, AC-2.4-2.5_

- [ ] 1.3 Update `backend/db/migration/3-system_permissions_and_groups.sql` (Blocker C fix)
  - Append to `academy_admin` block `p.key IN (...)` clause (lines 1292-1358):
    - `permission_groups.manage`, `permission_groups.assign`
    - `teachers.edit`, `teachers.list`
    - `students.edit`, `students.change_teacher`, `students.change_status`
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/db/migration/3-system_permissions_and-groups.sql --lifecycle codescene`
  - **AGENTS.md:** `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`
  - _Requirements: AC-4.5, AC-4.1_

- [ ] 1.4 Run `bun db migrate` — auto-bundler generates new Drizzle mirror folders
  - Verify new timestamped folders appear under `backend/drizzle/`
  - Do NOT manually edit existing Drizzle mirror folders
  - _Requirements: NFR-3_

- [ ] 1.5 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/1-outcome.md`
  - _Requirements: AC-7_

---

## Phase 2: Backend — System Group Permission Bundle Editing

- [ ] 2.1 Update `backend/db/repo/permissions/permission-management.repository.ts` — `updateGroup` method
  - **Current (lines 352-354):** `if (existing.isSystem) throw new Error(cannotModifySystemPermissionGroup)` — blocks ALL updates to system groups
  - **New:** Replace the throw with conditional logic:
    - System group + `permissionIds` provided → replace permission bundle only (delete old + insert new)
    - System group + `permissionIds` undefined → return existing group as-is (no-op)
    - System group + only name/description → return existing group as-is (silently ignore)
    - Non-system group → existing behavior (lines 356-399) unchanged
  - Keep `deleteGroup` `isSystem` guard (lines 425-427) unchanged — system groups cannot be deleted
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/db/repo/permissions/permission-management.repository.ts --lifecycle codescene`
  - **AGENTS.md:** `backend/db/repo/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`
  - _Requirements: AC-4.2, AC-4.3, AC-4.4_

- [ ] 2.2 Update `backend/services/auth/permission-management.service.ts` — `updateGroup` method
  - **Current (lines 289-319):** calls `validateGroupName(input.name)` when `input.name` is provided; frontend always sends `name` even for permission-only updates
  - **New:** Fetch group first to check `isSystem`; skip `validateGroupName` for system groups; pass `name: undefined` and `description: undefined` for system groups so repository keeps existing values
  - Use existing `requireGroupExists` helper (line 97-101)
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/services/auth/permission-management.service.ts --lifecycle codescene`
  - **AGENTS.md:** `backend/services/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`
  - _Requirements: AC-4.2, AC-4.3_

- [ ] 2.3 Update test: `backend/db/test/logic/permissions/permission-management.service.test.ts`
  - **Change** test at lines 306-312 (currently expects `updateGroup` on system group to throw `cannotModifySystemPermissionGroup`):
    - New: call `updateGroup` with `permissionIds` → expect SUCCESS — verify permission was added
  - **Add** test: `updateGroup` on system group with `name` change → succeeds but name NOT changed (silently ignored)
  - **Add** test: `updateGroup` on system group with `permissionIds: []` → succeeds and clears all permissions
  - **Keep** test at lines 314-318 (deleteGroup on system group → throws `cannotDeleteSystemPermissionGroup`)
  - Run: `bun run scripts/run-test/run-test.ts backend/db/test/logic/permissions/permission-management.service.test.ts`
  - **AGENTS.md:** `backend/db/test/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`, `tests.instructions.md`
  - _Requirements: AC-4.2, AC-4.3, AC-4.4_

- [ ] 2.4 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/2-outcome.md`
  - _Requirements: AC-7_

---

## Phase 3: Frontend — Enable Permission Editing for System Groups

- [ ] 3.1 `frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.tsx`
  - Remove `isSystem` guard on Edit button (line 154)
  - Quality loop
  - **AGENTS.md:** `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`
  - _Requirements: AC-5.1_

- [ ] 3.2 `frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared.tsx`
  - Remove `isSystem` guard on "Add Permissions" tab (lines 82-84)
  - Remove `isSystem` guard on AddPermissionsTab content (line 113)
  - Quality loop
  - _Requirements: AC-5.2_

- [ ] 3.3 `frontend/common/views/dashboard/permissions/components/__shared__/currentPermissionsTabShared.tsx`
  - Remove `isSystem` guard on "Assign First Permission" button (line 27)
  - Quality loop
  - _Requirements: AC-5.2_

- [ ] 3.4 `frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.desktop.tsx`
  - Enable Edit menu item for system groups (line 66)
  - Keep Delete menu item disabled for system groups (line 74)
  - Quality loop
  - **AGENTS.md:** `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`, `mobile-desktop.instructions.md`
  - _Requirements: AC-5.5_

- [ ] 3.5 `frontend/mobile/views/dashboard/permissions/components/permissionGroupCardList.mobile.tsx`
  - Enable Edit menu item for system groups (line 84)
  - Keep Delete menu item disabled for system groups (line 92)
  - Quality loop
  - **AGENTS.md:** `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`, `mobile-desktop.instructions.md`
  - _Requirements: AC-5.5_

- [ ] 3.6 `frontend/mobile/views/dashboard/permissions/components/currentPermissionsTab.mobile.tsx`
  - Show Revoke button for system groups (line 61)
  - Quality loop
  - _Requirements: AC-5.4_

- [ ] 3.7 Pass `isSystem` flag to edit dialog form
  - Add `readonly isSystem: boolean` to `PermissionGroupFormContentProps` in `permissionGroupForm.types.ts`
  - Pass `isSystem={!!group?.isSystem}` from `PermissionGroupFormShared` to `PermissionGroupFormContentShared` in `permissionGroupFormShared.tsx`
  - Change `disabled={isLoading}` to `disabled={isLoading || isSystem}` on name and description `LocalizedStringFormField` components
  - Quality loop per file
  - **AGENTS.md:** `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`
  - _Requirements: AC-5.3_

- [ ] 3.8 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/3-outcome.md`
  - _Requirements: AC-7_

---

## Phase 4: GraphQL — Fix `superAdmin` authScopes (Blocker B)

- [ ] 4.1 Update `backend/graphql/pothos/students/student-lifecycle.pothos.ts`
  - Line 36: `reassignStudentTeacher` → change `authScopes: { superAdmin: true }` to `authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER }`
  - Line 58: `changeStudentStatus` → change `authScopes: { superAdmin: true }` to `authScopes: { permission: AppPermission.STUDENT_MANAGE_STATUS }`
  - Verify `AppPermission` is imported as a value (not type-only) — check existing imports
  - Quality loop: `bun run scripts/health/sub-loop.ts backend/graphql/pothos/students/student-lifecycle.pothos.ts --lifecycle codescene`
  - **AGENTS.md:** `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `backend/AGENTS.md`
  - **Instructions:** `backend.instructions.md`
  - _Requirements: AC-2.6, AC-2.7_

- [ ] 4.2 Update GraphQL test: `frontend/common/graphql/test/students/student-lifecycle.test.ts`
  - Update tests that verify supervisor/academy_admin denial for `reassignStudentTeacher` and `changeStudentStatus`
  - Add: supervisor with `STUDENT_REASSIGN_TEACHER` permission CAN reassign — succeeds
  - Add: supervisor with `STUDENT_MANAGE_STATUS` permission CAN change status — succeeds
  - Update: academy_admin with `STUDENT_REASSIGN_TEACHER` permission CAN reassign (no longer denied)
  - Keep: teacher/parent/other roles still denied
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/students/student-lifecycle.test.ts`
  - **AGENTS.md:** `frontend/common/graphql/AGENTS.md`
  - **Instructions:** `tests.instructions.md`
  - _Requirements: AC-2.6, AC-2.7_

- [ ] 4.3 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/4-outcome.md`
  - _Requirements: AC-7_

---

## Phase 5: Frontend Navigation — Fix Supervisor Nav + Bug D (Blocker A + D)

- [ ] 5.1 Fix `applySupervisorNavOverrides` in `frontend/common/views/dashboard/config/navigationConfig.ts`
  - Remove `teachers`, `students`, `permissions` from the hardcoded hide set (lines 1017-1038)
  - Let `getNavItemsForPermissions` (permission-based filtering) control their visibility
  - Keep other supervisor overrides intact (hide genuinely admin-only items like `settings`, `whatsapp-settings`, `dst-migration`, `cron`, etc.)
  - Quality loop: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`
  - **AGENTS.md:** `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - **Instructions:** `frontend.instructions.md`
  - _Requirements: AC-3.1, AC-3.3a_

- [ ] 5.2 Fix `PAGE_PERMISSIONS.teachers` bug in `frontend/common/types/page-permissions.types.ts`
  - Change line 50: `teachers: [AppPermission.StaffViewDirectory]` → `teachers: [AppPermission.StaffViewDirectory, AppPermission.TeachersList]`
  - Quality loop: `bun run scripts/health/sub-loop.ts frontend/common/types/page-permissions.types.ts --lifecycle codescene`
  - _Requirements: Bug D_

- [ ] 5.3 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/5-outcome.md`
  - _Requirements: AC-7_

---

## Phase 6: Navigation Tests

> **⚠️ These tests are WRITTEN but NEVER RUN. Do not execute `bun run test:ui:components` or any UI test runner.**

- [ ] 6.1 Update supervisor navigation test: `test/ui/components/supervisorNavigationConfig.test.ts`
  - Add to `SUPERVISOR_PERMISSIONS` array: `StaffViewDirectory`, `TeachersCreate`, `TeachersEdit`, `TeachersManageSchedule`, `StudentsCreate`, `StudentsEdit`, `StudentReassignTeacher`, `StudentManageStatus`
  - Keep all existing permissions in the array
  - Change assertion: `expect(keys).not.toContain("students")` → `expect(keys).toContain("students")`
  - Add assertion: `expect(keys).toContain("teachers")`
  - Keep `expect(keys).not.toContain("permissions")` (supervisor lacks `PermissionGroupsManage`)
  - **DO NOT RUN** these tests — write/update the test code only, never execute `bun run test:ui:components`
  - Quality loop on test file
  - **AGENTS.md:** `test/ui/AGENTS.md`
  - **Instructions:** `tests.instructions.md`, `frontend.instructions.md`
  - _Requirements: AC-3.1, AC-3.2_

- [ ] 6.2 Update academy admin navigation test: `test/ui/components/academyAdminNavigationConfig.test.ts`
  - Add to `ACADEMY_ADMIN_PERMISSIONS` array: `PermissionGroupsManage`, `PermissionGroupsAssign`, `TeachersEdit`, `StudentsEdit`, `TeachersList`
  - Keep all existing permissions
  - Add assertion: `expect(keys).toContain("permissions")`
  - Add assertion: `expect(keys).toContain("teachers")`
  - **DO NOT RUN** these tests — write/update the test code only, never execute `bun run test:ui:components`
  - Quality loop on test file
  - _Requirements: AC-4.5_

- [ ] 6.3 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/6-outcome.md`
  - _Requirements: AC-7_

---

## Phase 7: GraphQL Codegen & Verification

- [ ] 7.1 Run `bun run generate:gqlSchema` — regenerate GraphQL schema from Pothos (verify no schema changes break)
  - _Requirements: NFR-6_

- [ ] 7.2 Run `bun codegen` — regenerate TypeScript types from schema
  - _Requirements: NFR-6_

- [ ] 7.3 Run `bun tsgo` — full type check (must be 0 errors)
  - _Requirements: NFR-6_

- [ ] 7.4 Run `bun lint` — full lint (must be clean)
  - _Requirements: NFR-6_

- [ ] 7.5 Run `bun biome:check` — format/lint check
  - _Requirements: NFR-6_

- [ ] 7.6 Run `bun quality-gate` — full quality gate (tsgo → oxlint → biome → lint → duplicates → codescene → sonar)
  - _Requirements: NFR-6_

- [ ] 7.7 Verify migration applies cleanly
  - Run: `bun db migrate`
  - Query `supervisor_default` group permissions — verify all 29 new permissions present (8 non-field-ACL + 21 field-ACL edit_other)
  - Query `academy_admin` group permissions — verify 7 new permissions present
  - _Requirements: NFR-3, AC-1, AC-2, AC-4_

- [ ] 7.8 Run permission management service tests
  - `bun run scripts/run-test/run-test.ts backend/db/test/logic/permissions/permission-management.service.test.ts`
  - _Requirements: AC-4.2, AC-4.3, AC-4.4_

- [ ] 7.9 **DO NOT RUN** navigation tests — this step is intentionally skipped. UI tests are never run during this implementation.
  - _Requirements: AC-3.1, AC-4.5_

- [ ] 7.10 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/7-outcome.md`
  - _Requirements: AC-7_

---

## Phase 8: Verify Supervisor Access to Teacher/Student Pages

- [ ] 8.1 Verify teachers directory page (`app/(dashboard)/teachers/page.tsx`)
  - Gated on `[STAFF_VIEW_DIRECTORY, TEACHERS_LIST]` (OR) — supervisor has both ✓
  - _Requirements: AC-3.2_

- [ ] 8.2 Verify teacher onboarding page (`app/(dashboard)/teachers/onboarding/page.tsx`)
  - Gated on `TEACHERS_CREATE` — supervisor has it ✓
  - _Requirements: AC-3.4_

- [ ] 8.3 Verify students directory page (`app/(dashboard)/students/page.tsx`)
  - `resolveStudentsPageAudience` checks `STUDENTS_LIST` → admin audience ✓
  - _Requirements: AC-3.3_

- [ ] 8.4 Verify student onboarding page (`app/(dashboard)/students/onboarding/page.tsx`)
  - Gated on `STUDENTS_CREATE` — supervisor has it ✓
  - _Requirements: AC-3.5_

- [ ] 8.5 Verify GraphQL mutations reachable by supervisors:
  - `reassignStudentTeacher` → `permission: AppPermission.STUDENT_REASSIGN_TEACHER` (fixed in Phase 4) ✓
  - `changeStudentStatus` → `permission: AppPermission.STUDENT_MANAGE_STATUS` (fixed in Phase 4) ✓
  - `partiallyUpdateStudent` → `permission: AppPermission.STUDENTS_EDIT` (supervisor has it) ✓
  - `deleteStudent` → `requireStudentManageStatus` checks `STUDENT_MANAGE_STATUS` (supervisor has it) ✓
  - _Requirements: AC-2.6, AC-2.7_

- [ ] 8.6 If any guard uses hardcoded role checks instead of permission checks, fix to permission-based gating
  - Quality loop per modified file
  - _Requirements: NFR-1_

- [ ] 8.7 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/8-outcome.md`
  - _Requirements: AC-7_

---

## Phase 9: Knowledge Propagation

- [ ] 9.1 Create `docs/auth/supervisor-permissions.md`
  - Document: supervisor permission model (full teacher/student management)
  - Document: constraint that new teacher/student permissions MUST be added to `supervisor_default` in `6-lms-permissions-and-groups.sql`
  - Document: system group editability (permission bundles editable, name/slug/description immutable, delete blocked)
  - Document: GraphQL authScope pattern (`permission:` vs `superAdmin:`) — when to use each
  - Document: `applySupervisorNavOverrides` — must not override permission-based filtering for accessible items
  - _Requirements: NFR-6_

- [ ] 9.2 Update `backend/services/AGENTS.md`
  - Add note: system permission groups can have permission bundles edited via `updateGroup` but cannot be renamed/deleted

- [ ] 9.3 Update `backend/graphql/AGENTS.md`
  - Add note: use `authScopes: { permission: AppPermission.X }` not `authScopes: { superAdmin: true }` for mutations accessible by non-superadmin users with the correct permission

- [ ] 9.4 Update root `AGENTS.md` Important References
  - Add `docs/auth/supervisor-permissions.md` reference

- [ ] 9.5 Write outcome file: `.ai/plans/issue-47-supervisor-permissions/outcome/9-outcome.md`
  - _Requirements: AC-7_
