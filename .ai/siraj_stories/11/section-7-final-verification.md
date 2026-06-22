## Section 7: Final Verification & Integrity Protocol

Execute the following commands in order to guarantee system stability and prevent code regressions after completing all tasks in Story 11.

---

### 7.1 Schema & Type Generation
1. `bun run generate:gqlSchema` — Verifies GraphQL schema integration with all new Pothos types.
2. `bun codegen` — Updates TypeScript types, query documents, and mutation types.

---

### 7.2 Quality Gate Loop
3. `bun tsgo` — Runs global TypeScript typecheck. Must pass with 0 errors & 0 warnings.
4. `bun biome:check` — Runs Biome formatter/linter checks. Must pass with 0 errors & 0 warnings.
5. `bun lint` — Runs ESLint checks. Must pass with 0 errors & 0 warnings.
6. `bun codescene` — Runs CodeScene analysis. Must pass with 0 errors & 0 warnings.
7. **Loop commands 3–6** until all pass with 0 errors & 0 warnings simultaneously.

---

### 7.3 Test Suites
8. `bun run test:db` — Runs all database repository and logic tests.
9. `bun run test:graphql` — Runs all GraphQL integration tests.
10. `bun run test:ui:components` — Runs all UI component tests.
11. `bun run test` — Runs all unit and integration tests across backend and frontend.

---

### 7.3b Repository Coverage Verification
12. `bun run test:coverage backend/db/test/repo/student-directory.test.ts` — Must show 100% line + function coverage on `StudentRepository.getDirectoryRows()`.
13. `bun run test:coverage backend/db/test/repo/staff-profile.test.ts` — Must show 100% line + function coverage on all `StaffProfileRepository` methods.
14. `bun run test:coverage backend/db/test/repo/learning-resource.test.ts` — Must show 100% line + function coverage on all `LearningResourceRepository` methods.

---

### 7.4 Prohibited Pattern Check
15. `rg -i "TODO|FIXME|not implemented|placeholder|for now" backend frontend shared --glob "!**/*.md" --glob "!**/generated/**"` — Output MUST be empty.

---

### 7.5 Mock Data Leak Check
16. `rg "mockStudentsStore" frontend/views --glob "!**/*.stories.tsx"` — Output MUST be empty.
17. `rg "mockManagersStore" frontend/views --glob "!**/*.stories.tsx"` — Output MUST be empty.
18. `rg "mockResourcesStore" frontend/views --glob "!**/*.stories.tsx"` — Output MUST be empty.
19. `rg "mockUserStore" frontend/views --glob "!**/*.stories.tsx"` — Output MUST be empty.

---

### 7.6 Permission Enforcement Verification
20. Verify `StudentsContainer.tsx` has RBAC gate:
    ```bash
    rg "RequirePermission" frontend/views/dashboard/students/home/StudentsContainer.tsx
    ```
    Must contain `<RequirePermission permissions={[AppPermission.StudentsList]}>`.

21. Verify `ManagersContainer.tsx` has RBAC gate:
    ```bash
    rg "RequirePermission" frontend/views/dashboard/managers/home/ManagersContainer.tsx
    ```
    Must contain `<RequirePermission permissions={[AppPermission.StaffViewDirectory]}>`.

22. Verify `ResourcesContainer.tsx` has RBAC gate:
    ```bash
    rg "RequirePermission" frontend/views/dashboard/resources/ResourcesContainer.tsx
    ```
    Must contain `<RequirePermission permissions={[AppPermission.ResourcesList]}>`.

---

### 7.7 Service Layer Integrity Check
23. Verify no services import from DB/Drizzle:
    ```bash
    rg "from ['\"]drizzle|from ['\"]backend/db/schema" backend/services/student/student-directory.service.ts backend/services/staff/manager-directory.service.ts backend/services/staff/manager-profile.service.ts backend/services/resource/learning-resource.service.ts
    ```
    Output MUST be empty.

24. Verify no GraphQL resolvers import from DB/Repo:
    ```bash
    rg "from ['\"]backend/db" backend/graphql/pothos/student-directory.pothos.ts backend/graphql/pothos/learning-resource.pothos.ts backend/graphql/pothos/staff-directory.pothos.ts
    ```
    Output MUST be empty.
