# Implementation Tasks: Super Admin User Entity Management (Status + Password Reset)

## Task Structure
Each task includes:
- Implementation details
- Files to create/modify
- Quality loop requirements
- Instruction verification requirements
- Requirement references

---

## Phase 0: Pre-Implementation Baseline

- [ ] 0.1 **Record Baseline Error Counts**
  - Run `bun tsgo 2>&1 | grep "error TS" | wc -l > /tmp/baseline-tsgo.txt`
  - Run `bun biome:check 2>&1 | grep -c "warn" > /tmp/baseline-biome.txt`
  - Run `bun run scripts/lint-service.ts --json --id baseline > /tmp/baseline-lint.json`
  - Document baseline in outcome file
  - _Requirements: Feature 6 (Outcome Knowledge Base)_

---

## Phase 1: Database & Permissions

- [ ] 1.1 **Create Database Migration for New Permission**
  - Create migration file: `backend/db/migration/XX-user-admin-reset-password.sql`
  - Add `user.admin_reset_password` permission
  - Grant to `super_admin` group
  - Run migration: `bun db migrate` (custom SQL migration, not schema push)
  - _Requirements: AC-16, AC-6_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f <migration-file> --id verify`
  - **Instruction Verification**: `backend/db/schema/AGENTS.md`, `.agents/instructions/backend.instructions.md`

- [ ] 1.2 **Add Permission to Enum**
  - Modify: `backend/enum/permissions/permission.enum.ts`
  - Add `USER_ADMIN_RESET_PASSWORD = "user.admin_reset_password"`
  - _Requirements: AC-16_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/enum/permissions/permission.enum.ts --id verify`
  - **Instruction Verification**: `backend/enum/AGENTS.md`, `.agents/instructions/backend.instructions.md`

---

## Phase 2: Backend Types

- [ ] 2.1 **Extend CoreUserProfileFields with Status**
  - Modify: `backend/types/profile/profile.types.ts`
  - Add `readonly status?: AccountStatus | null` to `CoreUserProfileFields`
  - _Requirements: AC-1, AC-2, AC-3_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/types/profile/profile.types.ts --id verify`
  - **Instruction Verification**: `backend/types/AGENTS.md`, `.agents/instructions/backend.instructions.md`

- [ ] 2.2 **Add Admin Password Reset Types**
  - Modify: `backend/types/auth/auth.types.ts`
  - Add `AdminResetPasswordInput` and `AdminResetPasswordResult` types
  - _Requirements: AC-7, AC-8, AC-9, AC-10, AC-13_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/types/auth/auth.types.ts --id verify`
  - **Instruction Verification**: `backend/types/AGENTS.md`, `.agents/instructions/backend.instructions.md`

---

## Phase 3: GraphQL Schema (Pothos)

- [ ] 3.1 **Extend CoreUserProfileFieldsInput with Status**
  - Modify: `backend/graphql/pothos/profile/profile.pothos.ts`
  - Add `status` field to `CoreUserProfileFieldsInputPothosObject` using `AccountStatusPothosObject`
  - _Requirements: AC-1, AC-2_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/graphql/pothos/profile/profile.pothos.ts --id verify`
  - **Instruction Verification**: `backend/graphql/pothos/AGENTS.md`, `.agents/instructions/backend.instructions.md`

- [ ] 3.2 **Add Admin Password Reset Input/Output Types**
  - Modify: `backend/graphql/pothos/auth/auth.pothos.ts`
  - Add `AdminResetPasswordInputPothosObject` and `AdminResetPasswordResultPothosObject`
  - _Requirements: AC-7, AC-8, AC-9, AC-10, AC-13_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/graphql/pothos/auth/auth.pothos.ts --id verify`
  - **Instruction Verification**: `backend/graphql/pothos/AGENTS.md`, `.agents/instructions/backend.instructions.md`

---

## Phase 4: Backend Services

- [ ] 4.1 **Extend ProfileService for Status Update**
  - Modify: `backend/services/profile/profile.service.ts`
  - In `updateCoreUserFields()`: Add status handling with permission check (`PROFILE_CORE_IDENTITY_EDIT_OTHER`)
  - Call `UserRepository.updateStatus()`
  - Add audit log via `AdminAuditLogService.log("USER_STATUS_CHANGED", { newStatus })`
  - _Requirements: AC-2, AC-3, AC-4, AC-14_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/services/profile/profile.service.ts --id verify`
  - **Instruction Verification**: `backend/services/AGENTS.md`, `.agents/instructions/backend.instructions.md`

- [ ] 4.2 **Add Admin Password Reset to AuthPasswordService**
  - Modify: `backend/services/auth/auth-password.service.ts`
  - Add `adminResetPassword(actorUserId, targetUserId, input, locale)` method
  - Permission check: `USER_ADMIN_RESET_PASSWORD`
  - Self-restriction: throw if `actorUserId === targetUserId`
  - Validate target user exists
  - Validate password strength
  - Hash password and call `UserRepository.updatePassword()`
  - Audit log: `AdminAuditLogService.log("USER_PASSWORD_RESET_BY_ADMIN", { emailSent })`
  - Optional email: `CommunicationService.dispatch()` with `NotificationEventType.PASSWORD_RESET_BY_ADMIN`
  - Return `{ success: true, emailSent }`
  - _Requirements: AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-15_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/services/auth/auth-password.service.ts --id verify`
  - **Instruction Verification**: `backend/services/AGENTS.md`, `.agents/instructions/backend.instructions.md`

---

## Phase 5: GraphQL Mutations

- [ ] 5.1 **Create Admin Password Reset Mutation**
  - Create: `backend/graphql/mutation/auth/admin-password.mutation.ts` (NEW FILE)
  - Register `adminResetPassword` mutation with:
    - Type: `AdminResetPasswordResultPothosObject`
    - Auth scopes: `{ permission: AppPermission.USER_ADMIN_RESET_PASSWORD, notImpersonating: true }`
    - Args: `input: AdminResetPasswordInputPothosObject`
    - Resolver: calls `AuthPasswordService.adminResetPassword()`
  - _Requirements: AC-7, AC-8, AC-11, AC-12, AC-15_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/graphql/mutation/auth/admin-password.mutation.ts --id verify`
  - **Instruction Verification**: `backend/graphql/mutation/AGENTS.md`, `.agents/instructions/backend.instructions.md`

- [ ] 5.2 **Register New Mutation in Auth Barrel**
  - Modify: `backend/graphql/mutation/auth/index.ts`
  - Add `import "./admin-password.mutation";`
  - _Requirements: AC-7_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/graphql/mutation/auth/index.ts --id verify`
  - **Instruction Verification**: `backend/graphql/mutation/AGENTS.md`, `.agents/instructions/backend.instructions.md`

- [ ] 5.3 **Verify updateUserProfile Works with Status (No Code Change)**
  - Verify existing `updateUserProfile` mutation in `backend/graphql/mutation/profile/profile.mutation.ts` accepts `UpdateUserProfileInput` with `core.status`
  - No modification needed - should work automatically
  - _Requirements: AC-1, AC-2, AC-14_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f backend/graphql/mutation/profile/profile.mutation.ts --id verify`

---

## Phase 6: Code Generation & Schema

- [ ] 6.1 **Generate GraphQL Schema**
  - Run: `bun run generate:gqlSchema`
  - Verify schema includes new mutation and status field
  - _Requirements: All_
  - **Quality Loop**: `bun tsgo`

- [ ] 6.2 **Generate Frontend Types**
  - Run: `bun codegen`
  - Verify generated types include `AdminResetPasswordMutation` and `CoreUserProfileFields` with status
  - _Requirements: All_
  - **Quality Loop**: `bun tsgo`

---

## Phase 7: Frontend - Hooks & Shared Components

- [ ] 7.1 **Extend useProfileFieldAccess Hook**
  - Modify: `frontend/common/views/dashboard/profile/shared/useProfileFieldAccess.ts`
  - Add `canEditStatus()` function checking `PROFILE_CORE_IDENTITY_EDIT_OTHER`/`EDIT_OWN`
  - Add `canAdminResetPassword()` function checking `USER_ADMIN_RESET_PASSWORD`
  - Return both in hook result
  - _Requirements: AC-17, AC-18_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/views/dashboard/profile/shared/useProfileFieldAccess.ts --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

- [ ] 7.2 **Create ResetPasswordDialog Component**
  - Create: `frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.tsx` (NEW FILE)
  - Form with: newPassword, confirmPassword, sendNotificationEmail checkbox
  - Uses `adminResetPasswordMutationDocument` from shared documents
  - Validation: password match, required fields
  - Loading state, error handling, success callback
  - i18n via `useAppTranslation(Translation.Profile.Base)` and `Translation.Errors`
  - **MUI v9 Compliance**: All styling via `sx` prop (no direct style props like `mb`, `mt`, `p`, `fontWeight`, etc.)
  - **React 19**: Use `React.SubmitEvent<HTMLFormElement>` for form submit handler
  - _Requirements: AC-7, AC-9, AC-10, AC-17_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.tsx --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

- [ ] 7.3 **Add Admin Reset Password GraphQL Document**
  - Create: `frontend/common/graphql/sharedDocuments/auth/admin-password.documents.ts` (NEW FILE)
  - Define `adminResetPasswordMutationDocument` with typed variables
  - Export for use in components
  - _Requirements: AC-7_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/graphql/sharedDocuments/auth/admin-password.documents.ts --id verify`
  - **Instruction Verification**: `frontend/common/graphql/sharedDocuments/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

- [ ] 7.4 **Register New Document in Shared Documents Barrel**
  - Modify: `frontend/common/graphql/sharedDocuments/index.ts`
  - Export `adminResetPasswordMutationDocument`
  - _Requirements: AC-7_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/graphql/sharedDocuments/index.ts --id verify`

---

## Phase 8: Frontend - Profile Admin Sections (Per User Type)

- [ ] 8.1 **Parent Profile - AccountSection**
  - Modify: `frontend/common/views/dashboard/profile/parent/sections/AccountSection.tsx`
  - Add status dropdown (AccountStatus enum) when `canEditStatus()` and `isAdminScope`
  - Add "Reset Password" button when `canAdminResetPassword()` and `isAdminScope`
  - Integrate `ResetPasswordDialog` for password reset
  - Include status in form submit data
  - **MUI v9 Compliance**: All styling via `sx` prop
  - **React 19**: Use `React.SubmitEvent<HTMLFormElement>` for form handlers
  - _Requirements: AC-1, AC-7, AC-14, AC-17, AC-18_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/views/dashboard/profile/parent/sections/AccountSection.tsx --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

- [ ] 8.2 **Teacher Profile - AdminOnlySection**
  - Modify: `frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection.tsx`
  - Add status dropdown when `canEditStatus()` and `isAdminScope`
  - Add "Reset Password" button when `canAdminResetPassword()` and `isAdminScope`
  - Integrate `ResetPasswordDialog`
  - Include status in form submit data
  - _Requirements: AC-1, AC-7, AC-14, AC-17, AC-18_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection.tsx --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

- [ ] 8.3 **Staff Profile - AccountSection**
  - Modify: `frontend/common/views/dashboard/profile/staff/sections/AccountSection.tsx`
  - Add status dropdown when `canEditStatus()` and `isAdminScope`
  - Add "Reset Password" button when `canAdminResetPassword()` and `isAdminScope`
  - Integrate `ResetPasswordDialog`
  - Include status in form submit data
  - _Requirements: AC-1, AC-7, AC-14, AC-17, AC-18_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/views/dashboard/profile/staff/sections/AccountSection.tsx --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

- [ ] 8.4 **Student Profile - Admin Section**
  - Identify/create student profile admin section file
  - Add status dropdown (AccountStatus, NOT StudentStatus) when `canEditStatus()` and `isAdminScope`
  - Add "Reset Password" button when `canAdminResetPassword()` and `isAdminScope`
  - Integrate `ResetPasswordDialog`
  - _Requirements: AC-1, AC-7, AC-14, AC-17, AC-18_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f <student-admin-section-file> --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

- [ ] 8.5 **Supervisor Profile - Admin Section**
  - Identify/create supervisor profile admin section file
  - Add status dropdown when `canEditStatus()` and `isAdminScope`
  - Add "Reset Password" button when `canAdminResetPassword()` and `isAdminScope`
  - Integrate `ResetPasswordDialog`
  - _Requirements: AC-1, AC-7, AC-14, AC-17, AC-18_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f <supervisor-admin-section-file> --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

---

## Phase 9: Translation Keys

- [ ] 9.1 **Add English Translations**
  - Modify: `shared/locale/en/profile.ts` (TypeScript module, not JSON)
  - Add keys: `resetPassword`, `newPassword`, `confirmPassword`, `sendNotificationEmail`, `accountStatus`, `statusActivated`, `statusDeactivated`, `passwordResetSuccess`, `passwordResetFailed`, `cannotResetOwnPasswordViaAdmin`
  - Follow namespace registration process (see Task 9.3)
  - _Requirements: AC-7, AC-9, AC-17_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f shared/locale/en/profile.ts --id verify`
  - **Instruction Verification**: `shared/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

- [ ] 9.2 **Add Arabic Translations**
  - Modify: `shared/locale/ar/profile.ts` (TypeScript module, not JSON)
  - Add Arabic translations for all new keys
  - Follow namespace registration process (see Task 9.3)
  - _Requirements: AC-7, AC-9, AC-17_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f shared/locale/ar/profile.ts --id verify`
  - **Instruction Verification**: `shared/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

- [ ] 9.3 **Register Translation Namespace (Required for New Keys)**
  - Add interface to `shared/locale/types/profile/index.ts` with new keys
  - Add implementations to `shared/locale/en/profile.ts` and `shared/locale/ar/profile.ts` (Tasks 9.1, 9.2)
  - Export in `shared/locale/types/message.ts` (add to `MessageSchema`)
  - Add path mapping in `shared/locale/serverLegacy.ts` (`namespacePaths` map)
  - If used in layout SSR, add to `LocaleProvider` in `app/[locale]/layout.tsx`
  - _Requirements: AC-7, AC-9, AC-17_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f shared/locale/types/profile/index.ts --id verify`
  - **Instruction Verification**: `shared/AGENTS.md`, `.agents/instructions/frontend.instructions.md`

---

## Phase 10: Testing

- [ ] 10.1 **Unit Tests - AuthPasswordService.adminResetPassword**
  - Create: `backend/services/auth/test/auth-password.service.test.ts` (or add to existing)
  - Test: permission check, self-restriction, password validation, hashing, audit log, email dispatch (mocked)
  - Tag: `@services`
  - _Requirements: AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-15_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f <test-file> --id verify`
  - **Instruction Verification**: `backend/services/AGENTS.md`, `.agents/instructions/tests.instructions.md`

- [ ] 10.2 **Unit Tests - ProfileService.updateCoreUserFields (Status)**
  - Create: `backend/services/profile/test/profile-field-filter.test.ts` (or add to existing)
  - Test: status permission check, status update, audit log
  - Tag: `@services`
  - _Requirements: AC-2, AC-3, AC-4_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f <test-file> --id verify`
  - **Instruction Verification**: `backend/services/AGENTS.md`, `.agents/instructions/tests.instructions.md`

- [ ] 10.3 **GraphQL Integration Tests - adminResetPassword**
  - Create: `frontend/common/graphql/test/auth/admin-password.test.ts` (NEW FILE)
  - Test: super admin success, non-super-admin denied, self-reset denied, impersonation blocked, email sent/not sent, audit log created
  - Use `setupTestServerLifecycle`, `authenticatedRequest`, `assertOperationDenied`
  - _Requirements: AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-15_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/graphql/test/auth/admin-password.test.ts --id verify`
  - **Instruction Verification**: `frontend/common/graphql/test/AGENTS.md`, `.agents/instructions/tests.instructions.md`

- [ ] 10.4 **GraphQL Integration Tests - updateUserProfile with Status**
  - Create: `frontend/common/graphql/test/profile/user-status.test.ts` (NEW FILE)
  - Test: super admin can change status for all user types (teacher, parent, staff, student, supervisor)
  - Verify status reflected in profile query
  - Verify audit log created
  - _Requirements: AC-1, AC-2, AC-3, AC-14_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/graphql/test/profile/user-status.test.ts --id verify`
  - **Instruction Verification**: `frontend/common/graphql/test/AGENTS.md`, `.agents/instructions/tests.instructions.md`

- [ ] 10.5 **Frontend Component Tests - ResetPasswordDialog**
  - Create: `frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.test.tsx` (NEW FILE)
  - Test: form validation, mutation call, success/error handling, i18n
  - Use `renderWithWrapper`, mock Apollo mutation
  - _Requirements: AC-7, AC-9, AC-10, AC-17_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.test.tsx --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `.agents/instructions/tests.instructions.md`

- [ ] 10.6 **Frontend Component Tests - Admin Sections**
  - Add tests to existing admin section test files (e.g., `AccountSection.test.tsx`, `AdminOnlySection.test.tsx`)
  - Test: status dropdown visibility, reset button visibility, form integration
  - _Requirements: AC-1, AC-7, AC-14, AC-17, AC-18_
  - **Quality Loop**: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts -f <test-file> --id verify`
  - **Instruction Verification**: `frontend/common/views/AGENTS.md`, `.agents/instructions/tests.instructions.md`

---

## Phase 11: Quality Gate & Verification

- [ ] 11.1 **Run Full Quality Gate**
  - Run: `bun quality-gate`
  - Fix all issues across all stages (tsgo, biome, lint, codescene, sonar)
  - _Requirements: All_
  - **Quality Loop**: N/A (this IS the quality gate)

- [ ] 11.2 **Run All Tests**
  - Run: `bun run test`
  - Verify all new and existing tests pass
  - _Requirements: All_
  - **Quality Loop**: N/A

- [ ] 11.3 **Manual Verification Checklist**
  - [ ] Super admin can change status for teacher profile
  - [ ] Super admin can change status for parent profile
  - [ ] Super admin can change status for staff profile
  - [ ] Super admin can change status for student profile
  - [ ] Super admin can change status for supervisor profile
  - [ ] Super admin can reset password for teacher profile (with/without email)
  - [ ] Super admin can reset password for parent profile (with/without email)
  - [ ] Super admin can reset password for staff profile (with/without email)
  - [ ] Super admin can reset password for student profile (with/without email)
  - [ ] Super admin can reset password for supervisor profile (with/without email)
  - [ ] Non-super-admin cannot access status dropdown
  - [ ] Non-super-admin cannot access reset password button
  - [ ] Super admin cannot reset own password via admin path
  - [ ] Impersonating super admin cannot reset password
  - [ ] Audit log entries created for status changes
  - [ ] Audit log entries created for password resets
  - [ ] Email sent when checkbox checked
  - [ ] Email not sent when checkbox unchecked
  - _Requirements: All_

---

## Phase 12: Knowledge Propagation

- [ ] 12.1 **Create Canonical Reference Doc**
  - Read all outcome files in `.ai/plans/user_admin_management/outcome/`
  - Create: `docs/auth/admin-user-management.md`
  - Document: permission, mutations, service methods, frontend components, audit logging, email notifications
  - _Requirements: Feature 6_

- [ ] 12.2 **Update Layer AGENTS.md Files**
  - Update `backend/services/AGENTS.md` - reference new admin password reset pattern
  - Update `backend/graphql/AGENTS.md` - reference new mutation pattern
  - Update `frontend/common/views/AGENTS.md` - reference admin section pattern
  - Update root `AGENTS.md` - add `docs/auth/admin-user-management.md` to Important References
  - _Requirements: Feature 6_

- [ ] 12.3 **Update Skills & Instructions**
  - Update `.agents/skills/security-review/SKILL.md` - add admin password reset to security checklist
  - Update `.agents/instructions/backend.instructions.md` - add reference to new doc
  - Update `.agents/instructions/frontend.instructions.md` - add reference to new doc
  - _Requirements: Feature 6_

- [ ] 12.4 **Final Quality Check**
  - Run: `bun tsgo`, `bun biome:check`, `bun run lint`
  - Verify 0 errors, 0 warnings
  - _Requirements: Feature 6_

---

## Deferred Items (Post-Launch)

- [ ] Consider adding "force password change on next login" flag
- [ ] Consider bulk status update for multiple users
- [ ] Consider password reset history/audit trail for users
- [ ] Consider integration with external identity providers (SSO)

---

## Task Dependencies Graph

```
Phase 0 (Baseline)
    ↓
Phase 1 (DB/Permissions) → Phase 2 (Types) → Phase 3 (Pothos) → Phase 4 (Services)
    ↓                                                    ↓
Phase 5 (Mutations) ← Phase 6 (Codegen) ← Phase 7 (Frontend Hooks/Components)
    ↓
Phase 8 (Admin Sections) ← Phase 9 (Translations)
    ↓
Phase 10 (Tests) → Phase 11 (Quality Gate) → Phase 12 (Knowledge Propagation)
```

---

## Requirement Traceability Matrix

| Requirement | Tasks |
|-------------|-------|
| AC-1 (View status dropdown) | 3.1, 7.1, 8.1-8.5 |
| AC-2 (Save status) | 2.1, 3.1, 4.1, 5.3, 8.1-8.5 |
| AC-3 (Audit log status) | 4.1 |
| AC-4 (Non-super-admin denied) | 4.1, 7.1, 8.1-8.5 |
| AC-5 (Self status allowed) | 4.1 |
| AC-6 (Status for all types) | 8.1-8.5 |
| AC-7 (Reset password button) | 3.2, 5.1, 5.2, 6.1, 6.2, 7.2, 7.3, 7.4, 8.1-8.5 |
| AC-8 (Reset password dialog) | 7.2, 7.3 |
| AC-9 (Email checkbox) | 2.2, 3.2, 4.2, 7.2 |
| AC-10 (Email sent/unsent) | 4.2, 7.2 |
| AC-11 (Self-reset denied) | 4.2 |
| AC-12 (Non-super-admin denied) | 4.2, 5.1, 7.1, 8.1-8.5 |
| AC-13 (Audit log password) | 4.2 |
| AC-14 (All user types) | 8.1-8.5 |
| AC-15 (Impersonation block) | 5.1 |
| AC-16 (New permission) | 1.1, 1.2 |
| AC-17 (Frontend integration) | 7.1, 7.2, 8.1-8.5 |
| AC-18 (Form integration) | 8.1-8.5 |
| AC-19 (Separate mutation) | 5.1, 7.2 |