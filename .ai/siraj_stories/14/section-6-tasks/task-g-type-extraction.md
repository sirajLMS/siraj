### Task G — Type Extraction from Mock Stores

**Objective:** Extract all types from 4 mock store files into dedicated `.types.ts` files, using generated GraphQL types where available. Update all component imports to point to the new `.types.ts` files instead of mock stores. Mock stores re-import their types from `.types.ts`.

**Dependencies:** Task F (codegen has run, generated types available in `frontend/graphql/generated/gql/graphql-types.ts`).

**Layer-Specific Rules (Frontend Views — Flattened from frontend/views/AGENTS.md):**
- Types must be co-located with their domain: `types/complaints.types.ts` and `types/suggestions.types.ts`
- Check `frontend/graphql/generated/gql/graphql-types.ts` FIRST for every type — if a generated type matches, re-export it
- If no generated equivalent exists, define the type locally as a UI-specific type
- No `any`, `unknown`, casting, or mapping — strictly forbidden
- Enums must match generated enum types exactly
- Use `z.custom` for Zod schemas with enum values
- All imports must use `@/` path aliases — never relative paths crossing domain boundaries

**Target Files:**
- `frontend/views/dashboard/complaints/types/complaints.types.ts` — NEW
- `frontend/views/dashboard/suggestions/types/suggestions.types.ts` — NEW
- Update imports in ~19 component/utility files (from mock stores → `.types`)
- Update 4 mock store files to re-import from `.types`

---

#### Detailed Implementation Steps

---

##### Step 1 — Create `frontend/views/dashboard/complaints/types/complaints.types.ts`

This file centralizes all complaint-related types currently scattered across mock stores. Since the generated `graphql-types.ts` does not yet contain complaint-specific domain types (no `ComplaintStatus` enum, no `AdminComplaintRow` type), all types are defined as UI-specific types. When GraphQL codegen produces matching types in a future task, these definitions will be replaced with re-exports.

```typescript
export type ComplaintTab = "unanswered" | "answered";

export type ComplaintPriority = "urgent" | "general";

export type ComplaintStatus = "unanswered" | "answered";

export type ParentComplaintRecordStatus = "pending" | "resolved";

export interface ParentComplaintRecordResponse {
  readonly text: string;
  readonly answeredAt: string;
}

export interface ParentComplaintRecord {
  readonly id: string;
  readonly regarding: string;
  readonly summary: string;
  readonly status: ParentComplaintRecordStatus;
  readonly adminResponse?: ParentComplaintRecordResponse;
}

export interface ParentStudentOption {
  readonly id: string;
  readonly label: string;
}

export interface AdminComplaintsSummary {
  readonly unanswered: number;
  readonly answered: number;
  readonly avgResolutionHours: string;
}

export interface AdminComplaintRow {
  readonly id: string;
  readonly submitterName: string;
  readonly submitterRole: string;
  readonly avatarUrl?: string;
  readonly priority: ComplaintPriority;
  readonly receivedAt: string;
  readonly complaintText: string;
  readonly status: ComplaintStatus;
  readonly adminResponse?: string;
  readonly answeredAt?: string;
}
```

**Key points:**
- `ComplaintTab`, `ComplaintPriority`, `ComplaintStatus` are string-literal union types — no generated enum equivalents exist yet.
- `ParentComplaintRecordStatus` is extracted from the inline `"pending" | "resolved"` union in the original mock store.
- `ParentComplaintRecordResponse` is extracted from the inline `{ readonly text: string; readonly answeredAt: string }` object type.
- `ParentComplaintRecord` and `ParentStudentOption` are UI-specific types with no GraphQL counterpart.
- `AdminComplaintsSummary` and `AdminComplaintRow` are UI-specific view-model types.
- All types use `readonly` modifiers to match the existing codebase convention.
- No `any`, `unknown`, or type assertions anywhere.

---

##### Step 2 — Create `frontend/views/dashboard/suggestions/types/suggestions.types.ts`

This file centralizes all suggestion-related types currently scattered across mock stores. Like complaints, no generated suggestion types exist yet in `graphql-types.ts`.

```typescript
export type SuggestionStatus = "pending" | "reviewed";

export type SuggestionTab = "pending" | "reviewed";

export interface AdminSuggestionsSummary {
  readonly pending: number;
  readonly reviewed: number;
  readonly avgResponseHours: string;
}

export interface AdminSuggestionRow {
  readonly id: string;
  readonly parentName: string;
  readonly suggestionPreview: string;
  readonly status: SuggestionStatus;
  readonly submittedAt: string;
}
```

**Key points:**
- `SuggestionStatus` and `SuggestionTab` are string-literal union types — no generated enum equivalents exist yet.
- `AdminSuggestionsSummary` and `AdminSuggestionRow` are UI-specific view-model types.
- `mockParentSuggestionsStore` exports no types (only internal state interface) — no extraction needed for parent suggestions.
- All types use `readonly` modifiers to match the existing codebase convention.
- No `any`, `unknown`, or type assertions anywhere.

---

##### Step 3 — Update `frontend/stores/mockParentComplaintsStore.ts`

Remove the inline type definitions and import them from the new `.types.ts` file. The Zustand store logic remains unchanged.

**Before (lines 1–16):**
```typescript
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type { ComplaintFormData } from "@/frontend/views/dashboard/complaints/schemas/complaintFormSchema";

export interface ParentComplaintRecord {
  readonly id: string;
  readonly regarding: string;
  readonly summary: string;
  readonly status: "pending" | "resolved";
  readonly adminResponse?: { readonly text: string; readonly answeredAt: string };
}

export interface ParentStudentOption {
  readonly id: string;
  readonly label: string;
}
```

**After:**
```typescript
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type { ComplaintFormData } from "@/frontend/views/dashboard/complaints/schemas/complaintFormSchema";
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/views/dashboard/complaints/types/complaints.types";

export type { ParentComplaintRecord, ParentStudentOption };
```

**Key points:**
- The `export type` re-exports preserve backward compatibility — any file still importing from the mock store will continue to work.
- The `ParentComplaintsState` interface and all Zustand store logic remain unchanged.
- Mock data arrays (`MOCK_STUDENT_OPTIONS`, `MOCK_RECORDS`, `OLDER_RECORDS`) remain unchanged — they now satisfy the imported types.

---

##### Step 4 — Update `frontend/stores/mockAdminComplaintsStore.ts`

Remove the inline type definitions and import them from the new `.types.ts` file.

**Before (lines 1–28):**
```typescript
// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";

export type ComplaintTab = "unanswered" | "answered";

export type ComplaintPriority = "urgent" | "general";

export type ComplaintStatus = "unanswered" | "answered";

export interface AdminComplaintsSummary {
  readonly unanswered: number;
  readonly answered: number;
  readonly avgResolutionHours: string;
}

export interface AdminComplaintRow {
  readonly id: string;
  readonly submitterName: string;
  readonly submitterRole: string;
  readonly avatarUrl?: string;
  readonly priority: ComplaintPriority;
  readonly receivedAt: string;
  readonly complaintText: string;
  readonly status: ComplaintStatus;
  readonly adminResponse?: string;
  readonly answeredAt?: string;
}
```

**After:**
```typescript
// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintTab,
} from "@/frontend/views/dashboard/complaints/types/complaints.types";

export type { AdminComplaintRow, AdminComplaintsSummary, ComplaintPriority, ComplaintStatus, ComplaintTab };
```

**Key points:**
- All 5 exported types are re-exported for backward compatibility.
- The `AdminComplaintsState` interface and all Zustand store logic remain unchanged.
- Mock data arrays (`MOCK_SUMMARY`, `MOCK_ROWS`) remain unchanged — they now satisfy the imported types.
- The `answerComplaint` function's `"answered" as const` assertion still satisfies `ComplaintStatus`.

---

##### Step 5 — Update `frontend/stores/mockParentSuggestionsStore.ts`

This store exports no types — only the `useParentSuggestionsStore` hook and an internal `ParentSuggestionsState` interface. No changes needed to this file.

---

##### Step 6 — Update `frontend/stores/mockAdminSuggestionsStore.ts`

Remove the inline type definitions and import them from the new `.types.ts` file.

**Before (lines 1–21):**
```typescript
// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";

export type SuggestionStatus = "pending" | "reviewed";

export type SuggestionTab = "pending" | "reviewed";

export interface AdminSuggestionsSummary {
  readonly pending: number;
  readonly reviewed: number;
  readonly avgResponseHours: string;
}

export interface AdminSuggestionRow {
  readonly id: string;
  readonly parentName: string;
  readonly suggestionPreview: string;
  readonly status: SuggestionStatus;
  readonly submittedAt: string;
}
```

**After:**
```typescript
// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionStatus,
  SuggestionTab,
} from "@/frontend/views/dashboard/suggestions/types/suggestions.types";

export type { AdminSuggestionRow, AdminSuggestionsSummary, SuggestionStatus, SuggestionTab };
```

**Key points:**
- All 4 exported types are re-exported for backward compatibility.
- The `AdminSuggestionsState` interface and all Zustand store logic remain unchanged.
- Mock data arrays (`MOCK_SUMMARY`, `MOCK_ROWS`) remain unchanged.
- The `markReviewed` function's `"reviewed"` literal still satisfies `SuggestionStatus`.

---

##### Step 7 — Update complaint component imports (11 files)

Each file below currently imports types from a mock store. Update the import path to point to the new `.types.ts` file. Files that import the Zustand hook (`useAdminComplaintsStore`, `useParentComplaintsStore`) keep the store import and add a separate type import from `.types`.

---

**7a. `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts`**

**Before:**
```typescript
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
} from "@/frontend/stores/mockAdminComplaintsStore";
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/stores/mockParentComplaintsStore";
```

**After:**
```typescript
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
  ParentComplaintRecord,
  ParentStudentOption,
} from "./complaints.types";
```

---

**7b. `frontend/views/dashboard/complaints/utils/complaintFilters.ts`**

**Before:**
```typescript
import type { AdminComplaintRow, ComplaintTab } from "@/frontend/stores/mockAdminComplaintsStore";
```

**After:**
```typescript
import type { AdminComplaintRow, ComplaintTab } from "../types/complaints.types";
```

---

**7c. `frontend/views/dashboard/complaints/components/ComplaintFormFields.tsx`**

**Before:**
```typescript
import type { ParentStudentOption } from "@/frontend/stores/mockParentComplaintsStore";
```

**After:**
```typescript
import type { ParentStudentOption } from "../types/complaints.types";
```

---

**7d. `frontend/views/dashboard/complaints/components/ComplaintQueueCard.tsx`**

**Before:**
```typescript
import type { AdminComplaintRow, ComplaintPriority } from "@/frontend/stores/mockAdminComplaintsStore";
```

**After:**
```typescript
import type { AdminComplaintRow, ComplaintPriority } from "../types/complaints.types";
```

---

**7e. `frontend/views/dashboard/complaints/components/ComplaintQueueCardList.tsx`**

**Before:**
```typescript
import type { AdminComplaintRow } from "@/frontend/stores/mockAdminComplaintsStore";
```

**After:**
```typescript
import type { AdminComplaintRow } from "../types/complaints.types";
```

---

**7f. `frontend/views/dashboard/complaints/components/ComplaintRecordCard.tsx`**

**Before:**
```typescript
import type { ParentComplaintRecord } from "@/frontend/stores/mockParentComplaintsStore";
```

**After:**
```typescript
import type { ParentComplaintRecord } from "../types/complaints.types";
```

---

**7g. `frontend/views/dashboard/complaints/components/ComplaintRecordCardList.tsx`**

**Before:**
```typescript
import type { ParentComplaintRecord } from "@/frontend/stores/mockParentComplaintsStore";
```

**After:**
```typescript
import type { ParentComplaintRecord } from "../types/complaints.types";
```

---

**7h. `frontend/views/dashboard/complaints/components/ComplaintsMetricsRow.tsx`**

**Before:**
```typescript
import type { AdminComplaintsSummary } from "@/frontend/stores/mockAdminComplaintsStore";
```

**After:**
```typescript
import type { AdminComplaintsSummary } from "../types/complaints.types";
```

---

**7i. `frontend/views/dashboard/complaints/components/ComplaintsTabBar.tsx`**

**Before:**
```typescript
import type { ComplaintTab } from "@/frontend/stores/mockAdminComplaintsStore";
```

**After:**
```typescript
import type { ComplaintTab } from "../types/complaints.types";
```

---

**7j. `frontend/views/dashboard/complaints/ParentComplaintsDesktopView.tsx`**

**Before:**
```typescript
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/stores/mockParentComplaintsStore";
```

**After:**
```typescript
import type { ParentComplaintRecord, ParentStudentOption } from "./types/complaints.types";
```

---

**7k. `frontend/views/dashboard/complaints/ParentComplaintsMobileView.tsx`**

**Before:**
```typescript
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/stores/mockParentComplaintsStore";
```

**After:**
```typescript
import type { ParentComplaintRecord, ParentStudentOption } from "./types/complaints.types";
```

---

**7l. `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx`**

This file imports the Zustand hook — keep the store import, no type imports to change.

**No changes needed** — the file imports `useParentComplaintsStore` (a runtime hook), not types.

---

**7m. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx`**

This file imports the Zustand hook — keep the store import, no type imports to change.

**No changes needed** — the file imports `useAdminComplaintsStore` (a runtime hook), not types.

---

##### Step 8 — Update suggestion component imports (6 files)

---

**8a. `frontend/views/dashboard/suggestions/types/suggestionsViewTypes.ts`**

**Before:**
```typescript
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionTab,
} from "@/frontend/stores/mockAdminSuggestionsStore";
```

**After:**
```typescript
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionTab,
} from "./suggestions.types";
```

---

**8b. `frontend/views/dashboard/suggestions/utils/suggestionFilters.ts`**

**Before:**
```typescript
import type { AdminSuggestionRow, SuggestionTab } from "@/frontend/stores/mockAdminSuggestionsStore";
```

**After:**
```typescript
import type { AdminSuggestionRow, SuggestionTab } from "../types/suggestions.types";
```

---

**8c. `frontend/views/dashboard/suggestions/components/SuggestionsDataGrid.tsx`**

**Before:**
```typescript
import type { AdminSuggestionRow, SuggestionStatus } from "@/frontend/stores/mockAdminSuggestionsStore";
```

**After:**
```typescript
import type { AdminSuggestionRow, SuggestionStatus } from "../types/suggestions.types";
```

---

**8d. `frontend/views/dashboard/suggestions/components/SuggestionsCardList.tsx`**

**Before:**
```typescript
import type { AdminSuggestionRow, SuggestionStatus } from "@/frontend/stores/mockAdminSuggestionsStore";
```

**After:**
```typescript
import type { AdminSuggestionRow, SuggestionStatus } from "../types/suggestions.types";
```

---

**8e. `frontend/views/dashboard/suggestions/components/SuggestionsMetricsRow.tsx`**

**Before:**
```typescript
import type { AdminSuggestionsSummary } from "@/frontend/stores/mockAdminSuggestionsStore";
```

**After:**
```typescript
import type { AdminSuggestionsSummary } from "../types/suggestions.types";
```

---

**8f. `frontend/views/dashboard/suggestions/components/SuggestionsTabBar.tsx`**

**Before:**
```typescript
import type { SuggestionTab } from "@/frontend/stores/mockAdminSuggestionsStore";
```

**After:**
```typescript
import type { SuggestionTab } from "../types/suggestions.types";
```

---

**8g. `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx`**

This file imports the Zustand hook — keep the store import, no type imports to change.

**No changes needed** — the file imports `useParentSuggestionsStore` (a runtime hook), not types.

---

**8h. `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx`**

This file imports the Zustand hook — keep the store import, no type imports to change.

**No changes needed** — the file imports `useAdminSuggestionsStore` (a runtime hook), not types.

---

#### File Creation and Modification Order

Execute the steps in this exact order to satisfy incremental type-checking:

1. `frontend/views/dashboard/complaints/types/complaints.types.ts` — NEW (all complaint types)
2. `frontend/views/dashboard/suggestions/types/suggestions.types.ts` — NEW (all suggestion types)
3. `frontend/stores/mockParentComplaintsStore.ts` — remove inline types, add import + re-export
4. `frontend/stores/mockAdminComplaintsStore.ts` — remove inline types, add import + re-export
5. `frontend/stores/mockAdminSuggestionsStore.ts` — remove inline types, add import + re-export
6. All 11 complaint component files — update import paths
7. All 6 suggestion component files — update import paths

After creating/modifying each file, run the Quality Gate — Per-File Validation checklist before proceeding to the next file.

---

#### Test Execution Requirements

After completing all files, run the following to verify correctness:

```bash
~/.bun/bin/bun tsgo
```

This must pass with zero TypeScript errors. If errors occur, verify that:
1. All type names in `.types.ts` files match the original mock store exports exactly.
2. All import paths use correct relative paths (e.g., `../types/complaints.types` from `components/`, `./types/complaints.types` from root view files).
3. The `export type` re-exports in mock stores preserve backward compatibility for any files not yet updated.
4. No circular import chains exist (`.types.ts` → mock store → `.types.ts`).

If UI component tests exist for the complaint/suggestion domain:

```bash
~/.bun/bin/bun run test:ui:components
```

---

#### Success Criteria

- [ ] `complaints.types.ts` contains all 9 types: `ComplaintTab`, `ComplaintPriority`, `ComplaintStatus`, `ParentComplaintRecordStatus`, `ParentComplaintRecordResponse`, `ParentComplaintRecord`, `ParentStudentOption`, `AdminComplaintsSummary`, `AdminComplaintRow`
- [ ] `suggestions.types.ts` contains all 4 types: `SuggestionStatus`, `SuggestionTab`, `AdminSuggestionsSummary`, `AdminSuggestionRow`
- [ ] All types use `readonly` modifiers matching the original mock store definitions
- [ ] No `any`, `unknown`, type assertions, or mapping functions in `.types.ts` files
- [ ] `mockParentComplaintsStore.ts` imports types from `complaints.types.ts` and re-exports them
- [ ] `mockAdminComplaintsStore.ts` imports types from `complaints.types.ts` and re-exports them
- [ ] `mockAdminSuggestionsStore.ts` imports types from `suggestions.types.ts` and re-exports them
- [ ] `mockParentSuggestionsStore.ts` unchanged (no types to extract)
- [ ] All 11 complaint component files import types from `complaints.types.ts` instead of mock stores
- [ ] All 6 suggestion component files import types from `suggestions.types.ts` instead of mock stores
- [ ] Container files (`ParentComplaintsContainer.tsx`, `AdminComplaintsContainer.tsx`, `ParentSuggestionsContainer.tsx`, `AdminSuggestionsContainer.tsx`) still import hooks from mock stores
- [ ] No circular import chains between `.types.ts` files and mock stores
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] All mock store runtime behavior unchanged (mock data, Zustand state, actions)

---

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
