### Task H — Frontend Stores: Replace Mock Stores with Real Zustand + Apollo Stores

**Objective:** Create real Zustand stores that use generated GraphQL types and Apollo hooks to fetch data from the backend, replacing `mockStudentsStore`, `mockManagersStore`, and `mockResourcesStore` in production containers.

**Dependencies:** Depends on Task F — frontend GraphQL documents are created and codegen has run.

**Layer-Specific Rules (Frontend Stores — Flattened from frontend/stores/AGENTS.md):**
- Zustand for global state management.
- Strict Typing: Stores should be strictly typed using the GraphQL generated types.
- Direct Assignment: Solve TypeScript errors by adjusting the GraphQL schema or queries. Do NOT create complex intermediate mapping functions.
- **No mock data in production** — Mock stores only in `*.stories.tsx` files.

**Target Files:**
- `frontend/stores/studentDirectoryStore.ts` — NEW (replaces mockStudentsStore in production)
- `frontend/stores/managersDirectoryStore.ts` — NEW (replaces mockManagersStore in production)
- `frontend/stores/learningResourcesStore.ts` — NEW (replaces mockResourcesStore in production)

---

**Detailed Implementation Steps:**

*Step 1: Create `studentDirectoryStore.ts`*

Create `frontend/stores/studentDirectoryStore.ts`. This store manages the student directory UI state (search query) while Apollo manages data fetching via `useQuery`.

**Store state interface:**
- `searchQuery: string` — client-side search filter
- `setSearchQuery: (query: string) => void` — update search

The actual data (rows, metrics, totalCount) comes from Apollo's `useQuery(studentDirectoryQueryDocument)` in the Container component. The store only manages UI-only state that Apollo doesn't handle (like local search text).

**Key pattern:** The Container component uses both the Zustand store (for UI state) and Apollo `useQuery` (for data). The store is lightweight — it doesn't hold data, only search/filter state.

```typescript
import { create } from "zustand";

interface StudentDirectoryState {
  readonly searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useStudentDirectoryStore = create<StudentDirectoryState>((set) => ({
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
```

---

*Step 2: Create `managersDirectoryStore.ts`*

Create `frontend/stores/managersDirectoryStore.ts`. This store manages the managers directory UI state (role filter, status filter) while Apollo manages data fetching.

**Store state interface:**
- `roleFilter: "all" | "admin" | "staff"` — client-side role filter
- `statusFilter: "all" | "active" | "offline"` — client-side status filter
- `setRoleFilter: (filter) => void`
- `setStatusFilter: (filter) => void`

```typescript
import { create } from "zustand";

type RoleFilter = "all" | "admin" | "staff";
type StatusFilter = "all" | "active" | "offline";

interface ManagersDirectoryState {
  readonly roleFilter: RoleFilter;
  readonly statusFilter: StatusFilter;
  setRoleFilter: (filter: RoleFilter) => void;
  setStatusFilter: (filter: StatusFilter) => void;
}

export const useManagersDirectoryStore = create<ManagersDirectoryState>((set) => ({
  roleFilter: "all",
  statusFilter: "all",
  setRoleFilter: (filter) => set({ roleFilter: filter }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
}));
```

---

*Step 3: Create `learningResourcesStore.ts`*

Create `frontend/stores/learningResourcesStore.ts`. This store manages the resources UI state (search, filter, sort, upload dialog state, delete dialog state) while Apollo manages data fetching and mutations.

**Store state interface:**
- `searchQuery: string` — client-side search filter
- `filterType: ResourceFilterType` — file type filter ("all" | "pdf" | "pptx" | "xlsx" | "docx")
- `sortBy: ResourceSortBy` — sort order ("date" | "name")
- `pendingDeleteId: string | null` — ID of resource pending deletion confirmation
- `isUploading: boolean` — upload in progress flag
- `showUploadSuccess: boolean` — upload success toast flag
- All setter actions

```typescript
import { create } from "zustand";
import type { ResourceFileType, ResourceFilterType, ResourceSortBy } from "./mockResourcesStore";

interface LearningResourcesState {
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly isUploading: boolean;
  readonly showUploadSuccess: boolean;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: ResourceFilterType) => void;
  setSortBy: (sort: ResourceSortBy) => void;
  openDeleteDialog: (id: string) => void;
  closeDeleteDialog: () => void;
  setUploading: (value: boolean) => void;
  setShowUploadSuccess: (value: boolean) => void;
  resetUploadSuccess: () => void;
}

export const useLearningResourcesStore = create<LearningResourcesState>((set) => ({
  searchQuery: "",
  filterType: "all",
  sortBy: "date",
  pendingDeleteId: null,
  isUploading: false,
  showUploadSuccess: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
  setSortBy: (sort) => set({ sortBy: sort }),
  openDeleteDialog: (id) => set({ pendingDeleteId: id }),
  closeDeleteDialog: () => set({ pendingDeleteId: null }),
  setUploading: (value) => set({ isUploading: value }),
  setShowUploadSuccess: (value) => set({ showUploadSuccess: value }),
  resetUploadSuccess: () => set({ showUploadSuccess: false }),
}));
```

**Note:** The `ResourceFileType`, `ResourceFilterType`, and `ResourceSortBy` types are imported from the existing `mockResourcesStore.ts` since they are shared type definitions. In the future, these could be moved to a dedicated types file.

---

**Test Execution Requirements:**
- Run TypeScript check:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] `studentDirectoryStore` manages only UI state (search query), not data.
- [ ] `managersDirectoryStore` manages role and status filter state.
- [ ] `learningResourcesStore` manages search, filter, sort, upload, and delete dialog state.
- [ ] All stores use generated GraphQL types where applicable.
- [ ] No mock data in production stores.
- [ ] Mock stores remain untouched for Storybook stories (`*.stories.tsx`).
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
