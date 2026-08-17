# Feature Spec: Supervisor Full Teacher/Student Management + Manager ACL Customization

**GitHub Issue:** [sirajLMS/siraj#47](https://github.com/sirajLMS/siraj/issues/47)
**Source Plans:**
- `.kilo/plans/1786716293839-supervisor-permissions-manager-acl.md` (user-authored, 6 phases)
- Deep investigation findings (3 parallel background agents)
- Reconciled plan: `.ai/plans/issue-47-supervisor-permissions/plan.md`

## Problem Statement

Supervisors (`SUPERVISOR` role) currently lack permissions to manage Teacher and Student accounts — they cannot create, edit, or view detailed profiles. Additionally, Manager/Admin roles (`ACADEMY_ADMIN`, `SUPERVISOR`) lack customizable permission assignments: the Permission Management UI blocks all edits to system groups, and `academy_admin` does not have `permission_groups.manage` to access the panel.

### Customer Intent (transcript)

| # | Intent (Arabic) | English Translation |
|---|---|---|
| 1 | "أنا عايزك تخلي المشرف له إنه هو يضيف حسابات معلمين وحسابات طلبة، وأي أكشن عليهم" | "I want the Supervisor to be able to add Teacher accounts and Student accounts, and perform any actions on them." |
| 2 | "عشان أنا مش عارف أضيفها حالياً" | "Because I can't add them currently." |
| 3 | "المسمى بتاع حساب المدير ده ملوش تخصيصات ليه... مفيش حاجة إن أنا أخصصله وظايف شبه دي أو صلاحيات، شبه ما بخصص للمشرف والمعلم والكلام ده؟" | "The Manager account role doesn't have custom permission settings where I can assign functions/permissions similar to how I customize for Supervisors and Teachers." |

## User Stories

### US-1: Supervisor Manages Teachers
As a Supervisor, I want to list, create, edit, and view teacher profiles so that I can fully manage teacher accounts on behalf of the academy.

### US-2: Supervisor Manages Students
As a Supervisor, I want to list, create, edit, view, reassign teachers, and change student status so that I can fully manage student accounts.

### US-3: Manager Role ACL Customization
As a Super Admin (or Academy Admin with `permission_groups.manage`), I want to assign and customize granular permissions for system groups (`academy_admin`, `supervisor_default`) via the Permission Management panel so that I can tailor role-based access control.

## Acceptance Criteria (EARS Format)

### AC-1: Supervisor Teacher Management Permissions
1. WHEN a user with `SUPERVISOR` role accesses the teachers directory THEN the system SHALL display the teacher list (granted via `teachers.list` + `staff.view_directory`).
2. WHEN a Supervisor attempts to create a teacher THEN the system SHALL allow creation via `teachers.create`.
3. WHEN a Supervisor attempts to edit a teacher profile THEN the system SHALL allow editing via `teachers.edit`.
4. WHEN a Supervisor views a teacher's professional fields THEN the system SHALL display them via `profile.teacher_professional.view_other`.
5. WHEN a Supervisor attempts to edit a teacher's professional profile THEN the system SHALL allow it via `profile.teacher_professional.edit_other`.
6. WHEN a Supervisor views a teacher's identity fields THEN the system SHALL display them via `profile.teacher_identity.view_other`.
7. WHEN a Supervisor attempts to edit a teacher's identity fields THEN the system SHALL allow it via `profile.teacher_identity.edit_other`.
8. WHEN a Supervisor runs the `updateTeacherProfile` GraphQL mutation THEN the service layer SHALL NOT reject it.

### AC-2: Supervisor Student Management Permissions
1. WHEN a Supervisor accesses the students directory THEN the system SHALL display the student list via `students.list`.
2. WHEN a Supervisor attempts to create a student THEN the system SHALL allow creation via `students.create`.
3. WHEN a Supervisor attempts to edit a student THEN the system SHALL allow editing via `students.edit`.
4. WHEN a Supervisor views a student's identity fields THEN the system SHALL display them via `student.student_identity.view_other`.
5. WHEN a Supervisor attempts to edit a student's identity fields THEN the system SHALL allow it via `student.student_identity.edit_other`.
6. WHEN a Supervisor calls the `reassignStudentTeacher` GraphQL mutation THEN the system SHALL allow it via `student.reassign_teacher` (permission-based authScope, not `superAdmin: true`).
7. WHEN a Supervisor calls the `changeStudentStatus` GraphQL mutation THEN the system SHALL allow it via `student.manage_status` (permission-based authScope, not `superAdmin: true`).

### AC-3: Supervisor Navigation Visibility (Blocker A fix)
1. WHEN a Supervisor user logs in THEN the sidebar SHALL show `teachers` and `students` navigation items (not hidden by `applySupervisorNavOverrides`).
2. WHEN a Supervisor user views `/teachers` THEN the page SHALL render (not redirect to `/dashboard`).
3. WHEN a Supervisor user views `/students` THEN the page SHALL render as admin audience (not redirect).
4. WHEN a Supervisor views the teachers directory THEN the "Add Teacher" button SHALL be visible and functional.
5. WHEN a Supervisor views the students directory THEN the "Add Student" button SHALL be visible and functional.

### AC-3a: Supervisor Portal Identity Preserved
1. WHEN a Supervisor has both `supervisor.view_dashboard` AND the new teacher/student management permissions THEN the system SHALL still treat them as a Supervisor portal user for dashboard routing (not reclassify as admin).
2. WHEN a Supervisor portal user logs in THEN the system SHALL route to the supervisor dashboard — the `dashboard.view` permission must not be conflated with `dashboard.view_metrics` for role detection.

### AC-4: Manager Role ACL Customization — Backend (Blocker C fix)
1. WHEN a Super Admin accesses the `/permissions` panel THEN the system SHALL display system groups (`academy_admin`, `supervisor_default`) and allow editing their permission bundles.
2. WHEN a Super Admin or Academy Admin calls `updateGroup` on a system group with `permissionIds` THEN the system SHALL update only the permission bundle and NOT the name/slug/description.
3. WHEN a Super Admin or Academy Admin calls `updateGroup` on a system group with `name` changes THEN the system SHALL silently ignore the name change (no error, no change).
4. WHEN any user calls `deleteGroup` on a system group THEN the system SHALL throw `cannotDeleteSystemPermissionGroup` (delete remains blocked).
5. WHEN an Academy Admin (holding `permission_groups.manage`) accesses the `/permissions` panel THEN the system SHALL render it for them.

### AC-5: Manager Role ACL Customization — Frontend
1. WHEN a user with `PERMISSION_GROUPS_MANAGE` views the Permission Groups tab THEN the Edit button SHALL be visible for system groups (not hidden by `isSystem`).
2. WHEN a user views a system group's detail THEN the "Add Permissions" tab SHALL be visible (not hidden by `isSystem`).
3. WHEN a user edits a system group's permissions via the edit dialog THEN the name and description fields SHALL be read-only (disabled), and the permission bundle SHALL be editable.
4. WHEN a user views the current permissions tab for a system group THEN the "Revoke" button SHALL be visible for individual permissions (not hidden by `isSystem`).
5. WHEN a user views the desktop data grid OR mobile card list for permission groups THEN the Edit menu item SHALL be enabled for system groups (only Delete remains disabled).

### AC-6: i18n & Translations
1. WHEN any permission appears in the permission catalog THEN the system SHALL show localized (Arabic + English) descriptions and categories (already exist for all granted permissions — no new enum values).

### AC-7: Outcome Knowledge Base & Progress Tracking
1. WHEN any implementation task completes THEN the executing agent SHALL create an outcome file at `.ai/plans/issue-47-supervisor-permissions/outcome/<task-id>-outcome.md`.
2. WHEN any implementation task completes THEN the executing agent SHALL update the task checkbox `[ ]` -> `[x]` in `trackable-tasks.md`.

## Non-Functional Requirements

- **NFR-1 (Security — 3-tier model)**: The 3-tier permission model (server page guard -> service/GraphQL layer -> client `RequirePermission`) MUST be preserved. No tier may be bypassed.
- **NFR-2 (Backward Compatibility)**: Existing permissions for `SUPER_ADMIN`, `TEACHER`, `PARENT`, `STUDENT`, `STAFF` MUST NOT be reduced. Only additive grants to `SUPERVISOR_DEFAULT` and `ACADEMY_ADMIN`.
- **NFR-3 (Migration Safety)**: All in-place migration edits MUST be idempotent (`ON CONFLICT DO NOTHING`). The migration auto-bundler (`applyCustomMigrations.ts`) generates new Drizzle mirror folders from changed raw SQL files — do NOT manually edit existing Drizzle mirror folders.
- **NFR-4 (No New Enum Values)**: All permissions being granted already exist in the `AppPermission` enum. No new enum values are introduced.
- **NFR-5 (No Portal Reclassification)**: The supervisor portal user detection and `applySupervisorNavOverrides` MUST be updated to NOT hide `teachers`, `students`, `permissions` for supervisor portal users, while still hiding genuinely admin-only items.
- **NFR-6 (Quality Gates)**: Every modified file MUST pass `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`.
- **NFR-7 (In-place migration edit)**: The existing SQL migration files MUST be updated in-place (NOT new migrations), per user constraint. Add a comment block noting that supervisors are granted ALL current and future teacher/student management permissions.
- **NFR-8 (No UI Test Execution)**: UI tests (`bun run test:ui:components`, `bun run test:ui`, navigation tests in `test/ui/`) MUST be written/updated as part of this implementation but MUST NEVER be run or executed. The test code is written, fixtures and assertions are updated, but the test runner is not invoked.

## Current Permission State

### supervisor_default (from `6-lms-permissions-and-groups.sql`)
- `lesson_reports.review/approve/reject`, `supervisor.view_dashboard`, `monthly_reports.view`
- `teacher_dues.view/mark_paid`, `dashboard.view`
- `schedule.view_list/view_assigned`, `session.view_details`
- `history.view_calendar/view_details`, `teachers.list`, `students.list`
- `complaints.list/respond`, `notification.view_alerts`
- Field ACL `view_own` and `view_other` for all profile/student groups (from `6d-profile-fine-grained-only.sql`)

### MISSING permissions to grant:

**Non-field-ACL (go in `6-lms-permissions-and-groups.sql`):**
- `teachers.create`, `teachers.edit`, `teachers.manage_schedule`
- `students.create`, `students.edit`
- `student.reassign_teacher`, `student.manage_status`
- `staff.view_directory`

**Field-ACL `edit_other` (go in `6d-profile-fine-grained-only.sql`):**
- All `profile.*.edit_other` for field groups where supervisor already has `view_other` (15 groups)
- All `student.student_*_edit_other` (6 groups)
- Excludes `profile.core_status.edit_other` (supervisor lacks `view_other` for `core_status`)

### academy_admin (from `3-system_permissions_and-groups.sql`)
**MISSING permissions to grant:**
- `permission_groups.manage`, `permission_groups.assign`
- `teachers.edit`, `teachers.list`
- `students.edit`, `students.change_teacher`, `students.change_status`

## Scope

### In Scope
- In-place SQL migration edits granting existing permissions to `supervisor_default` and `academy_admin`
- Backend `updateGroup` repo + service: allow system group permission bundle editing (silently ignore name/description/slug)
- Backend `updateGroup` tests: system group permission editing succeeds, name ignored, delete still blocked
- Frontend: remove `isSystem` guards from ~9 permission management UI components (edit buttons, tabs, revoke buttons)
- Frontend: make name/description read-only for system groups in edit dialog
- GraphQL: relax `reassignStudentTeacher` and `changeStudentStatus` authScopes from `superAdmin: true` to permission-based
- Frontend: fix `applySupervisorNavOverrides` to not hide `teachers`, `students`, `permissions` from supervisors
- Frontend: fix `PAGE_PERMISSIONS.teachers` bug (add `TeachersList`)
- Navigation tests: WRITE/UPDATE supervisor and academy_admin test fixtures + assertions (**DO NOT RUN** these tests — they are written but never executed during this implementation)
- GraphQL codegen + full quality gate verification
- Knowledge propagation docs + AGENTS.md updates

### Out of Scope
- Adding NEW permission enum values (all already exist)
- Changing the permission group structure or creating new groups
- Changes to teacher/student onboarding flows (services already check `TEACHERS_CREATE` / `STUDENTS_CREATE`)
- Changes to `createManager`/`createSupervisor` mutations (already `superAdmin: true` — appropriate)
- Frontend page redesign
