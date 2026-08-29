# Staff/Manager Onboarding & Profiles

A super-admin (or holder of the SUPER_ADMIN system group) creates staff accounts from the `/staff/create` dashboard page, which is gated by `withPageAuth` on `AppPermission.STAFF_CREATE` and rendered by `ManagerOnboardingContainer`. The form calls the `createManager` / `createSupervisor` GraphQL mutations (`authScopes: superAdmin, notImpersonating`), which resolve to `ManagerOnboardingService.createManager`; this maps `ManagerAccountType.supervisor` to the `SUPERVISOR_DEFAULT` permission group and everything else to `ACADEMY_ADMIN`. The actual provisioning runs in the shared `UserOnboardingService.createUserOfType` pipeline: it checks the actor's `STAFF_CREATE` permission, runs super-admin pre-checks, verifies email uniqueness, hashes the password, then — inside one DB transaction — inserts the `users` row, writes timezone/phone/displayCurrency profile fields, creates the `staff_profiles` extension row, looks up the target permission group, and assigns it via `user_permission_groups`. Failures (insufficient permissions, duplicate email, missing permission group) throw localized errors and roll everything back; email uniqueness is checked before the transaction, while name/password constraints are enforced by the Pothos input schema. The staff directory page (`/staff`, gated by `STAFF_VIEW_DIRECTORY`) either redirects to `/users?tab=staff` when the unified users directory feature is enabled, or renders `ManagersContainer`, which reads through the `managerDirectory`, `staffDirectory` and `onboardingMetrics` queries into `ManagerDirectoryService` (permission re-check, limit clamping, search/filter). Profile and rate edits go through `ManagerProfileService.updateManagerProfile` (with SUPER_ADMIN / ACADEMY_ADMIN protection rules) or `updateOwnStaffProfile` (own-record phone edits only).

## Key sources

- `app/(dashboard)/staff/create/page.tsx`
- `app/(dashboard)/staff/page.tsx`
- `frontend/common/views/dashboard/staff/onboarding/ManagerOnboardingContainer.tsx`
- `backend/graphql/mutation/shared/onboarding.mutation.ts`
- `backend/graphql/query/teachers/staff-directory.query.ts`
- `backend/graphql/pothos/teachers/manager-onboarding.pothos.ts`
- `backend/services/staff/manager-onboarding.service.ts`
- `backend/services/staff/manager-directory.service.ts`
- `backend/services/staff/manager-profile.service.ts`
- `backend/services/user/user-onboarding.service.ts`
- `backend/db/schema/users/users.ts`, `backend/db/schema/teachers/staff.ts`, `backend/db/schema/permissions/permissions.ts`

```mermaid
%% Staff/Manager Onboarding & Profiles — account creation with role-group assignment, directory and profile views
flowchart TB
  subgraph Create["Create staff account"]
    PAGE["page.tsx — withPageAuth requires AppPermission.STAFF_CREATE"]
    FORM["ManagerOnboardingContainer submits createManager or createSupervisor mutation"]
    MUT["onboarding.mutation.ts — authScopes superAdmin + notImpersonating"]
    MOS["ManagerOnboardingService.createManager — resolveTargetGroupSlug by ManagerAccountType"]
    UOS["UserOnboardingService.createUserOfType — shared pipeline"]
    CHK1{"actor holds STAFF_CREATE?"}
    CHK2{"preChecks — actor is super-admin?"}
    CHK3{"email unique?"}
    ERR1["throw insufficientPermissions"]
    ERR2["throw userEmailExists"]
    TX["Open DB transaction"]
    U1["UserRepository.create — insert users row"]
    U2["UserRepository.updateProfileFields — timezone, phone, displayCurrency"]
    EXT["StaffProfileRepository.create — insert staff_profiles row"]
    GRP{"target permission group found?"}
    ERR3["throw permissionGroupNotFound — transaction rolls back"]
    ASG["PermissionManagementRepository.bulkAssignUsersToGroup — insert user_permission_groups row"]
    RES["Return ManagerOnboardingResult with assignedGroupSlug"]
  end

  subgraph Views["Directory and profile views"]
    DIRPAGE["staff/page.tsx — withPageAuth requires STAFF_VIEW_DIRECTORY"]
    REDIR{"users directory feature enabled?"}
    REDIRTO["redirect to /users?tab=staff — UsersContainer staff tab"]
    DIR["ManagersContainer — managerDirectory, staffDirectory, onboardingMetrics queries"]
    MDS["ManagerDirectoryService — re-checks STAFF_VIEW_DIRECTORY and clamps limit"]
    PROF["ManagerProfileService.updateManagerProfile / updateOwnStaffProfile — permission and own-record guards"]
    ERR4["throw unauthorizedAction / insufficientPermissions"]
  end

  USERS[("users table")]
  SP[("staff_profiles table")]
  PG[("permission_groups table")]
  UPG[("user_permission_groups table")]

  PAGE --> FORM --> MUT --> MOS --> UOS --> CHK1
  CHK1 -- no --> ERR1
  CHK1 -- yes --> CHK2
  CHK2 -- no --> ERR1
  CHK2 -- yes --> CHK3
  CHK3 -- no --> ERR2
  CHK3 -- yes --> TX
  TX --> U1 --> U2 --> EXT --> GRP
  GRP -- no --> ERR3
  GRP -- yes --> ASG --> RES

  U1 --> USERS
  U2 --> USERS
  EXT --> SP
  GRP -- reads --> PG
  ASG --> UPG

  DIRPAGE --> REDIR
  REDIR -- yes --> REDIRTO
  REDIR -- no --> DIR
  DIR --> MDS
  MDS -- denied --> ERR4
  MDS --> USERS
  MDS --> SP
  PROF --> USERS
  PROF --> SP
```

Machine-readable copy: [manager-onboarding.mmd](./manager-onboarding.mmd)
