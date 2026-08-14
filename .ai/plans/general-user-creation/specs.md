# Requirements: General User Creation View

## Document Information

- **Feature Name**: general-user-creation
- **Target Directory**: `.ai/plans/general-user-creation`
- **Outcome Directory**: `.ai/plans/general-user-creation/outcome`
- **Version**: 1.0
- **Date**: 2026-08-14
- **Author**: Copilot (spec-driven-development)
- **GitHub Issue**: [#43](https://github.com/sirajLMS/siraj/issues/43)
- **Stakeholders**: Platform administrators, academy admins

## Introduction

The Siraj platform currently uses specialized onboarding flows for Student, Teacher, Parent, and Manager (staff) creation. Each flow collects role-specific metadata (grade level, subjects, national ID, billing config, meeting configuration, etc.). However, there is **no generic user creation path** for administrative roles (`ACADEMY_ADMIN`, `SUPERVISOR`, `STAFF`, `GUEST`) or for newly created custom permission groups (e.g., Quality Auditor, Finance Manager). Administrators must either use the Manager onboarding flow (which only supports `admin`/`manager`/`supervisor` `accountType`) or manually assign permission groups after creation.

This feature implements a **General User Creation Page** at `/users/create` that enables administrators to create new platform users with basic attributes (name, email, phone, password, language preference, account status) and dynamically assign any non-specialized permission group — including custom groups created at runtime.

### Feature Summary

A general-purpose user creation form that accepts basic user attributes and dynamically selects from active non-specialized permission groups, connecting to a new `createGeneralUser` GraphQL mutation backed by the existing `UserOnboardingService.createUserOfType` pipeline.

### Business Value

- Eliminates the need for code changes when new permission groups are created — they automatically appear in the dropdown.
- Provides a single creation entry point for all administrative and non-specialized roles.
- Reduces onboarding friction for roles that don't need specialized metadata collection.

### Scope

**In Scope:**
- New route `/users/create` with a form-based creation view
- New `createGeneralUser` GraphQL mutation + input/result types in Pothos
- New `GeneralUserCreateInput` backend type definition
- Dynamic permission group selector excluding specialized groups (`student_default`, `teacher_default`, `parent_default`)
- i18n support for all form labels, validation messages, and error strings in Arabic and English
- Comprehensive test coverage (service, GraphQL integration, UI component)

**Out of Scope:**
- Specialized onboarding flows (Student, Teacher, Parent, Manager) remain unchanged
- Editing existing users (handled by existing profile edit pages)
- User invitation/email flows (password is set directly during creation)
- Bulk user import
- Custom permission group creation UI (already exists in the permissions management module)

## Requirements

### Requirement 0: Pre-Implementation Baseline & Execution Protocol

**User Story:** As an AI agent or developer, I want to establish an error baseline before implementation and track outcomes persistently, so that I can distinguish new issues from pre-existing ones and avoid repeating past research.

#### Acceptance Criteria

1. WHEN feature implementation begins THEN system SHALL record baseline error counts (`bun tsgo` / `bun biome:check` / `bun run scripts/lint-service.ts --json --id baseline`) to distinguish new from pre-existing issues.
2. WHEN feature implementation begins THEN system SHALL create deferred-items ledger at `.ai/plans/general-user-creation/deferred-items.md` from template to track all deferred work.
3. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/plans/general-user-creation/outcome/` to absorb prior research, search results, and pitfalls.
4. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/plans/general-user-creation/outcome/<task-id>-outcome.md` detailing research findings, implementation details, cross-file dependencies, and carry-over points.
5. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
6. WHEN any file is modified THEN system SHALL execute per-file verification via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit code 0 = pass) on that specific file.
7. WHEN any subtask is marked complete THEN system SHALL complete semantic review checklist (race conditions, env-config, deferred items, cross-layer, enums) before marking `[x]`.

### Requirement 0.5: Translation System & Enum Import Compliance

**User Story:** As a developer implementing user-facing features, I want compile-time type-safe translations and correct enum imports, so that I catch i18n and type errors at build time instead of runtime.

#### Acceptance Criteria (Translation System)

1. WHEN client component renders user-facing text THEN system SHALL use `useAppTranslation(Translation.<Namespace>)` with Translation enum (not string literal).
2. WHEN translation object is accessed THEN system SHALL use property access (`t.propertyName`) NOT function calls (`t('propertyName')`).
3. WHEN server component renders user-facing text THEN system SHALL use `getTranslations(locale)` (single arg) and access namespace as property: `t.Dashboard.FeatureName`.
4. WHEN GraphQL resolver returns user-facing text THEN system SHALL use `ctx.t("namespace")` with string key (already bound to `ctx.locale`).
5. WHEN namespace directory is created THEN system SHALL use lowercase casing (`shared/locale/namespaces/dashboard/users/createUser.namespace.ts`).

#### Acceptance Criteria (Enum Imports)

6. WHEN enum is used in runtime expression THEN system SHALL import as value (not `import type`).
7. WHEN enum is used in conditional/cast/object literal THEN system SHALL import as value.
8. WHEN enum consumer exists THEN system SHALL use enum members NOT string literals.

### Requirement 1: Specialized Group Exclusion Utility

**User Story:** As an administrator, I want the permission group selector to automatically exclude Student, Teacher, and Parent groups, so that I am not offered specialized roles that require dedicated onboarding flows.

#### Acceptance Criteria

1. WHEN the frontend queries permission groups for the general user creation form THEN system SHALL exclude groups whose slug is `student_default`, `teacher_default`, or `parent_default` from the selectable options.
2. WHEN the filter utility runs THEN system SHALL return only groups with slugs not in the `SPECIALIZED_GROUP_SLUGS` set.
3. IF a new specialized group is added in the future THEN developers SHALL add its slug to the `SPECIALIZED_GROUP_SLUGS` constant to exclude it from this view.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: `SystemPermissionGroupSlug` enum in `backend/enum/permissions/permission-group.enum.ts`; existing `permissionGroups` GraphQL query
- **Assumptions**: The `permissionGroups` query already returns all groups without filtering

### Requirement 2: `createGeneralUser` GraphQL Mutation

**User Story:** As an administrator, I want a GraphQL mutation that creates a user with basic attributes and assigns a specified permission group, so that I can create non-specialized users through the API.

#### Acceptance Criteria

1. WHEN an authenticated user with `STAFF_CREATE` permission calls `createGeneralUser` with valid input THEN system SHALL create a new `users` row with the provided name, email, password (hashed), phone, timezone, display currency, and status.
2. WHEN `createGeneralUser` is called THEN system SHALL assign the specified permission group to the new user within the same transaction.
3. WHEN the specified permission group slug is a specialized group (`student_default`, `teacher_default`, `parent_default`) THEN system SHALL reject the request with a localized error.
4. WHEN the specified permission group does not exist THEN system SHALL reject with `permissionGroupNotFound` error.
5. WHEN a user with the provided email already exists THEN system SHALL reject with `userEmailExists` error (defense-in-depth: checked at service layer AND repository layer).
6. WHEN an unauthenticated user calls `createGeneralUser` THEN system SHALL reject with `UNAUTHENTICATED`.
7. WHEN a user without `STAFF_CREATE` permission calls `createGeneralUser` THEN system SHALL reject with `FORBIDDEN`.
8. WHEN a super-admin is impersonating another user and calls `createGeneralUser` THEN system SHALL reject (mutation gated by `notImpersonating: true`).
9. WHEN the user is created THEN system SHALL return the `UserReturnType` (including `id`, `name`, `email`, `status`, `role`).
10. WHEN password validation fails (weak password) THEN system SHALL reject with localized error message.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: `UserOnboardingService.createUserOfType`, `UserRepository.create`, `PermissionManagementRepository.bulkAssignUsersToGroup`
- **Assumptions**: The existing `createUserOfType` pipeline can be reused with a `null` extension (no teacher/parent/student row)

### Requirement 3: Frontend General User Creation View

**User Story:** As an administrator, I want a form page at `/users/create` to create new users with basic attributes and assign a permission group, so that I can onboard non-specialized roles quickly.

#### Acceptance Criteria

1. WHEN an admin navigates to `/users/create` THEN system SHALL render a form with fields: Name, Email, Phone, Password, Permission Group (dropdown), Language Preference (optional), and Account Status (ACTIVATED/DEACTIVATED, default ACTIVATED).
2. WHEN the permission group dropdown is rendered THEN system SHALL query `permissionGroups` and filter out specialized groups via the exclusion utility.
3. WHEN the admin fills the form and submits THEN system SHALL call `createGeneralUser` mutation with the form values.
4. WHEN the mutation succeeds THEN system SHALL show a success toast/snackbar and navigate to `/users` directory or the newly created user's profile.
5. WHEN the mutation fails THEN system SHALL show a localized error snackbar with the error message.
6. WHEN form validation fails (missing required fields, invalid email, weak password) THEN system SHALL show inline validation errors on the respective fields.
7. WHEN the page is accessed by a user without `STAFF_CREATE` permission THEN system SHALL redirect to `/dashboard` or show a forbidden page.
8. WHEN the admin selects a permission group THEN the dropdown SHALL display the group's localized name (or slug if no localized name).
9. WHEN the form is submitted THEN the submit button SHALL show a loading state and be disabled until the response returns.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: React Hook Form + Zod for validation, Apollo `useMutation`, existing `useOnboardingSubmit` pattern, `FormSuccessSnackbar`/`FormErrorSnackbar`
- **Assumptions**: The form follows the existing onboarding form architecture (Container → ViewModel → Shared form body with mobile/desktop variants)

### Requirement 4: i18n Support

**User Story:** As a bilingual user, I want the general user creation form to be fully translated in Arabic and English, so that I can use it in my preferred language.

#### Acceptance Criteria

1. WHEN the feature is accessed THEN system SHALL display all form labels, placeholders, validation messages, section titles, and button text in the user's locale (Arabic or English).
2. WHEN a new translation namespace is created THEN system SHALL define the type interface in `shared/locale/types/dashboard/users/createUser.ts`, the Arabic messages in `shared/locale/ar/dashboard/users/createUser.ts`, the English messages in `shared/locale/en/dashboard/users/createUser.ts`, and the namespace handle in `shared/locale/namespaces/dashboard/users/createUser.namespace.ts`.
3. WHEN server components need translations THEN system SHALL wire the `createUser` labels into the `DashboardTranslations` type and the `arMessages`/`enMessages` assemblies.
4. WHEN client components need translations THEN system SHALL register the namespace handle in the `Translation` constant and export from `shared/locale/namespaces/`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: `shared/locale/` compile-time i18n system
- **Assumptions**: The existing 4-way parallel tree pattern (types/ar/en/namespaces) is followed

### Requirement 5: Testing

**User Story:** As a developer, I want comprehensive tests for the general user creation feature, so that I can verify correctness and prevent regressions.

#### Acceptance Criteria

1. WHEN the service layer is tested THEN system SHALL have unit tests covering: successful creation, duplicate email rejection, invalid permission group, specialized group rejection, permission check failure, and password validation.
2. WHEN the GraphQL layer is tested THEN system SHALL have integration tests covering: successful mutation response, authentication failure, authorization failure, impersonation rejection, and input validation errors.
3. WHEN the frontend is tested THEN system SHALL have component tests covering: form rendering, validation errors, successful submission flow, and error handling.
4. WHEN tests are written THEN database tests SHALL use `runInRollback` wrapper and `createTestUserWithDefaults` helper pattern.
5. WHEN GraphQL integration tests are written THEN tests SHALL use `authenticatedRequest` helper and `loginDemoUser`/`loginAndProvision` pattern.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: `backend/db/test/entity-setup.ts`, `frontend/common/graphql/test/helpers.ts`, `test/ui/components/TestWrapper.tsx`
- **Assumptions**: Tests follow existing patterns from `user-onboarding.service.test.ts` and `teacher-onboarding.test.ts`

## UX/Navigation Requirements (MANDATORY)

### New Routes & Role-Based Access

| Route | Purpose | Permission | Roles with Access |
|-------|---------|------------|-------------------|
| `/users/create` | General user creation form | `STAFF_CREATE` (`AppPermission.STAFF_CREATE`) | SUPER_ADMIN, ACADEMY_ADMIN (via permission group) |

### Sidebar Navigation Integration

- **Group**: `grp_users` (Users group in sidebar)
- **Parent Item**: None — `/users/create` is a standalone page, not a nested nav child
- **Entry Point**: "Create User" button/link on the `/users` directory page (action button in page header)
- **Mobile Bottom Nav**: Not included in bottom nav (admin-only action page, not primary navigation)

### Per-Audience Rendering

| Audience | Prominent Content |
|----------|-------------------|
| Student | N/A — no access |
| Parent | N/A — no access |
| Teacher | N/A — no access |
| Supervisor | N/A — no access (supervisors don't have STAFF_CREATE) |
| Admin/Staff | Full form with all fields and permission group selector |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Navigation | Sidebar item not added; accessed via action button on `/users` | Same — accessed via action button |
| Form Layout | `Box` column flex with `SectionPanel` sections (follows teacher onboarding pattern) | Identical shared form body via `ResponsiveViewSwitch` |
| Permissions | Desktop-specific `DesktopSectionPanel`, `DesktopPageContainer` | Mobile-specific `MobileSectionPanel`, `MobilePageContainer` |

## Non-Functional Requirements

### Performance Requirements
- WHEN the permission group dropdown loads THEN system SHALL fetch groups in under 500ms (uses existing `permissionGroups` query).
- WHEN `createGeneralUser` mutation is called THEN system SHALL complete in under 2s (single user insert + group assignment).

### Security Requirements
- WHEN `createGeneralUser` is called THEN system SHALL enforce `notImpersonating: true` to prevent impersonated users from creating accounts.
- WHEN the form is rendered THEN system SHALL not pre-fill password fields or expose existing user data.
- WHEN the mutation is registered THEN system SHALL use `authScopes: { permission: AppPermission.STAFF_CREATE, notImpersonating: true }`.

### Usability Requirements
- WHEN form validation fails THEN system SHALL show inline error messages on the respective fields (red border + helper text).
- WHEN submission succeeds THEN system SHALL auto-dismiss the success snackbar after 3000ms (matching existing onboarding pattern).

### Reliability Requirements
- WHEN the user is created THEN the users row insert AND permission group assignment SHALL be in the same transaction (atomic — all-or-nothing).

## Constraints and Assumptions

### Technical Constraints
- Must use React Hook Form + Zod for form validation (existing project standard)
- Must use Apollo Client `useMutation` for GraphQL mutation calls
- Must use the compile-time i18n system (no `next-intl`, no hardcoded strings)
- Must follow the existing onboarding Container → ViewModel → Shared form body architecture
- Must use `withPageAuth` HOC for server-side page guard
- Must use `@/` path aliases for all imports
- GraphQL mutation must delegate to services layer, not repositories directly
- No new database tables or migrations needed (uses existing `users` + `user_permission_groups` tables)

### Business Constraints
- Only users with `STAFF_CREATE` permission can access the creation page
- Super-admins bypass permission checks (existing system behavior)
- Specialized roles (Student, Teacher, Parent) must NOT be creatable through this form

### Assumptions
- The existing `permissionGroups` GraphQL query returns all permission groups (no active/inactive filter needed)
- The user's language preference is stored as part of the `users` row (timezone field; no separate language column — language is determined from locale cookie or left as default)
- Password is set directly during creation (no email invitation flow)

## Success Criteria

### Definition of Done
- [ ] All acceptance criteria are met
- [ ] Non-functional requirements are satisfied
- [ ] Integration requirements are fulfilled
- [ ] Testing criteria are passed
- [ ] Quality gate (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`) passes on all modified files
- [ ] `bun run generate:gqlSchema` + `bun codegen` run after schema changes

### Acceptance Metrics
- All service tests pass with `runInRollback` wrapper
- All GraphQL integration tests pass against dev server
- UI component tests pass with Happy DOM
- Zero tsgo errors on new/modified files
- Zero lint errors on new/modified files

## Glossary

| Term | Definition |
|------|------------|
| Specialized Role | A role (Student, Teacher, Parent) that requires dedicated onboarding metadata (grade level, subjects, national ID, billing config, etc.) and has a separate creation flow |
| Permission Group | A named group of permissions (e.g., `academy_admin`, `staff_default`) assigned to users; the user's role is derived from group slugs at runtime via `resolveRoleFromGroupSlugs` |
| Non-Specialized Role | Any role without a dedicated onboarding flow (ACADEMY_ADMIN, SUPERVISOR, STAFF, GUEST, or custom groups like Quality Auditor) |
| General User | A platform user created through the general creation flow, not through a specialized onboarding flow |
| `createUserOfType` | The shared onboarding pipeline in `UserOnboardingService` used by Teacher, Parent, Student, and Manager services; this feature reuses it with no extension row |
