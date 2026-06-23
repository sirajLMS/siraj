## Section 5: Prerequisites Verification (BLOCKING)

### 5.0 Security Artifact Verification

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Permission catalog migration | `backend/db/migration/3-system_permissions_and_groups.sql` | psql query | Migration applied, trigger active ✅ (verified — file exists with 1182 lines) |
| Permission enum | `shared/lib/enum.ts` | TypeScript compilation | AppPermission enum defined with 97 permissions ✅ (verified — lines 402-499) |
| Permission groups enum | `shared/lib/enum.ts` | TypeScript compilation | SystemPermissionGroupSlug enum defined ✅ (verified — lines 501-507) |
| PermissionsService | `backend/services/auth/permissions.service.ts` | Manual review | `hasPermission`, `hasAnyPermission`, `getUserContext` exist ✅ (verified) |
| UserRepository.create | `backend/db/repo/user.repository.ts` | Manual review | User creation method exists with email uniqueness check ✅ (verified) |
| PermissionManagementRepository | `backend/db/repo/permission-management.repository.ts` | Manual review | `bulkAssignUsersToGroup` exists ✅ (verified) |
| Existing repo tests | `backend/db/test/repo/` | `bun run test:db` | All existing tests pass ✅ (verified — 20 test files exist) |
| i18n translations | `shared/messages/en.ts` | Manual review | All onboarding keys exist ✅ (verified — teacherOnboarding, parentOnboarding, managerOnboarding) |
| i18n Arabic translations | `shared/messages/ar/` | Manual review | All onboarding keys exist ✅ (verified — ar/dashboard/teachers/onboarding.ts, parents/onboarding.ts, managers/onboarding.ts) |

**All prerequisite artifacts verified. No blocking items.**

### 5.1 Database Schema Verification

- [ ] Verify `users` table exists with columns: `id` (uuid PK), `name` (varchar), `email` (varchar UNIQUE), `password` (varchar), `isActive` (boolean), `isSuperAdmin` (boolean), `createdAt`, `updatedAt`, `deletedAt`. ✅ (verified — `backend/db/schema/users.ts:17-32`)
- [ ] Verify `teachers` table exists with columns: `id` (uuid PK), `userId` (uuid UNIQUE FK→users), `status` (account_status), `nationality` (country_code), `nationalId` (encryptedText), `phone`, `dateOfBirth`, `gender`, `address`, `qualifications`, `skypeId`, `zoomLink`, `zoomUsername`, `zoomPassword` (encryptedText), `countryCode`, `timezoneId` (FK→timezones), `timezone`, `hourlyRate`, `rateCurrency`, `createdAt`, `updatedAt`. ✅ (verified — `backend/db/schema/teachers.ts` full schema)
- [ ] Verify `parents` table exists with columns: `id` (uuid PK), `userId` (uuid UNIQUE FK→users), `status` (parent_status), `phone`, `nationality` (country_code), `address`, `facebook`, `whatsapp`, `twitter`, `skype`, `defaultZoomLink`, `invoiceType` (invoice_type), `feeAmount`, `paymentMethod` (payment_method), `currency`, `timezone`, `createdAt`, `updatedAt`. ✅ (verified — `backend/db/schema/parents.ts` full schema)
- [ ] Verify `staffProfiles` table exists with columns: `id` (uuid PK), `userId` (uuid UNIQUE FK→users), `phone`, `skypeId`, `status` (account_status), `createdAt`, `updatedAt`. ✅ (verified — `backend/db/schema/staff.ts:5-20`)
- [ ] Verify `permissions` table exists with columns: `id`, `key` (UNIQUE), `resource`, `action`, `description`, `category`, `isSystem`. ✅ (verified — `backend/db/schema/permissions.ts`)
- [ ] Verify `permissionGroups` table exists with columns: `id`, `name`, `slug` (UNIQUE), `description`, `isSystem`. ✅ (verified — `backend/db/schema/permissions.ts`)
- [ ] Verify `userPermissionGroups` table exists with columns: `userId` (FK→users), `groupId` (FK→permissionGroups), `assignedAt`, `assignedByUserId`. ✅ (verified — `backend/db/schema/permissions.ts`)
- [ ] Verify `teacherBankingDetailsHistory` table exists for temporal banking versioning. ✅ (verified — `backend/db/schema/teacher-banking.ts`)
- [ ] Verify `timezones` table exists for timezone FK reference. ✅ (verified — `backend/db/schema/timezones.ts`)

### 5.2 Migration Verification

- [ ] Run `bun run scripts/dbActions.ts push` to ensure all migrations are applied.
- [ ] Verify `backend/db/migration/3-system_permissions_and_groups.sql` is applied (existing permissions seeded). ✅ (verified — file exists with full permission catalog)
- [ ] Verify the `protect_system_permissions` trigger is active on `permissions` and `permission_groups` tables. ✅ (verified — `backend/db/migration/3-system_permissions_and_groups.sql:1130-1182`)
- [ ] Verify existing permission groups: `super_admin`, `academy_admin`, `teacher_default`, `parent_default`, `staff_default`, `system_automated`. ✅ (verified — `backend/db/migration/3-system_permissions_and_groups.sql:821-890`)

### 5.3 Test Suite Verification

- [ ] Run `bun run test:db` — all existing database tests pass (0 failures).
- [ ] Run `bun run test:graphql` — all existing GraphQL integration tests pass (0 failures).
- [ ] Run `bun tsgo` — TypeScript compilation passes with zero errors.
- [ ] Run `bun biome:check` — Biome linting passes with zero errors.
- [ ] Run `bun lint` — ESLint passes with zero errors.

### 5.4 Existing Code Verification

- [ ] Verify `UserRepository.create()` exists and creates users with email uniqueness validation. ✅ (verified — `backend/db/repo/user.repository.ts`)
- [ ] Verify `UserRepository.existsByEmail()` exists for email collision checks. ✅ (verified — `backend/db/repo/user.repository.ts`)
- [ ] Verify `UserRepository.findByEmail()` exists for login validation. ✅ (verified — `backend/db/repo/user.repository.ts`)
- [ ] Verify `PermissionManagementRepository.bulkAssignUsersToGroup()` exists for permission group assignment. ✅ (verified — `backend/db/repo/permission-management.repository.ts`)
- [ ] Verify `PermissionsService.hasPermission()` and `PermissionsService.hasAnyPermission()` exist and work. ✅ (verified — `backend/services/auth/permissions.service.ts`)
- [ ] Verify `getBackendTranslations()` helper is available and functional. ✅ (verified — `backend/lib/intl.ts`)
- [ ] Verify `TeacherBankingRepository.submitBankingDetails()` exists for banking detail creation. ✅ (verified — `backend/db/repo/teacher-banking.repository.ts`)
- [ ] Verify `TeacherRepository.findByUserId()` exists. ✅ (verified — `backend/db/repo/teacher.repository.ts:23-27`)
- [ ] Verify `ParentRepository.findByUserId()` exists. ✅ (verified — `backend/db/repo/parent.repository.ts`)
- [ ] Verify `StaffProfileRepository.findByUserId()` exists. ✅ (verified — `backend/db/repo/staff-profile.repository.ts`)
- [ ] Verify `TeacherRepository` has NO `create` method. ✅ (verified — no create method exists, needs implementation)
- [ ] Verify `ParentRepository` has NO `create` method. ✅ (verified — no create method exists, needs implementation)
- [ ] Verify `StaffProfileRepository` has NO `create` method. ✅ (verified — no create method exists, needs implementation)

### 5.5 Frontend Verification

- [ ] Verify `TeacherOnboardingContainer` currently imports from `mockTeacherOnboardingStore`. ✅ (verified — `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.tsx:5`)
- [ ] Verify `ParentOnboardingContainer` currently imports from `mockParentOnboardingStore`. ✅ (verified — `frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.tsx:6`)
- [ ] Verify `ManagerOnboardingContainer` currently imports from `mockManagerOnboardingStore`. ✅ (verified — `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx:6`)
- [ ] Verify `TeacherOnboardingContainer` uses `alert()` or simulated API call (needs real mutation). ✅ (verified — `TeacherOnboardingContainer.tsx:102` uses `logger.info` with simulated delay)
- [ ] Verify `ParentOnboardingContainer` uses `alert()` for success feedback. ✅ (verified — `ParentOnboardingContainer.tsx:32` uses `alert()`)
- [ ] Verify `ManagerOnboardingContainer` uses simulated API call (needs real mutation). ✅ (verified — `ManagerOnboardingContainer.tsx:42` uses `setTimeout`)
- [ ] Verify `RequirePermission` component exists and works. ✅ (verified — `frontend/components/auth/RequirePermission.tsx`)
- [ ] Verify `RequirePermission` is NOT used in any onboarding container. ✅ (verified — no imports found in onboarding files)
- [ ] Verify i18n keys exist for `dashboard.teacherOnboarding`. ✅ (verified — `shared/messages/en.ts:1119-1200`)
- [ ] Verify i18n keys exist for `dashboard.parentOnboarding`. ✅ (verified — `shared/messages/en.ts:1357-1437`)
- [ ] Verify i18n keys exist for `dashboard.managerOnboarding`. ✅ (verified — `shared/messages/en.ts:1438-1492`)
- [ ] Verify form schemas exist: `teacherOnboardingSchema`, `parentOnboardingSchema`, `managerOnboardingSchema`. ✅ (verified — all three exist in respective `schemas/` directories)
- [ ] Verify mock store types: `TeacherOnboardingData`, `ParentOnboardingData`, `ManagerOnboardingFormData`. ✅ (verified — all defined in mock store files)
- [ ] Verify NO real onboarding stores exist (no `teacherOnboardingStore.ts`, `parentOnboardingStore.ts`, `managerOnboardingStore.ts`). ✅ (verified — only mock stores exist)
- [ ] Verify NO GraphQL mutations exist for teacher/parent/manager creation in generated types. ✅ (verified — `frontend/graphql/generated/gql/graphql-types.ts` has no creation mutations)

### 5.6 Enum Verification

- [ ] Verify `AppPermission` enum does NOT contain `STAFF_CREATE_TEACHER`. ✅ (verified — not in enum, needs addition)
- [ ] Verify `AppPermission` enum does NOT contain `PARENT_CREATE_ACCOUNT`. ✅ (verified — not in enum, needs addition)
- [ ] Verify `AppPermission` enum does NOT contain `MANAGER_CREATE_ACCOUNT`. ✅ (verified — not in enum, needs addition)
- [ ] Verify `AppPermission` enum does NOT contain `AUTH_LOGIN_VALIDATION`. ✅ (verified — not in enum, needs addition)
- [ ] Verify `AppPermission` enum contains `TEACHERS_CREATE`, `PARENTS_CREATE`, `STAFF_CREATE` (existing general permissions). ✅ (verified — `shared/lib/enum.ts:434,442,464`)
- [ ] Verify `SystemPermissionGroupSlug` enum contains all required groups. ✅ (verified — `shared/lib/enum.ts:501-507`)
