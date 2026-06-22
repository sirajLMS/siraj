### Task I — Frontend Views: Migrate Containers from Mock Stores to Real Data + RBAC Enforcement

**Objective:** Replace mock store imports in production containers with real Apollo `useQuery` hooks. Add RBAC gates via `<RequirePermission>`. Replace `globalThis.confirm()` with MUI Dialog where applicable.

**Dependencies:** Depends on Task H — Zustand stores are created.

**Layer-Specific Rules (Frontend Views — Flattened from frontend/views/AGENTS.md):**
- Functional Components only.
- Access Control: Use `<RequirePermission permissions={["domain.action"]} />` to gate components.
- Data Fetching: Use Apollo `useQuery` with generated TypedDocumentNodes.
- NO hardcoded colors — all from theme palette.
- MUI breaking changes: Typography style props via `sx` only. Stack layout props in `sx`.
- Dashboard UI Patterns: Use `PageContainer`, `PageHeader`, `SectionPanel`, `MetricCard`, `AppDataGrid`.
- **Mock Data Ban**: Mock data is strictly forbidden in production. Migrate to real components. (`*.stories.tsx` MUST KEEP dummy data).

**Target Files:**
- `frontend/views/dashboard/students/home/StudentsContainer.tsx` — MODIFY (replace mockStudentsStore with useQuery)
- `frontend/views/dashboard/managers/home/ManagersContainer.tsx` — MODIFY (replace mockManagersStore with useQuery)
- `frontend/views/dashboard/resources/ResourcesContainer.tsx` — MODIFY (replace mockResourcesStore with useQuery + useMutation)

---

**Detailed Implementation Steps:**

*Step 1: Migrate `StudentsContainer.tsx`*

**Current state:** Uses `useStudentsStore` from `mockStudentsStore`. No inline RBAC gate (relies on navigation-level gate only).

**Changes required:**
1. **Remove mock store import:** Delete `import { useStudentsStore } from "@/frontend/stores/mockStudentsStore"`.
2. **Add Apollo imports:** Add `import { useQuery } from "@apollo/client/react"` and import `studentDirectoryQueryDocument` from shared documents.
3. **Add new store import:** Add `import { useStudentDirectoryStore } from "@/frontend/stores/studentDirectoryStore"`.
4. **Add RBAC gate:** Wrap content in `<RequirePermission permissions={[AppPermission.StudentsList]}>`.
5. **Replace data source:** Use `const { data, loading, error } = useQuery(studentDirectoryQueryDocument, { variables: { ... } })` instead of `useStudentsStore(state => state.rows)`.
6. **Map GraphQL data to view format:** Transform `data.studentDirectory.rows` to the `StudentDirectoryRow[]` type expected by `StudentsView`.
7. **Compute metrics from data:** Calculate `activated`, `deactivated`, `regular`, `onLeave`, `suspended`, `onTrial` counts from the rows array.
8. **Wire search from new store:** Use `useStudentDirectoryStore(state => state.searchQuery)` for filtering.

**Data mapping pattern:**
```
data.studentDirectory.rows → StudentDirectoryRow[] (map GraphQL types to view types)
data.studentDirectory.totalCount → totalStudents count
```

The `StudentAccountStatus` and `StudentEnrollmentStatus` types from the mock store should be imported from the new store or a shared types file.

---

*Step 2: Migrate `ManagersContainer.tsx`*

**Current state:** Uses `useManagersStore` from `mockManagersStore`. No inline RBAC gate.

**Changes required:**
1. **Remove mock store import:** Delete `import { useManagersStore } from "@/frontend/stores/mockManagersStore"`.
2. **Add Apollo imports:** Add `import { useQuery } from "@apollo/client/react"` and import `managerDirectoryQueryDocument` from shared documents.
3. **Add new store import:** Add `import { useManagersDirectoryStore } from "@/frontend/stores/managersDirectoryStore"`.
4. **Add RBAC gate:** Wrap content in `<RequirePermission permissions={[AppPermission.StaffViewDirectory]}>`.
5. **Replace data source:** Use `const { data, loading, error } = useQuery(managerDirectoryQueryDocument)` instead of `useManagersStore(state => state.managers)`.
6. **Map GraphQL data to view format:** Transform `data.managerDirectory` to the `Manager[]` type expected by `ManagersView`.
7. **Compute metrics from data:** Calculate `totalAdmin`, `systemStaff`, `activeNow`, `alerts` from the rows array.
8. **Wire filters from new store:** Use `useManagersDirectoryStore` for `roleFilter` and `statusFilter`.

**Data mapping pattern:**
```
data.managerDirectory → Manager[] (map roleSlug to role, status string to status enum)
```

---

*Step 3: Migrate `ResourcesContainer.tsx`*

**Current state:** Uses `useResourcesStore` from `mockResourcesStore` AND `useUserStore` from `mockUserStore`. Has inline permission check but uses mock user store.

**Changes required:**
1. **Remove mock store imports:** Delete `import { useResourcesStore } from "@/frontend/stores/mockResourcesStore"` and `import { useUserStore } from "@/frontend/stores/mockUserStore"`.
2. **Add Apollo imports:** Add `import { useQuery, useMutation } from "@apollo/client/react"` and import `learningResourcesQueryDocument` and `uploadLearningResourceMutationDocument`.
3. **Add new store import:** Add `import { useLearningResourcesStore } from "@/frontend/stores/learningResourcesStore"`.
4. **Replace inline permission check:** Replace `useUserStore` permission check with `<RequirePermission permissions={[AppPermission.ResourcesList]}>` wrapper.
5. **Replace data source:** Use `const { data, loading, error } = useQuery(learningResourcesQueryDocument)` for resource list.
6. **Add upload mutation:** Use `const [uploadResource, { loading: uploading }] = useMutation(uploadLearningResourceMutationDocument)` for uploads.
7. **Map GraphQL data to view format:** Transform `data.learningResources` to the `LearningResourceRow[]` type expected by `ResourcesView`.
8. **Wire UI state from new store:** Use `useLearningResourcesStore` for search, filter, sort, and dialog state.
9. **Wire upload handler:** The upload handler calls `uploadResource({ variables: { input } })` then refetches the query on success.
10. **Replace `logger.info` in delete handler:** If the delete confirmation uses `logger.info()` as a placeholder (from the mock store's `confirmDelete`), replace it with a real mutation call or remove if delete is out of scope.

**Upload flow pattern:**
```
1. User fills form → calls store.setUploading(true)
2. Container calls uploadResource({ variables: { input: { displayName, filePath, fileId } } })
3. On success: store.setShowUploadSuccess(true), refetch learningResources query
4. On error: show error via translation key
5. Finally: store.setUploading(false)
```

---

*Step 4: Ensure no `any` or blind casts*

After all three containers are migrated:
- Verify no `as any`, `as unknown as`, or `useParams() as { id: string }` patterns exist in modified files.
- Use `typeof` guards for any dynamic parameter extraction.
- Ensure all GraphQL data types are properly narrowed using generated types.

---

*Step 5: Verify Storybook stories still work*

The existing `*.stories.tsx` files (`StudentsContainer.stories.tsx`, `ManagersContainer.stories.tsx`, `ResourcesContainer.stories.tsx`) MUST continue using mock store data. Verify:
- `StudentsContainer.stories.tsx` still imports from `mockStudentsStore`.
- `ManagersContainer.stories.tsx` still imports from `mockManagersStore`.
- `ResourcesContainer.stories.tsx` still imports from `mockResourcesStore`.
- No production imports leak into story files.

**Test Execution Requirements:**
- Run UI component tests:
  ```bash
  bun run test:ui:components
  ```
- Run GraphQL tests:
  ```bash
  bun run test:graphql
  ```

**Success Criteria / Check Progress Points:**
- [ ] `StudentsContainer` uses `useQuery(studentDirectoryQueryDocument)` instead of `mockStudentsStore`.
- [ ] `StudentsContainer` wraps content in `<RequirePermission permissions={[AppPermission.StudentsList]}>`.
- [ ] `ManagersContainer` uses `useQuery(managerDirectoryQueryDocument)` instead of `mockManagersStore`.
- [ ] `ManagersContainer` wraps content in `<RequirePermission permissions={[AppPermission.StaffViewDirectory]}>`.
- [ ] `ResourcesContainer` uses `useQuery(learningResourcesQueryDocument)` instead of `mockResourcesStore`.
- [ ] `ResourcesContainer` uses `useMutation(uploadLearningResourceMutationDocument)` for uploads.
- [ ] `ResourcesContainer` wraps content in `<RequirePermission permissions={[AppPermission.ResourcesList]}>`.
- [ ] No `mockStudentsStore`, `mockManagersStore`, or `mockResourcesStore` imports in production container files.
- [ ] No `mockUserStore` imports in production container files.
- [ ] No `any` or blind casts in modified components.
- [ ] `globalThis.confirm()` replaced with MUI Dialog (if applicable).
- [ ] Storybook stories (`*.stories.tsx`) continue using mock stores.
- [ ] `bun tsgo` passes with 0 errors.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
