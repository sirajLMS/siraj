## Section 7: Final Verification & Integrity Protocol

### 7.1 Schema & Codegen Verification

After completing all tasks, verify the complete schema is valid:

```bash
# Regenerate GraphQL schema from backend
bun run generate:gqlSchema

# Regenerate frontend TypeScript types
bun codegen

# Verify TypeScript compilation
bun tsgo
```

Expected result: All three commands pass with zero errors.

### 7.2 Quality Gate Verification

Run the full quality gate loop:

```bash
# Check TypeScript
bun tsgo

# Check Biome linting
bun biome:check

# Check ESLint
bun lint

# Check CodeScene
bun codescene

# Loop until no issues
# Repeat the above commands until all pass
```

Expected result: All quality gates pass with zero errors and zero warnings.

### 7.3 Test Suite Verification

Run all test suites to ensure no regressions:

```bash
# Database tests
bun run test:db

# GraphQL integration tests
bun run test:graphql

# UI component tests
bun run test:ui:components

# All tests
bun test
```

Expected result: All tests pass with zero failures.

### 7.4 Prohibited Pattern Checks

Verify no prohibited patterns exist in the new code:

```bash
# Check for TODO/FIXME comments
rg -i "TODO|FIXME" backend/db/repo/teacher.repository.ts backend/db/repo/parent.repository.ts backend/db/repo/staff-profile.repository.ts backend/db/repo/user.repository.ts backend/services/teacher/teacher-onboarding.service.ts backend/services/parent/parent-onboarding.service.ts backend/services/staff/manager-onboarding.service.ts backend/services/auth/auth-validation.service.ts backend/graphql/pothos/teacher-onboarding.pothos.ts backend/graphql/pothos/parent-onboarding.pothos.ts backend/graphql/pothos/manager-onboarding.pothos.ts backend/graphql/pothos/auth-validation.pothos.ts frontend/graphql/sharedDocuments/teacher-onboarding.documents.ts frontend/graphql/sharedDocuments/parent-onboarding.documents.ts frontend/graphql/sharedDocuments/manager-onboarding.documents.ts frontend/graphql/sharedDocuments/auth-validation.documents.ts frontend/stores/teacherOnboardingStore.ts frontend/stores/parentOnboardingStore.ts frontend/stores/managerOnboardingStore.ts frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.tsx frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.tsx frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx

# Check for "Not implemented" errors
rg "Not implemented" backend/ frontend/

# Check for console methods
rg "console\.(log|warn|error|debug)" backend/ frontend/ --glob "!**/node_modules/**"

# Check for Drizzle imports in services
rg "from ['\"]drizzle" backend/services/teacher/teacher-onboarding.service.ts backend/services/parent/parent-onboarding.service.ts backend/services/staff/manager-onboarding.service.ts backend/services/auth/auth-validation.service.ts

# Check for DB/Repo imports in GraphQL resolvers
rg "from ['\"]backend/db" backend/graphql/pothos/teacher-onboarding.pothos.ts backend/graphql/pothos/parent-onboarding.pothos.ts backend/graphql/pothos/manager-onboarding.pothos.ts backend/graphql/pothos/auth-validation.pothos.ts

# Check for mock stores in production views
rg "mock.*Onboarding.*Store" frontend/views --glob "!**/*.stories.tsx"

# Check for alert() calls
rg "alert\(" frontend/views/dashboard/teachers/onboarding frontend/views/dashboard/parents/onboarding frontend/views/dashboard/managers/onboarding

# Check for "any" types
rg "as any|: any" backend/services/teacher/teacher-onboarding.service.ts backend/services/parent/parent-onboarding.service.ts backend/services/staff/manager-onboarding.service.ts backend/services/auth/auth-validation.service.ts
```

Expected result: All commands return no matches (empty output).

### 7.5 Permission Enforcement Verification

Verify that the new permissions are correctly enforced:

```bash
# Verify permissions exist in enum
rg "STAFF_CREATE_TEACHER|PARENT_CREATE_ACCOUNT|MANAGER_CREATE_ACCOUNT|AUTH_LOGIN_VALIDATION" shared/lib/enum.ts

# Verify permissions are seeded in migration
rg "staff.create_teacher|parent.create_account|manager.create_account|auth.login_validation" backend/db/migration/3-system_permissions_and_groups.sql

# Verify permission checks in services
rg "STAFF_CREATE_TEACHER|PARENT_CREATE_ACCOUNT|MANAGER_CREATE_ACCOUNT" backend/services/
```

Expected result: All permissions are present in enum, migration, and service checks.

### 7.6 Mock Data Leak Checks

Verify no mock data leaks into production:

```bash
# Check for mock store imports in production views
rg "mock" frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.tsx frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.tsx frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx

# Check for setTimeout simulations
rg "setTimeout" frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.tsx frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.tsx frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx
```

Expected result: No matches. All mock data and simulated delays are removed from production containers.

### 7.7 Storybook Verification

Verify stories are properly migrated:

```bash
# Check for MockedProvider in stories
rg "MockedProvider" frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.stories.tsx frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.stories.tsx frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.stories.tsx

# Check for permission mocking in stories
rg "useUserStore.setState" frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.stories.tsx frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.stories.tsx frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.stories.tsx
```

Expected result: All stories use `MockedProvider` and mock permissions.

### 7.8 Final Directory Tree

After all tasks are complete, the final directory structure should be:

```
.ai/siraj_stories/13/
├── section-0-metadata.md
├── section-1-core-principles.md
├── section-2-rbac-permissions.md
├── section-4-security-threats.md
├── section-5-prerequisites.md
├── section-6-tasks/
│   ├── task-a-migration-enum.md
│   ├── task-b-repositories.md
│   ├── task-c-repo-tests.md
│   ├── task-d-services.md
│   ├── task-e-service-tests.md
│   ├── task-f-graphql-pothos.md
│   ├── task-g-frontend-documents.md
│   ├── task-h-types-extraction.md
│   ├── task-i-graphql-tests.md
│   ├── task-j-storybook-migration.md
│   ├── task-k-i18n.md
│   ├── task-l-frontend-stores.md
│   └── task-m-frontend-views.md
├── section-7-final-verification.md
└── appendix.md
```

New files created in the project:
```
backend/db/repo/
├── teacher.repository.ts (modified - added create method)
├── parent.repository.ts (modified - added create method)
├── staff-profile.repository.ts (modified - added create method)
└── user.repository.ts (modified - added validateLoginScope method)

backend/services/
├── teacher/teacher-onboarding.service.ts (new)
├── parent/parent-onboarding.service.ts (new)
├── staff/manager-onboarding.service.ts (new)
└── auth/auth-validation.service.ts (new)

backend/graphql/pothos/
├── teacher-onboarding.pothos.ts (new)
├── parent-onboarding.pothos.ts (new)
├── manager-onboarding.pothos.ts (new)
├── auth-validation.pothos.ts (new)
└── index.ts (modified - added exports)

frontend/graphql/sharedDocuments/
├── teacher-onboarding.documents.ts (new)
├── parent-onboarding.documents.ts (new)
├── manager-onboarding.documents.ts (new)
├── auth-validation.documents.ts (new)
└── index.ts (modified - added exports)

frontend/stores/
├── teacherOnboardingStore.ts (new)
├── parentOnboardingStore.ts (new)
└── managerOnboardingStore.ts (new)

frontend/views/dashboard/
├── teachers/onboarding/
│   ├── types.ts (new)
│   ├── TeacherOnboardingContainer.tsx (modified)
│   └── TeacherOnboardingContainer.stories.tsx (modified)
├── parents/onboarding/
│   ├── types.ts (new)
│   ├── ParentOnboardingContainer.tsx (modified)
│   └── ParentOnboardingContainer.stories.tsx (modified)
└── managers/onboarding/
    ├── types.ts (new)
    ├── ManagerOnboardingContainer.tsx (modified)
    └── ManagerOnboardingContainer.stories.tsx (modified)

shared/
├── lib/enum.ts (modified - added 4 new permissions)
└── messages/
    ├── en.ts (modified - added error messages)
    └── ar/errors.ts (new - Arabic error translations)

backend/db/migration/
└── 3-system_permissions_and_groups.sql (modified - added 4 new permissions + group assignments)
```
