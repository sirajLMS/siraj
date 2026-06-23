## Appendix: File Creation Summary & Dependency Graph

### A.1 File Creation Summary

| **File** | **Type** | **Task** | **Description** |
|---|---|---|---|
| `backend/db/migration/3-system_permissions_and_groups.sql` | Modified | A | Add 4 new permissions + group assignments |
| `shared/lib/enum.ts` | Modified | A | Add 4 new AppPermission enum values |
| `backend/db/repo/teacher.repository.ts` | Modified | B | Add `create` method for teacher profiles |
| `backend/db/repo/parent.repository.ts` | Modified | B | Add `create` method for parent profiles |
| `backend/db/repo/staff-profile.repository.ts` | Modified | B | Add `create` method for staff profiles |
| `backend/db/repo/user.repository.ts` | Modified | B | Add `validateLoginScope` method |
| `backend/db/test/repo/teacher.repository.test.ts` | Modified | B, C | Add create method tests |
| `backend/db/test/repo/parent.repository.test.ts` | Modified | B, C | Add create method tests |
| `backend/db/test/repo/staff-profile.test.ts` | Modified | B, C | Add create method tests |
| `backend/db/test/repo/user.repository.test.ts` | Modified/Created | B, C | Add login validation tests |
| `backend/services/teacher/teacher-onboarding.service.ts` | New | D | Teacher provisioning service |
| `backend/services/parent/parent-onboarding.service.ts` | New | D | Parent provisioning service |
| `backend/services/staff/manager-onboarding.service.ts` | New | D | Manager provisioning service |
| `backend/services/auth/auth-validation.service.ts` | New | D | Auth validation service |
| `backend/services/teacher/test/teacher-onboarding.service.test.ts` | New | D, E | Teacher service tests |
| `backend/services/parent/test/parent-onboarding.service.test.ts` | New | D, E | Parent service tests |
| `backend/services/staff/test/manager-onboarding.service.test.ts` | New | D, E | Manager service tests |
| `backend/services/auth/test/auth-validation.service.test.ts` | New | D, E | Auth validation tests |
| `backend/graphql/pothos/teacher-onboarding.pothos.ts` | New | F | Teacher onboarding GraphQL types/mutations |
| `backend/graphql/pothos/parent-onboarding.pothos.ts` | New | F | Parent onboarding GraphQL types/mutations |
| `backend/graphql/pothos/manager-onboarding.pothos.ts` | New | F | Manager onboarding GraphQL types/mutations |
| `backend/graphql/pothos/auth-validation.pothos.ts` | New | F | Auth validation GraphQL types/query |
| `backend/graphql/pothos/index.ts` | Modified | F | Export new Pothos modules |
| `frontend/graphql/sharedDocuments/teacher-onboarding.documents.ts` | New | G | Teacher onboarding Apollo documents |
| `frontend/graphql/sharedDocuments/parent-onboarding.documents.ts` | New | G | Parent onboarding Apollo documents |
| `frontend/graphql/sharedDocuments/manager-onboarding.documents.ts` | New | G | Manager onboarding Apollo documents |
| `frontend/graphql/sharedDocuments/auth-validation.documents.ts` | New | G | Auth validation Apollo documents |
| `frontend/graphql/sharedDocuments/index.ts` | Modified | G | Export new documents |
| `frontend/views/dashboard/teachers/onboarding/types.ts` | New | H | Teacher onboarding types |
| `frontend/views/dashboard/parents/onboarding/types.ts` | New | H | Parent onboarding types |
| `frontend/views/dashboard/managers/onboarding/types.ts` | New | H | Manager onboarding types |
| `frontend/stores/mockTeacherOnboardingStore.ts` | Modified | H | Re-import types from types.ts |
| `frontend/stores/mockParentOnboardingStore.ts` | Modified | H | Re-import types from types.ts |
| `frontend/stores/mockManagerOnboardingStore.ts` | Modified | H | Re-import types from types.ts |
| `frontend/graphql/test/teacher-onboarding.test.ts` | New | I | Teacher onboarding GraphQL tests |
| `frontend/graphql/test/parent-onboarding.test.ts` | New | I | Parent onboarding GraphQL tests |
| `frontend/graphql/test/manager-onboarding.test.ts` | New | I | Manager onboarding GraphQL tests |
| `frontend/graphql/test/auth-validation.test.ts` | New | I | Auth validation GraphQL tests |
| `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.stories.tsx` | Modified | J | MockedProvider migration |
| `frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.stories.tsx` | Modified | J | MockedProvider migration |
| `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.stories.tsx` | Modified | J | MockedProvider migration |
| `shared/messages/en.ts` | Modified | K | Add error message translations |
| `shared/messages/ar/errors.ts` | New | K | Arabic error translations |
| `frontend/stores/teacherOnboardingStore.ts` | New | L | Real teacher onboarding store |
| `frontend/stores/parentOnboardingStore.ts` | New | L | Real parent onboarding store |
| `frontend/stores/managerOnboardingStore.ts` | New | L | Real manager onboarding store |
| `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.tsx` | Modified | M | Real mutation integration + RBAC |
| `frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.tsx` | Modified | M | Real mutation integration + RBAC |
| `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx` | Modified | M | Real mutation integration + RBAC |

**Total new files:** 23
**Total modified files:** 16

### A.2 Task Dependency Graph

```
Task A (Migration + Enum)
    │
    ├── Task B (Repositories)
    │       │
    │       ├── Task C (Repo Tests)
    │       │
    │       └── Task D (Services)
    │               │
    │               └── Task E (Service Tests)
    │                       │
    │                       └── Task F (GraphQL Pothos)
    │                               │
    │                               └── Task G (Frontend Documents)
    │                                       │
    │                                       ├── Task H (Type Extraction)
    │                                       │       │
    │                                       │       ├── Task I (GraphQL Tests)
    │                                       │       │
    │                                       │       └── Task J (Storybook Migration)
    │                                       │               │
    │                                       │               └── Task K (i18n)
    │                                       │                       │
    │                                       │                       └── Task L (Frontend Stores)
    │                                       │                               │
    │                                       │                               └── Task M (Frontend Views)
    │                                       │
    │                                       └── Task I (GraphQL Tests) [also depends on H]
    │
    └── Section 7 (Final Verification) [depends on all tasks]
```

### A.3 Permission Mapping Summary

| **Permission** | **Enum Key** | **Group** | **Service Method** | **GraphQL Mutation** | **Container** |
|---|---|---|---|---|---|
| `staff.create_teacher` | `STAFF_CREATE_TEACHER` | Academy Admin, Super Admin | `TeacherOnboardingService.createTeacher()` | `createTeacher` | `TeacherOnboardingContainer` |
| `parent.create_account` | `PARENT_CREATE_ACCOUNT` | Academy Admin, Super Admin | `ParentOnboardingService.createParent()` | `createParent` | `ParentOnboardingContainer` |
| `manager.create_account` | `MANAGER_CREATE_ACCOUNT` | Super Admin only | `ManagerOnboardingService.createManager()` | `createManager` | `ManagerOnboardingContainer` |
| `auth.login_validation` | `AUTH_LOGIN_VALIDATION` | All user groups | `AuthValidationService.validateLoginScope()` | `validateLoginScope` (query) | Login form (existing) |

### A.4 Architecture Compliance Checklist

- [ ] Services import ONLY from `backend/db/repo/` (no Drizzle/schema imports)
- [ ] GraphQL resolvers import ONLY from `backend/services/` (no repo/schema imports)
- [ ] Frontend stores import from `@apollo/client/react` (not `@apollo/client/core`)
- [ ] Frontend documents import from `@apollo/client` (not `@apollo/client/core`)
- [ ] All error messages use `getBackendTranslations` (no hardcoded strings)
- [ ] All UI text uses `useTranslations` (no hardcoded strings)
- [ ] All permissions use `AppPermission` enum values (no string literals)
- [ ] All multi-table writes use `db.transaction()` (atomic operations)
- [ ] All stories use `MockedProvider` (no Zustand mock stores in stories)
- [ ] All containers use `<RequirePermission>` (RBAC enforcement)
- [ ] No `alert()` calls in production views (MUI Snackbar only)
- [ ] No `console.log` in any file (logger utility only)
- [ ] No `any` types in new code (strict typing)
- [ ] No `TODO`/`FIXME` comments (complete implementation)
