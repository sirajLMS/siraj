### Task J — Frontend Stores: Real Zustand Stores

**Objective:** Create 4 real Zustand stores that manage UI state (filters, tabs, dialogs, submission flags) for the complaints and suggestions domains. These stores replace the mock stores for production use. Apollo hooks (`useQuery`, `useMutation`) are used inside React container components — NOT inside Zustand stores. The stores manage only UI state while Apollo manages data fetching in the container layer.

**Dependencies:** Task G (types extracted to `.types` files in `frontend/views/dashboard/complaints/types/complaints.types.ts` and `frontend/views/dashboard/suggestions/types/suggestions.types.ts`).

**Layer-Specific Rules (Frontend Stores — Flattened from frontend/stores/AGENTS.md):**
- Zustand for global state management
- Strict typing using GraphQL generated types and extracted `.types` files
- Direct assignment — solve TypeScript errors by adjusting GraphQL schema/queries, NOT complex intermediate mapping
- No mock data in production stores
- Apollo hooks (`useQuery`, `useMutation`) belong in React container components, NOT inside Zustand `create()` calls
- All imports must use `@/` path aliases — never relative paths crossing domain boundaries
- No `console` methods — use `logger` from `@/frontend/utils/logger` if logging is needed

**Target Files:**
- `frontend/stores/parentComplaintsStore.ts` — NEW (replaces `mockParentComplaintsStore.ts`)
- `frontend/stores/adminComplaintsStore.ts` — NEW (replaces `mockAdminComplaintsStore.ts`)
- `frontend/stores/parentSuggestionsStore.ts` — NEW (replaces `mockParentSuggestionsStore.ts`)
- `frontend/stores/adminSuggestionsStore.ts` — NEW (replaces `mockAdminSuggestionsStore.ts`)

---

#### Detailed Implementation Steps

---

##### Step 1 — Create `frontend/stores/parentComplaintsStore.ts`

This store manages UI state for the parent complaints view. It does NOT fetch data — Apollo `useQuery(parentComplaintsQueryDocument)` is called in the container component (`ParentComplaintsContainer.tsx`). The store holds only client-side UI state: submission flags, success banner visibility, and the student filter selection.

```typescript
import { create } from "zustand";
import type { ParentStudentOption } from "@/frontend/views/dashboard/complaints/types/complaints.types";

interface ParentComplaintsState {
  readonly studentOptions: readonly ParentStudentOption[];
  readonly selectedStudentId: string;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setStudentOptions: (options: readonly ParentStudentOption[]) => void;
  setSelectedStudentId: (id: string) => void;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
}

export const useParentComplaintsStore = create<ParentComplaintsState>(set => ({
  studentOptions: [],
  selectedStudentId: "",
  isSubmitting: false,
  showSuccess: false,
  setStudentOptions: options => {
    set({ studentOptions: options });
  },
  setSelectedStudentId: id => {
    set({ selectedStudentId: id });
  },
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
  setShowSuccess: value => {
    set({ showSuccess: value });
  },
  resetSuccess: () => {
    set({ showSuccess: false });
  },
}));
```

**Key points:**
- `studentOptions` starts as an empty array — the container component populates it from `parentAssociatedStudents` query data after Apollo fetches it.
- `selectedStudentId` tracks which student the parent has selected in the complaint form dropdown.
- `isSubmitting` is set to `true` before `useMutation(submitComplaintMutationDocument)` fires and `false` after it resolves.
- `showSuccess` controls the success banner visibility after a complaint is submitted.
- No mock data — all data comes from Apollo queries in the container component.
- No Apollo hooks inside the store — Zustand `create()` is not a React component.
- Types imported from `complaints.types.ts` (created in Task G).

---

##### Step 2 — Create `frontend/stores/adminComplaintsStore.ts`

This store manages UI state for the admin complaints queue view. The container component (`AdminComplaintsContainer.tsx`) uses `useQuery(adminComplaintQueueQueryDocument, { variables: { filter } })` to fetch data, passing the store's `searchQuery` and `activeTab` as filter variables. The store holds only client-side UI state: search string, active tab, and draft response text.

```typescript
import { create } from "zustand";
import type { ComplaintTab } from "@/frontend/views/dashboard/complaints/types/complaints.types";

interface AdminComplaintsState {
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly respondingToId: string;
  readonly isResponding: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  setDraftResponse: (id: string, text: string) => void;
  clearDraftResponse: (id: string) => void;
  setRespondingToId: (id: string) => void;
  setIsResponding: (value: boolean) => void;
  resetResponding: () => void;
}

export const useAdminComplaintsStore = create<AdminComplaintsState>(set => ({
  searchQuery: "",
  activeTab: "unanswered",
  draftResponses: {},
  respondingToId: "",
  isResponding: false,
  setSearchQuery: query => {
    set({ searchQuery: query });
  },
  setActiveTab: tab => {
    set({ activeTab: tab });
  },
  setDraftResponse: (id, text) => {
    set(state => ({
      draftResponses: { ...state.draftResponses, [id]: text },
    }));
  },
  clearDraftResponse: id => {
    set(state => ({
      draftResponses: Object.fromEntries(
        Object.entries(state.draftResponses).filter(([key]) => key !== id)
      ),
    }));
  },
  setRespondingToId: id => {
    set({ respondingToId: id });
  },
  setIsResponding: value => {
    set({ isResponding: value });
  },
  resetResponding: () => {
    set({ respondingToId: "", isResponding: false });
  },
}));
```

**Key points:**
- `searchQuery` is passed as a filter variable to `useQuery(adminComplaintQueueQueryDocument)` in the container component.
- `activeTab` maps to the complaint status filter: `"unanswered"` or `"answered"`. The container passes this as `filter.status` to the query.
- `draftResponses` is a `Record<string, string>` keyed by complaint ID — stores the admin's in-progress response text for each complaint card.
- `clearDraftResponse` removes a single entry after a response is successfully submitted via `useMutation(respondToComplaintMutationDocument)`.
- `respondingToId` tracks which complaint is currently being responded to (for loading indicator on the specific card).
- `isResponding` is set to `true` during the mutation call and `false` after it resolves.
- No mock data — all complaint rows, metrics, and summaries come from Apollo queries.
- No Apollo hooks inside the store.
- `ComplaintTab` type imported from `complaints.types.ts` (created in Task G).

---

##### Step 3 — Create `frontend/stores/parentSuggestionsStore.ts`

This store manages UI state for the parent suggestions view. The parent view is primarily a static form — the container component (`ParentSuggestionsContainer.tsx`) uses `useMutation(submitSuggestionMutationDocument)` to submit. The store holds only submission flags and success banner state.

```typescript
import { create } from "zustand";

interface ParentSuggestionsState {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
}

export const useParentSuggestionsStore = create<ParentSuggestionsState>(set => ({
  isSubmitting: false,
  showSuccess: false,
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
  setShowSuccess: value => {
    set({ showSuccess: value });
  },
  resetSuccess: () => {
    set({ showSuccess: false });
  },
}));
```

**Key points:**
- Minimal state — the parent suggestion view is a static form with no list, no filters, and no tabs.
- `isSubmitting` is set to `true` before `useMutation(submitSuggestionMutationDocument)` fires and `false` after it resolves.
- `showSuccess` controls the success banner visibility after a suggestion is submitted.
- No types to import — this store has no domain-specific types (the internal `ParentSuggestionsState` interface is not exported).
- No mock data — the mutation result comes from Apollo in the container component.
- No Apollo hooks inside the store.

---

##### Step 4 — Create `frontend/stores/adminSuggestionsStore.ts`

This store manages UI state for the admin suggestions queue view. The container component (`AdminSuggestionsContainer.tsx`) uses `useQuery(adminSuggestionsQueryDocument, { variables: { filter } })` to fetch data, passing the store's `searchQuery` and `activeTab` as filter variables. The store holds only client-side UI state.

```typescript
import { create } from "zustand";
import type { SuggestionTab } from "@/frontend/views/dashboard/suggestions/types/suggestions.types";

interface AdminSuggestionsState {
  readonly searchQuery: string;
  readonly activeTab: SuggestionTab;
  readonly markingReviewedId: string;
  readonly isMarkingReviewed: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: SuggestionTab) => void;
  setMarkingReviewedId: (id: string) => void;
  setIsMarkingReviewed: (value: boolean) => void;
  resetMarkingReviewed: () => void;
}

export const useAdminSuggestionsStore = create<AdminSuggestionsState>(set => ({
  searchQuery: "",
  activeTab: "pending",
  markingReviewedId: "",
  isMarkingReviewed: false,
  setSearchQuery: query => {
    set({ searchQuery: query });
  },
  setActiveTab: tab => {
    set({ activeTab: tab });
  },
  setMarkingReviewedId: id => {
    set({ markingReviewedId: id });
  },
  setIsMarkingReviewed: value => {
    set({ isMarkingReviewed: value });
  },
  resetMarkingReviewed: () => {
    set({ markingReviewedId: "", isMarkingReviewed: false });
  },
}));
```

**Key points:**
- `searchQuery` is passed as a filter variable to `useQuery(adminSuggestionsQueryDocument)` in the container component.
- `activeTab` maps to the suggestion status filter: `"pending"` or `"reviewed"`. The container passes this as `filter.status` to the query.
- `markingReviewedId` tracks which suggestion is currently being marked as reviewed (for loading indicator on the specific row).
- `isMarkingReviewed` is set to `true` during the `useMutation(markSuggestionReviewedMutationDocument)` call and `false` after it resolves.
- `resetMarkingReviewed` clears both flags after the mutation completes.
- No mock data — all suggestion rows, metrics, and summaries come from Apollo queries.
- No Apollo hooks inside the store.
- `SuggestionTab` type imported from `suggestions.types.ts` (created in Task G).

---

##### Step 5 — Update container components to use new stores

After creating all 4 stores, update the container components to import from the new stores instead of the mock stores. The container components are the integration point where Apollo hooks meet Zustand state.

---

**5a. `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx`**

**Before:**
```typescript
import { useParentComplaintsStore } from "@/frontend/stores/mockParentComplaintsStore";
```

**After:**
```typescript
import { useParentComplaintsStore } from "@/frontend/stores/parentComplaintsStore";
```

---

**5b. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx`**

**Before:**
```typescript
import { useAdminComplaintsStore } from "@/frontend/stores/mockAdminComplaintsStore";
```

**After:**
```typescript
import { useAdminComplaintsStore } from "@/frontend/stores/adminComplaintsStore";
```

---

**5c. `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx`**

**Before:**
```typescript
import { useParentSuggestionsStore } from "@/frontend/stores/mockParentSuggestionsStore";
```

**After:**
```typescript
import { useParentSuggestionsStore } from "@/frontend/stores/parentSuggestionsStore";
```

---

**5d. `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx`**

**Before:**
```typescript
import { useAdminSuggestionsStore } from "@/frontend/stores/mockAdminSuggestionsStore";
```

**After:**
```typescript
import { useAdminSuggestionsStore } from "@/frontend/stores/adminSuggestionsStore";
```

---

**Key points for Step 5:**
- Only the import path changes — the hook names remain identical (`useParentComplaintsStore`, `useAdminComplaintsStore`, `useParentSuggestionsStore`, `useAdminSuggestionsStore`).
- The container components must also be updated to use Apollo hooks for data fetching (replacing mock data access). This is a separate concern from the store migration — the container reads from the store for UI state and from Apollo for server data.
- Any component that was importing types from mock stores should already be updated to import from `.types.ts` files (done in Task G).
- The mock store files are NOT deleted in this task — they remain for backward compatibility until all consumers are migrated.

---

#### Container Component Integration Pattern

The container components serve as the bridge between Apollo data fetching and Zustand UI state. Here is the architectural pattern:

```
┌─────────────────────────────────────────────────────────┐
│  Container Component (React)                            │
│                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  Apollo useQuery     │  │  Zustand Store           │  │
│  │  (server data)       │  │  (UI state)              │  │
│  │                     │  │                          │  │
│  │  • complaints[]     │  │  • searchQuery           │  │
│  │  • metrics          │  │  • activeTab             │  │
│  │  • totalCount       │  │  • draftResponses        │  │
│  │  • loading          │  │  • isSubmitting          │  │
│  │  • error            │  │  • showSuccess           │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                         │
│  Apollo variables ← Zustand state (search, tab)         │
│  Apollo refetch   ← after mutation success              │
│  Zustand flags    ← Apollo loading/error states         │
└─────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Container reads `searchQuery` and `activeTab` from Zustand store.
2. Container passes these as `variables.filter` to `useQuery()`.
3. Apollo fetches data and returns `data`, `loading`, `error`.
4. Container passes `data.rows`, `data.metrics`, `loading` as props to child components.
5. User types in search → container calls `store.setSearchQuery()` → Apollo refetches with new variables.
6. User submits mutation → container calls `store.setSubmitting(true)` → fires `useMutation()` → on success, calls `store.setShowSuccess(true)` and `store.setSubmitting(false)` → calls Apollo `refetch()`.

---

#### File Creation and Modification Order

Execute the steps in this exact order to satisfy incremental type-checking:

1. `frontend/stores/parentComplaintsStore.ts` — NEW (UI state for parent complaints)
2. `frontend/stores/adminComplaintsStore.ts` — NEW (UI state for admin complaints)
3. `frontend/stores/parentSuggestionsStore.ts` — NEW (UI state for parent suggestions)
4. `frontend/stores/adminSuggestionsStore.ts` — NEW (UI state for admin suggestions)
5. `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx` — update import path
6. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx` — update import path
7. `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx` — update import path
8. `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx` — update import path

After creating/modifying each file, run the Quality Gate — Per-File Validation checklist before proceeding to the next file.

---

#### Test Execution Requirements

After completing all files, run the following to verify correctness:

```bash
~/.bun/bin/bun tsgo
```

This must pass with zero TypeScript errors. If errors occur, verify that:
1. All type imports from `complaints.types.ts` and `suggestions.types.ts` resolve correctly.
2. The Zustand `create<State>()` generic parameter matches the interface definition.
3. All `readonly` modifiers on state properties are consistent with the interface.
4. No circular import chains exist (store → `.types.ts` → store).

If UI component tests exist for the complaint/suggestion domain:

```bash
~/.bun/bin/bun run test:ui:components
```

If UI end-to-end tests exist:

```bash
~/.bun/bin/bun run test:ui:e2e
```

---

#### Success Criteria

- [ ] `parentComplaintsStore.ts` contains: `useParentComplaintsStore` hook with `studentOptions`, `selectedStudentId`, `isSubmitting`, `showSuccess` state and 5 actions
- [ ] `adminComplaintsStore.ts` contains: `useAdminComplaintsStore` hook with `searchQuery`, `activeTab`, `draftResponses`, `respondingToId`, `isResponding` state and 7 actions
- [ ] `parentSuggestionsStore.ts` contains: `useParentSuggestionsStore` hook with `isSubmitting`, `showSuccess` state and 3 actions
- [ ] `adminSuggestionsStore.ts` contains: `useAdminSuggestionsStore` hook with `searchQuery`, `activeTab`, `markingReviewedId`, `isMarkingReviewed` state and 5 actions
- [ ] All stores use `create` from `"zustand"` — no `createStore` or other APIs
- [ ] All stores import types from `.types.ts` files (not from mock stores or inline definitions)
- [ ] No mock data in any production store file
- [ ] No Apollo hooks (`useQuery`, `useMutation`) inside any Zustand `create()` call
- [ ] No `console` methods — use `logger` from `@/frontend/utils/logger` if logging is needed
- [ ] All state properties use `readonly` modifiers
- [ ] All state interfaces are NOT exported (internal to the store file)
- [ ] All 4 container components updated to import from new stores instead of mock stores
- [ ] Hook names match mock store equivalents exactly (backward-compatible naming)
- [ ] No circular import chains between stores and `.types.ts` files
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] All store runtime behavior compatible with Apollo container pattern

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
