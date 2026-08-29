# General User Creation & Onboarding

General user creation is the generic entry point into the shared user-provisioning pipeline, used when a staff member creates an account that belongs to a non-specialized permission group (anything other than the student, teacher, or parent system groups). A staff admin submits the form at `app/(dashboard)/users/create/page.tsx` (guarded by `AppPermission.STAFF_CREATE`), which fires the `createGeneralUser` Pothos mutation via the `useCreateGeneralUser` hook. `GeneralUserOnboardingService.createGeneralUser` first rejects specialized group slugs via `isSpecializedGroup` — those types must go through their dedicated onboarding flows — and verifies the target group exists, then delegates to the shared `UserOnboardingService.createUserOfType` pipeline using the null-extension pattern (`createExtension: async () => undefined`), so no type-specific profile row is written. The shared pipeline, also used by the teacher, parent, student, and manager onboarding services with real extension rows, enforces the caller's permission, runs optional pre-checks, checks email uniqueness, optionally validates password strength, validates the name, and bcrypt-hashes the password before opening a DB transaction that inserts the `users` row, writes optional profile fields (timezone, phone, display currency), creates the extension, looks up the permission group by slug, and assigns the user via `bulkAssignUsersToGroup`. After the pipeline returns, the general flow honors a non-default requested `AccountStatus` via `UserRepository.updateStatus` (the schema default is `ACTIVATED`). On the client, the hook stores the result in `generalUserOnboardingStore` and evicts the `users` plus all directory queries from the Apollo `ROOT_QUERY` cache (followed by `cache.gc()`) so the new user appears in the correct directory tab. Key edge paths: specialized slug rejection, unknown group slug, duplicate email, weak password, and insufficient permissions all throw localized errors before or during the transaction.

## Key sources

- `backend/services/user/general-user-onboarding.service.ts` — `GeneralUserOnboardingService.createGeneralUser` (specialized-group filter, group verification, null-extension delegation, status override)
- `backend/services/user/user-onboarding.service.ts` — `UserOnboardingService.createUserOfType` shared pipeline (steps 1–11)
- `shared/constants/specialized-groups.constants.ts` — `SPECIALIZED_GROUP_SLUGS`, `isSpecializedGroup`
- `backend/graphql/mutation/shared/general-user-create.mutation.ts` — `createGeneralUser` mutation with `authScopes` (`STAFF_CREATE` + `notImpersonating`)
- `app/(dashboard)/users/create/page.tsx` — page route guarded by `withPageAuth([AppPermission.STAFF_CREATE])`
- `frontend/common/hooks/useCreateGeneralUser.ts` — mutation execution, result store, Apollo cache eviction
- `backend/services/teacher/teacher-onboarding.service.ts`, `backend/services/parent/parent-onboarding.service.ts`, `backend/services/student/student-onboarding.service.ts`, `backend/services/staff/manager-onboarding.service.ts` — role-specific callers of the same pipeline

```mermaid
%% General User Creation & Onboarding — shared createUserOfType pipeline
flowchart TB
  UI["/users/create page (GeneralUserCreateContainer)"] --> HOOK["useCreateGeneralUser hook"]
  HOOK --> MUT["createGeneralUser mutation (authScopes STAFF_CREATE + notImpersonating)"]
  MUT --> GS["GeneralUserOnboardingService.createGeneralUser"]

  subgraph RoleFlows["Role-specific onboarding services (separate mutations)"]
    TS["TeacherOnboardingService"]
    PS["ParentOnboardingService"]
    SS["StudentOnboardingService"]
    MS["ManagerOnboardingService"]
  end

  GS --> SPEC{"isSpecializedGroup(groupSlug)?"}
  SPEC -- "yes" --> ERR1["Throw specializedGroupNotAllowed"]
  SPEC -- "no" --> FGS["findGroupBySlug verifies group exists"]
  FGS -- "missing" --> ERR2["Throw permissionGroupNotFound"]

  FGS --> PIPE["UserOnboardingService.createUserOfType"]
  TS --> PIPE
  PS --> PIPE
  SS --> PIPE
  MS --> PIPE

  PIPE --> P1["PermissionsService.hasPermission (else insufficientPermissions)"]
  P1 --> P2["Optional preChecks per type"]
  P2 --> P3["UserRepository.existsByEmail (else userEmailExists)"]
  P3 --> P4["Optional validatePasswordStrength"]
  P4 --> P5["AuthUtils.validateUserName"]
  P5 --> P6["hashPassword (bcrypt)"]

  P6 --> TX["Begin DB transaction"]
  subgraph TxSteps["Transaction steps"]
    T1["UserRepository.create inserts users row"]
    T2["Optional updateTimezone / updateProfileFields phone + currency"]
    T3["createExtension (void for general user; teacher/parent/student/staff row otherwise)"]
    T4["listAllGroups matches slug then bulkAssignUsersToGroup"]
    T5["Optional afterExtension (payout method, teacher assignment)"]
    T1 --> T2 --> T3 --> T4 --> T5
  end
  TX --> T1

  T5 --> DONE["Commit and return user + extension"]
  DONE --> STATUS{"General flow: non-default status?"}
  STATUS -- "yes" --> US["UserRepository.updateStatus"]
  STATUS -- "no" --> RET["Return user + assignedGroupSlug"]
  US --> RET
  RET --> STORE["generalUserOnboardingStore.setResult"]
  STORE --> EVICT["Evict ROOT_QUERY users and directory fields then cache.gc"]
```

[Diagram source](./user-creation.mmd)
