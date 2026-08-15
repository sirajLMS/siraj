# Manager Role Mapping & Permissions Fix — Requirements

## Document Information

- **Feature Name**: Manager Role Mapping & Permissions Fix
- **Target Directory**: `.ai/plans/manager-role-permissions-fix`
- **Outcome Directory**: `.ai/plans/manager-role-permissions-fix/outcome`
- **Version**: 1.0
- **Date**: 2026-08-15
- **Author**: Copilot
- **Stakeholders**: Super Admin (sole user of onboarding flow)
- **Related Documents**: `.ai/todo/manager-role-permissions-fix.md`

## Introduction

When a Super Admin creates a new user via the staff onboarding form with account type **Manager (`مدير`)**, the system assigns the `STAFF_DEFAULT` permission group. As a result, the user is labeled "موظف" (Employee) across the UI and receives restricted staff-level permissions — unable to manage teachers, students, schedules, billing, classes, or invoices.

The `admin` account type currently maps to `ACADEMY_ADMIN` (full operational access), but the customer wants the **Manager** option to be the one that gives full administrative access. Per user decision: **`manager` replaces `admin`** as the sole entry point to `ACADEMY_ADMIN`; the `admin` option is removed from the onboarding form entirely.

### Feature Summary

Map the `manager` account type to `ACADEMY_ADMIN` permission group, update the group's display name to "مدير الأكاديمية" / "Manager", and remove the redundant `admin` option from the onboarding enum.

### Business Value

Managers (مدير) will have full operational control over the academy — teachers, students, schedules, billing — except permission control. They will be correctly labeled as "مدير الأكاديمية" instead of "موظف".

### Scope

**Included:**
- Remove `admin` from `ManagerAccountType` enum; `manager` becomes sole path to `ACADEMY_ADMIN`
- Update `resolveTargetGroupSlug` to map `manager` → `ACADEMY_ADMIN`
- Update `academy_admin` permission group `name` via SQL migration to `{"ar": "مدير الأكاديمية", "en": "Manager"}`
- Update `resolveRoleCondition` so `"manager"` role filter matches `%admin%` slugs
- Update i18n: remove `admin` entries, relabel `manager` to "مدير الأكاديمية"
- Update frontend onboarding form: remove `Admin` option
- Update all affected tests
- Audit `academy_admin` permission grants

**Excluded:**
- Backfill of existing `staff_default` users (onboarding-flow fix only, not a data migration)
- Changes to `supervisor` account type (unchanged)
- Changes to `super_admin` group (unchanged)
- Adding new permissions to `academy_admin` (audit only — investigation confirms exclusions already in place)

## Requirements

### Requirement 0: Pre-Implementation Baseline & Execution Protocol

**User Story:** As an AI agent or developer, I want to establish an error baseline before implementation and track outcomes persistently, so that I can distinguish new issues from pre-existing ones and avoid repeating past research.

#### Acceptance Criteria

1. WHEN feature implementation begins THEN system SHALL record baseline error counts (`bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id baseline`) to distinguish new from pre-existing issues.
2. WHEN feature implementation begins THEN system SHALL create deferred-items ledger at `.ai/plans/manager-role-permissions-fix/deferred-items.md`.
3. WHEN an executing agent starts any task THEN system SHALL read ALL existing files in `.ai/plans/manager-role-permissions-fix/outcome/`.
4. WHEN an executing agent completes any task THEN system SHALL write `.ai/plans/manager-role-permissions-fix/outcome/<task-id>-outcome.md`.
5. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` → `[x]` in `tasks.md`.
6. WHEN any file is modified THEN system SHALL execute `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on that file.
7. WHEN any subtask is marked complete THEN system SHALL complete semantic review checklist before marking `[x]`.

### Requirement 0.5: Translation System & Enum Import Compliance

**User Story:** As a developer implementing user-facing features, I want compile-time type-safe translations and correct enum imports, so that I catch i18n and type errors at build time instead of runtime.

#### Acceptance Criteria

1. WHEN client component renders user-facing text THEN system SHALL use `useAppTranslation(Translation.<Namespace>)` with Translation enum.
2. WHEN translation object is accessed THEN system SHALL use property access (`t.propertyName`) NOT function calls.
3. WHEN enum is used in runtime expression THEN system SHALL import as value (not `import type`).
4. WHEN enum consumer exists THEN system SHALL use enum members NOT string literals.

### Requirement 1: Manager Account Type Maps to ACADEMY_ADMIN

**User Story:** As a Super Admin, when I create a new user with the "Manager" (مدير) account type, I want them to be assigned full administrative permissions (except permission control), so that they can manage teachers, students, schedules, billing, classes, and invoices.

#### Acceptance Criteria

1. WHEN Super Admin submits the staff onboarding form with `accountType: "manager"` THEN system SHALL assign the user to the `academy_admin` permission group (slug `academy_admin`).
2. WHEN `ManagerOnboardingService.createManager` is called with `accountType: "manager"` THEN the returned `assignedGroupSlug` SHALL be `"academy_admin"`.
3. WHEN `ManagerOnboardingService.createManager` is called with `accountType: "supervisor"` THEN the returned `assignedGroupSlug` SHALL be `"supervisor_default"` (unchanged).
4. WHEN a Manager user is assigned to `academy_admin` THEN the system SHALL NOT grant: `permission_groups.manage`, `permission_groups.assign`, `profile.staff_permissions.edit_other`, `profile.staff_permissions.edit_own`, `settings.edit_env`. (Verified: already excluded.)

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: None
- **Assumptions**: `academy_admin` permission grants already include all operational permissions and exclude permission-control permissions (confirmed by investigation).

### Requirement 2: Remove `admin` from ManagerAccountType Enum

**User Story:** As a Super Admin, when I use the onboarding form, I want only two account types: "Manager" (مدير الأكاديمية) and "Supervisor" (مشرف), so that the "Admin" (مسؤول) option is removed since it was redundant with Manager.

#### Acceptance Criteria

1. WHEN Super Admin submits the onboarding form THEN system SHALL NOT offer `accountType: "admin"` as an option (the enum value is removed from `ManagerAccountType`).
2. WHEN GraphQL schema is regenerated THEN `enum ManagerAccountType` SHALL contain only `manager` and `supervisor` values.
3. WHEN `SystemAccessSection.tsx` renders THEN it SHALL display exactly two account type options: Manager and Supervisor.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Requirement 1
- **Assumptions**: Breaking GraphQL change is acceptable because only `superAdmin` can invoke `createManager`, no mobile/external clients send this value.

### Requirement 3: Academy Admin Group Display Name

**User Story:** As a Manager (مدير), when I view my profile, I want to see my role displayed as "مدير الأكاديمية" / "Manager", so that I am not labeled as "موظف" (Employee) or "المسؤول" (Admin).

#### Acceptance Criteria

1. WHEN the `academy_admin` permission group's `name` is rendered THEN system SHALL display `{"ar": "مدير الأكاديمية", "en": "Manager"}` as the localized role label.
2. WHEN the `academy_admin` permission group's `description` is rendered THEN system SHALL display `{"ar": "وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات", "en": "Full system access for managing teachers, students, schedules, and billing — except permission control"}`.
3. WHEN a Manager user views their profile THEN the role label in the profile header and "Role Information" section SHALL display "مدير الأكاديمية" / "Manager" (resolved from `permissionGroups.name` JSONB).
4. WHEN profile permissions chips render THEN the group name SHALL display "مدير الأكاديمية" / "Manager" (resolved from `group.name` JSONB).

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Requirement 1
- **Assumptions**: The `name` JSONB column in `permission_groups` is the single source of truth for role display labels in profile and permissions chips.

### Requirement 4: Staff Directory Manager Filter

**User Story:** As a Super Admin, when I browse the staff directory, I want managers to appear under the "Manager" (مدير) filter with the correct role chip, so that I can distinguish managers from supervisors and other staff.

#### Acceptance Criteria

1. WHEN the staff directory is filtered with `roleFilter: "manager"` THEN system SHALL return users with permission group slugs matching `%admin%` (i.e., `academy_admin`-grouped users).
2. WHEN the staff directory grid renders a row whose `roleSlug` contains `"admin"` (e.g., `academy_admin`) THEN the role chip SHALL display "Manager" / "مدير الأكاديمية" (via the `t.roles.admin` i18n key).
3. WHEN `getManagerDirectoryMetrics` computes `totalAdmin` THEN it SHALL count users with `%admin%` slugs (now includes managers).
4. WHEN `getManagerDirectoryMetrics` computes `systemStaff` THEN it SHALL count users with `NOT ILIKE %admin%` slugs (now excludes managers).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Requirement 1

### Requirement 5: i18n Updates

**User Story:** As a Super Admin, when I view the onboarding form and onboarding descriptions, I want the Manager option to be labeled "مدير الأكاديمية" with an accurate description, so that I understand what permissions a Manager has.

#### Acceptance Criteria

1. WHEN the onboarding form renders the Manager option in Arabic THEN the label SHALL be "مدير الأكاديمية".
2. WHEN the onboarding form renders the Manager option in English THEN the label SHALL be "Manager".
3. WHEN the onboarding form renders the Manager description in Arabic THEN it SHALL display "وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات".
4. WHEN the onboarding form renders the Manager description in English THEN it SHALL display "Full system access for managing teachers, students, schedules, and billing — except permission control".
5. WHEN the locale type schema is compiled THEN `accountType` and `accountTypeDescriptions` interfaces SHALL NOT contain `admin` keys.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Requirement 2

### Requirement 6: Permission Seed Audit

**User Story:** As a developer, I want to verify that the `academy_admin` group contains all operational permissions and excludes permission-control permissions, so that the customer's requirement of "all permissions except permission control" is met.

#### Acceptance Criteria

1. WHEN the `academy_admin` group permissions are audited THEN the system SHALL document that all operational permissions (teachers, students, parents, schedules, sessions, billing, invoices, resources, complaints, suggestions, reports, lesson_reports, credits, teacher_dues, quotas) are granted.
2. WHEN the `academy_admin` group permissions are audited THEN the system SHALL document that `permission_groups.manage`, `permission_groups.assign`, `profile.staff_permissions.edit_other`, `profile.staff_permissions.edit_own`, `settings.edit_env` are NOT granted.
3. WHEN the audit is complete THEN findings SHALL be documented in an outcome file.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Requirement 1 (migration)

## UX/Navigation Requirements

**No new routes.** This is a behavioral change to existing flows:

| Route | Component | Change | Permission |
|-------|-----------|--------|------------|
| `/[locale]/dashboard/staff` (staff directory) | `ManagersContainer` | Manager filter shows `academy_admin` users; role chip shows "Manager" | `loggedIn` |
| `/[locale]/dashboard/staff` (onboarding) | `SystemAccessSection` | Only 2 options: Manager, Supervisor (no Admin) | `superAdmin` |
| `/[locale]/dashboard/profile` | `ProfileHeader` | Staff profile shows role as "مدير الأكاديمية" | `loggedIn` |

### Per-Audience Rendering

| Audience | Prominent Content |
|----------|-------------------|
| Super Admin | Sees 2 account types in onboarding (Manager, Supervisor); staff directory "Manager" filter shows academy_admin users |
| Academy Admin (Manager) | Profile shows "مدير الأكاديمية"; has all operational permissions except permission control |
| Supervisor | Unchanged — still maps to `supervisor_default` |
| Teacher/Parent/Student | Not affected — cannot access onboarding flow |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Onboarding form | `SystemAccessSection` renders 2 radio cards | Same component, responsive layout |
| Staff directory grid | `managersDataGrid.desktop.tsx` uses `t.roles[role]` | `managersCardList.mobile.tsx` uses same i18n keys |

## Constraints and Assumptions

### Technical Constraints
- Breaking GraphQL change: `admin` value removed from `ManagerAccountType` enum — acceptable (super-admin-only internal tool)
- `permission_groups.name` is JSONB `{"ar": "...", "en": "..."}` — must be valid JSON
- Drizzle migrations use custom SQL folders (no snapshot-based generate for seed data)

### Business Constraints
- No commit, no push (per user request)
- No backfill of existing `staff_default` users

### Assumptions
- `academy_admin` group already has correct permission grants (confirmed by investigation)
- `mapManagerRole` frontend function needs no code change — `%admin%` slug still maps to `"admin"` bucket; only i18n label changes
- No mobile/external clients send `accountType: "admin"` in production

## Success Criteria

### Definition of Done
- [ ] All acceptance criteria are met
- [ ] `bun run tsgo` passes with zero errors
- [ ] `bun run lint` passes with zero errors
- [ ] `bun quality-gate` passes
- [ ] All affected tests pass

### Acceptance Metrics
- Manager onboarding assigns `academy_admin` group (verified by service test)
- `academy_admin` group `name` = `{"ar": "مدير الأكاديمية", "en": "Manager"}` (verified by migration)
- `ManagerAccountType` enum has only `manager` and `supervisor` (verified by codegen)
- Staff directory "Manager" filter returns `academy_admin` users (verified by repo test)

## Glossary

| Term | Definition |
|------|------------|
| `ManagerAccountType` | Enum with values `manager`, `supervisor` (was `admin`, `manager`, `supervisor`) |
| `ACADEMY_ADMIN` | Permission group slug for full operational access (except permission control) |
| `STAFF_DEFAULT` | Permission group slug for restricted staff access |
| `SUPERVISOR_DEFAULT` | Permission group slug for supervisor access |
| `resolveTargetGroupSlug` | Function mapping `ManagerAccountType` → `SystemPermissionGroupSlug` |
| `resolveRoleCondition` | Function building Drizzle filter for staff directory role filter |
| `mapManagerRole` | Frontend function mapping `roleSlug` → coarse role bucket (`"admin"` / `"manager"` / `"supervisor"`) |
