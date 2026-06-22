### Task G — Type Extraction: Move Shared Types from Mock Stores to Dedicated `.types.ts` Files

**Objective:** Extract all shared TypeScript interfaces and types currently defined inside mock store files (`mockStudentsStore.ts`, `mockManagersStore.ts`, `mockResourcesStore.ts`) into dedicated `.types.ts` files. Cross-reference with generated GraphQL types in `frontend/graphql/generated/gql/graphql-types.ts` to use generated types where available and define UI-specific types only where needed.

**Dependencies:** Depends on Task F — frontend GraphQL documents are created and codegen has run, so generated types are available for cross-referencing.

**Layer-Specific Rules:**
- **Generated types first**: Before defining any custom type, check `frontend/graphql/generated/gql/graphql-types.ts` for the generated equivalent. If the generated type matches the UI's needs, use it directly. Only create UI-specific types when the generated type is missing fields, has incompatible nullability, or doesn't exist yet.
- **One types file per domain**: Types are extracted to `<domain>.types.ts` in the same directory as the view components.
- **Mock stores import from types files**: After extraction, mock stores re-import the types from the new `.types.ts` files. No type definitions remain in mock store files.
- **No circular dependencies**: Types files must not import from stores, containers, or services. They are leaf dependencies only.

**Target Files:**
- `frontend/views/dashboard/students/home/types.ts` — NEW (extracted from mockStudentsStore)
- `frontend/views/dashboard/managers/home/types.ts` — NEW (extracted from mockManagersStore)
- `frontend/views/dashboard/resources/types.ts` — NEW (extracted from mockResourcesStore, note: a `types/` directory already exists)
- `frontend/stores/mockStudentsStore.ts` — MODIFY (remove type definitions, re-import from types file)
- `frontend/stores/mockManagersStore.ts` — MODIFY (remove type definitions, re-import from types file)
- `frontend/stores/mockResourcesStore.ts` — MODIFY (remove type definitions, re-import from types file)

---

**Detailed Implementation Steps:**

*Step 1: Audit generated GraphQL types*

Before extracting any types, check `frontend/graphql/generated/gql/graphql-types.ts` for the following generated types (these will exist after Task E codegen):

**Expected generated types after Story 11 codegen:**

| **Generated Type** | **Fields** | **Maps To** |
|---|---|---|
| `StudentDirectoryRow` | `id`, `name`, `email`, `status`, `classesRemaining`, `classesTotal`, `hoursPerWeek`, `parentName`, `teacherName`, `createdAt` | Mock's `StudentDirectoryRow` (partial overlap) |
| `ManagerDirectoryRow` | `id`, `staffProfileId`, `name`, `email`, `phone`, `skypeId`, `status`, `roleSlug`, `roleName` | Mock's `Manager` (different shape) |
| `LearningResourceRow` | `id`, `displayName`, `filePath`, `uploadedByUserId`, `uploadedByUserName`, `fileSize`, `contentType`, `createdAt` | Mock's `LearningResourceRow` (different shape) |
| `ResourceUploadInput` | `displayName`, `filePath`, `fileId` | N/A (input type only) |

**Type reconciliation decisions:**

| **Mock Type** | **Generated Equivalent** | **Decision** |
|---|---|---|
| `StudentDirectoryRow` (mock) | `StudentDirectoryRow` (generated) | **Use generated type directly** for data coming from GraphQL. Define `StudentAccountStatus` and `StudentEnrollmentStatus` as UI-specific mapped types in the `.types.ts` file since the GraphQL `status` field is a string, not a union type. |
| `StudentAccountStatus` | N/A (GraphQL uses `StudentStatus` enum with different values) | **Keep as UI-specific type** — the mock uses lowercase strings (`"activated"`, `"regular"`) while GraphQL uses `StudentStatus` enum (`REGULAR`, `DEACTIVATED`). A mapper function in the container converts between them. |
| `StudentEnrollmentStatus` | N/A (not in GraphQL schema) | **Keep as UI-specific type** — derived from business logic, not a DB column. |
| `Manager` (mock) | `ManagerDirectoryRow` (generated) | **Use generated type** for data. Define `ManagerRole` and `ManagerStatus` as UI-specific types for the filter dropdowns. |
| `LearningResourceRow` (mock) | `LearningResourceRow` (generated) | **Use generated type** for data. Define `ResourceFileType`, `ResourceFilterType`, `ResourceSortBy` as UI-specific types. |
| `MOBILE_METRIC_KEYS`, `MOBILE_METRIC_ICONS` | N/A (constants, not types) | **Move to types file** as exported constants. |

---

*Step 2: Create `frontend/views/dashboard/students/home/types.ts`*

```typescript
/**
 * Student Directory — Shared Types
 *
 * GraphQL-generated types (from codegen) are used for data shapes.
 * This file contains UI-specific types that don't have a direct GraphQL equivalent.
 */

// Re-export generated GraphQL type for use across components
export type { StudentDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * UI-specific status union type.
 * Maps from GraphQL StudentStatus enum values to display-friendly lowercase strings.
 * The container component is responsible for mapping between GraphQL enum and these values.
 */
export type StudentAccountStatus =
  | "activated"
  | "deactivated"
  | "regular"
  | "on_leave"
  | "suspended"
  | "on_trial";

/**
 * UI-specific enrollment status.
 * Not present in the GraphQL schema — derived from business logic (e.g., classes_total, status).
 */
export type StudentEnrollmentStatus = "regular" | "prospect" | "withdrawn";

/**
 * Metric item displayed in the student directory header cards.
 */
export interface MetricItem {
  readonly key: string;
  readonly value: number;
  readonly label: string;
}

/**
 * Mobile-specific metric keys — subset of all metrics shown on mobile viewport.
 */
export const MOBILE_METRIC_KEYS = ["activated", "regular", "on_leave", "suspended"] as const;

/**
 * Icon mapping for mobile metric display.
 * Import icons at point of use in the container or view component.
 */
export const MOBILE_METRIC_ICON_KEYS = {
  activated: "HowToRegOutlined",
  regular: "PersonOutlined",
  on_leave: "EventBusyOutlined",
  suspended: "BlockOutlined",
} as const;
```

**Note:** The actual icon imports (`HowToRegOutlined`, etc.) should be in the container/view component, not in the types file, to avoid importing MUI icons in a pure types module. The `MOBILE_METRIC_ICON_KEYS` maps keys to icon names; the container resolves the actual icon components.

---

*Step 3: Create `frontend/views/dashboard/managers/home/types.ts`*

```typescript
/**
 * Managers Directory — Shared Types
 *
 * GraphQL-generated types (from codegen) are used for data shapes.
 * This file contains UI-specific types for filters and display logic.
 */

// Re-export generated GraphQL type for use across components
export type { ManagerDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * UI-specific role filter type.
 * Maps from GraphQL `roleSlug` (e.g., "super_admin", "academy_admin") to display-friendly categories.
 */
export type ManagerRole = "admin" | "staff";

/**
 * UI-specific status filter type.
 */
export type ManagerStatus = "active" | "offline";

/**
 * Manager directory metrics displayed in header cards.
 */
export interface ManagersMetrics {
  readonly totalAdmin: number;
  readonly systemStaff: number;
  readonly activeNow: number;
  readonly alerts: number;
}

/**
 * Helper type for the role filter dropdown.
 */
export type ManagerRoleFilter = "all" | ManagerRole;

/**
 * Helper type for the status filter dropdown.
 */
export type ManagerStatusFilter = "all" | ManagerStatus;
```

---

*Step 4: Create `frontend/views/dashboard/resources/types.ts`*

Check if `frontend/views/dashboard/resources/types/` directory already exists. If it does, create the file as `frontend/views/dashboard/resources/types/resourcesTypes.ts` or append to the existing types file. If the directory is empty or the types file doesn't cover these types, create a new file.

```typescript
/**
 * Learning Resources — Shared Types
 *
 * GraphQL-generated types (from codegen) are used for data shapes.
 * This file contains UI-specific types for file type classification, filtering, and sorting.
 */

// Re-export generated GraphQL types for use across components
export type {
  LearningResourceRow,
  ResourceUploadInput,
} from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * Supported resource file types for display and filtering.
 * Derived from the file extension in `filePath`, not from GraphQL.
 */
export type ResourceFileType = "pdf" | "pptx" | "xlsx" | "docx";

/**
 * Sort order for the resource library list.
 */
export type ResourceSortBy = "date" | "name";

/**
 * Filter type for the resource library — "all" or a specific file type.
 */
export type ResourceFilterType = ResourceFileType | "all";

/**
 * Upload form data shape — used by the upload dialog component.
 * This is the form-level type before it's converted to `ResourceUploadInput` for the mutation.
 */
export interface ResourceUploadFormData {
  readonly documentName: string;
  readonly fileName: string;
}
```

---

*Step 5: Update mock stores to import from types files*

**`frontend/stores/mockStudentsStore.ts`** — Remove type definitions, add imports:

Replace the locally-defined types with imports:
```typescript
// REMOVE these local definitions:
// export type StudentAccountStatus = ...
// export type StudentEnrollmentStatus = ...
// export interface StudentDirectoryRow { ... }
// export const MOBILE_METRIC_KEYS = ...
// export const MOBILE_METRIC_ICONS = ...

// ADD these imports:
import type { StudentAccountStatus, StudentEnrollmentStatus } from "@/frontend/views/dashboard/students/home/types";
import { MOBILE_METRIC_KEYS } from "@/frontend/views/dashboard/students/home/types";
// Re-export for backward compatibility with existing imports
export type { StudentAccountStatus, StudentEnrollmentStatus } from "@/frontend/views/dashboard/students/home/types";
export { MOBILE_METRIC_KEYS } from "@/frontend/views/dashboard/students/home/types";
```

**`frontend/stores/mockManagersStore.ts`** — Remove type definitions, add imports:
```typescript
// REMOVE: export interface Manager { ... }

// ADD:
import type { ManagerRole, ManagerStatus } from "@/frontend/views/dashboard/managers/home/types";
// Define Manager locally using the UI types, or re-export from types
// Since the mock store's Manager interface has a specific shape used by mock data,
// keep the interface but use the extracted types for role/status fields:
export interface Manager {
  id: string;
  name: string;
  role: ManagerRole;
  status: ManagerStatus;
  email: string;
  skypeId: string;
  phone: string;
  avatarUrl: string;
}
```

**`frontend/stores/mockResourcesStore.ts`** — Remove type definitions, add imports:
```typescript
// REMOVE: export type ResourceFileType = ...
// REMOVE: export type ResourceSortBy = ...
// REMOVE: export type ResourceFilterType = ...
// REMOVE: export interface LearningResourceRow { ... }

// ADD:
import type { ResourceFileType, ResourceFilterType, ResourceSortBy, ResourceUploadFormData } from "@/frontend/views/dashboard/resources/types";
// Re-export for backward compatibility
export type { ResourceFileType, ResourceFilterType, ResourceSortBy, ResourceUploadFormData } from "@/frontend/views/dashboard/resources/types";
```

The mock `LearningResourceRow` interface in the store uses different field names (`title`, `fileName`, `fileType`, `uploadedAt`) than the generated GraphQL type (`displayName`, `filePath`, `createdAt`). Since the mock store keeps its own mock data shape for Storybook, define a local `MockLearningResourceRow` type in the mock store that maps the mock shape:

```typescript
// In mockResourcesStore.ts — mock-specific shape for Storybook
export interface MockLearningResourceRow {
  readonly id: string;
  readonly title: string;
  readonly fileName: string;
  readonly fileType: ResourceFileType;
  readonly uploadedAt: string;
  readonly uploadedAtTimestamp: number;
}
```

---

*Step 6: Update sub-component imports*

Any sub-component that currently imports types from mock stores should be updated to import from the `.types.ts` files instead:

**Students sub-components** (`StudentsDesktopView.tsx`, `StudentsMobileView.tsx`, `StudentsView.tsx`):
- Change `import type { StudentDirectoryRow } from "@/frontend/stores/mockStudentsStore"` to `import type { StudentDirectoryRow } from "./types"` (or from the generated types directly).

**Managers sub-components** (`ManagersCardList.tsx`, `ManagersDataGrid.tsx`, etc.):
- Change `import type { Manager } from "@/frontend/stores/mockManagersStore"` to use the extracted types.

**Resources sub-components** (`ResourcesDesktopView.tsx`, `ResourcesMobileView.tsx`, etc.):
- Change `import type { LearningResourceRow } from "@/frontend/stores/mockResourcesStore"` to use the extracted types.

---

**Test Execution Requirements:**
- Run TypeScript check:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] `students/home/types.ts` created with UI-specific types + re-exports of generated GraphQL types.
- [ ] `managers/home/types.ts` created with UI-specific types + re-exports of generated GraphQL types.
- [ ] `resources/types.ts` created with UI-specific types + re-exports of generated GraphQL types.
- [ ] All type definitions removed from mock store files.
- [ ] Mock stores re-import types from `.types.ts` files for backward compatibility.
- [ ] Sub-components updated to import types from `.types.ts` files.
- [ ] `MOBILE_METRIC_KEYS` and `MOBILE_METRIC_ICONS` moved to types file.
- [ ] Generated GraphQL types (`StudentDirectoryRow`, `ManagerDirectoryRow`, `LearningResourceRow`) used where available.
- [ ] No circular dependencies (types files don't import from stores or containers).
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
