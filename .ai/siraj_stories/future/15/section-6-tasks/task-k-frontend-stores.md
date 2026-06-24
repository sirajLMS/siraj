# Task K — Frontend Stores

## Sprint 15 · Frontend Stores Layer · Section 6

---

## Objective

Extend suggestion and complaint stores with new UI state management for review, respond, duplicate, delete, file upload, and parent suggestion history. Create a new `parentSuggestionsStore.ts` for the parent suggestion history view. All stores manage ONLY UI state — Apollo hooks (`useQuery`, `useMutation`) belong in React container components, NOT in Zustand stores.

---

## Dependencies

| Task | Description |
|------|-------------|
| I | Type Extraction (canonical types available in `suggestionsViewTypes.ts` and `complaintsViewTypes.ts`) |

---

## Target Files

| File | Action |
|------|--------|
| `frontend/stores/adminSuggestionsStore.ts` | NEW — UI state store replacing `mockAdminSuggestionsStore.ts` |
| `frontend/stores/parentSuggestionsStore.ts` | NEW — Parent suggestion history UI state store |
| `frontend/stores/adminComplaintsStore.ts` | NEW — UI state store replacing `mockAdminComplaintsStore.ts` |
| `frontend/stores/parentComplaintsStore.ts` | NEW — UI state store replacing `mockParentComplaintsStore.ts` |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/stores/AGENTS.md` for store layer rules
- [ ] Verify canonical types exist from Task I:
  - `suggestionsViewTypes.ts` with `AdminSuggestionRow`, `SuggestionStatusType`, `ParentSuggestionRecord`, `SuggestionSearchResult`
  - `complaintsViewTypes.ts` with `AdminComplaintRow`, `ComplaintFileType`, `ParentComplaintRecord`
- [ ] Verify generated GraphQL types exist from codegen:
  - `SuggestionStatus` enum in `graphql-types.ts`
  - `ComplaintFile` type in `graphql-types.ts`
- [ ] Confirm NO `any`, `unknown`, or casting will be used in store definitions
- [ ] Confirm all stores use `logger` from `@/frontend/utils/logger` (never `console`)
- [ ] **Confirm NO Apollo imports** — stores MUST NOT import `useQuery`, `useMutation`, `useApolloClient`, or any Apollo hook/client
- [ ] **Confirm NO GraphQL document imports** — stores MUST NOT import from `@/frontend/graphql/sharedDocuments/`
- [ ] **Confirm NO type definitions** — stores MUST NOT define entity types, interfaces, or type aliases
- [ ] **Confirm fake actions only** — store actions are simple state setters, no network requests or API calls

---

## Implementation Details

### 1. Admin Suggestions Store

Create `frontend/stores/adminSuggestionsStore.ts` as a UI state store. It does NOT fetch data — Apollo `useQuery` and `useMutation` are called in the container component (`AdminSuggestionsContainer.tsx`). The store holds only client-side UI state.

```typescript
import { create } from "zustand";
import type {
  SuggestionTab,
  SuggestionSearchResult,
} from "@/frontend/views/dashboard/suggestions/types/suggestionsViewTypes";

interface AdminSuggestionsStoreState {
  readonly searchQuery: string;
  readonly activeTab: SuggestionTab;
  readonly searchResults: readonly SuggestionSearchResult[];
  readonly searchLoading: boolean;
  readonly respondLoading: boolean;
  readonly duplicateLoading: boolean;
  readonly deleteLoading: boolean;
  readonly markingReviewedId: string;
  readonly isMarkingReviewed: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: SuggestionTab) => void;
  setSearchResults: (results: readonly SuggestionSearchResult[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setRespondLoading: (loading: boolean) => void;
  setDuplicateLoading: (loading: boolean) => void;
  setDeleteLoading: (loading: boolean) => void;
  setMarkingReviewedId: (id: string) => void;
  setIsMarkingReviewed: (value: boolean) => void;
  resetMarkingReviewed: () => void;
}

export const useAdminSuggestionsStore = create<AdminSuggestionsStoreState>(set => ({
  searchQuery: "",
  activeTab: "pending",
  searchResults: [],
  searchLoading: false,
  respondLoading: false,
  duplicateLoading: false,
  deleteLoading: false,
  markingReviewedId: "",
  isMarkingReviewed: false,

  setSearchQuery: query => {
    set({ searchQuery: query });
  },

  setActiveTab: tab => {
    set({ activeTab: tab });
  },

  setSearchResults: results => {
    set({ searchResults: results });
  },

  setSearchLoading: loading => {
    set({ searchLoading: loading });
  },

  setRespondLoading: loading => {
    set({ respondLoading: loading });
  },

  setDuplicateLoading: loading => {
    set({ duplicateLoading: loading });
  },

  setDeleteLoading: loading => {
    set({ deleteLoading: loading });
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
- Store manages ONLY UI state (search, tab, loading flags, search results)
- NO Apollo imports — no `useQuery`, `useMutation`, `useApolloClient`
- NO GraphQL document imports — no `*QueryDocument`, `*MutationDocument`
- NO type definitions — all types imported from `suggestionsViewTypes.ts`
- Fake actions only — simple state setters, no network requests
- Container component uses Apollo hooks and reads store state for UI variables
- `searchQuery` and `activeTab` are passed as Apollo query variables by the container
- Loading flags are set by the container before/after Apollo mutations

---

### 2. Parent Suggestions Store

Create `frontend/stores/parentSuggestionsStore.ts` as a UI state store for the parent suggestion history view.

```typescript
import { create } from "zustand";

interface ParentSuggestionsStoreState {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
}

export const useParentSuggestionsStore = create<ParentSuggestionsStoreState>(set => ({
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
- Minimal state — the parent suggestion view is a static form with no list, no filters, and no tabs
- NO Apollo imports — container uses `useMutation(submitSuggestionMutationDocument)`
- NO type definitions — this store has no domain-specific types
- Fake actions only — simple state setters
- `isSubmitting` is set to `true` by the container before the mutation fires and `false` after it resolves
- `showSuccess` controls the success banner visibility after a suggestion is submitted

---

### 3. Admin Complaints Store

Create `frontend/stores/adminComplaintsStore.ts` as a UI state store.

```typescript
import { create } from "zustand";
import type { ComplaintTab } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";

interface AdminComplaintsStoreState {
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly answerLoading: boolean;
  readonly respondingToId: string;
  readonly isResponding: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  setDraftResponse: (id: string, text: string) => void;
  clearDraftResponse: (id: string) => void;
  setAnswerLoading: (loading: boolean) => void;
  setRespondingToId: (id: string) => void;
  setIsResponding: (value: boolean) => void;
  resetResponding: () => void;
}

export const useAdminComplaintsStore = create<AdminComplaintsStoreState>(set => ({
  searchQuery: "",
  activeTab: "unanswered",
  draftResponses: {},
  answerLoading: false,
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

  setAnswerLoading: loading => {
    set({ answerLoading: loading });
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
- Store manages ONLY UI state (search, tab, draft responses, loading flags)
- NO Apollo imports — container uses `useQuery(adminComplaintsQueryDocument)` and `useMutation(answerComplaintMutationDocument)`
- NO type definitions — all types imported from `complaintsViewTypes.ts`
- Fake actions only — simple state setters
- `searchQuery` and `activeTab` are passed as Apollo query variables by the container
- `draftResponses` is a `Record<string, string>` keyed by complaint ID — stores the admin's in-progress response text
- `clearDraftResponse` removes a single entry after a response is successfully submitted

---

### 4. Parent Complaints Store

Create `frontend/stores/parentComplaintsStore.ts` as a UI state store with file upload state management.

```typescript
import { create } from "zustand";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

interface ParentComplaintsStoreState {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly hasOlderRecords: boolean;
  readonly selectedFiles: readonly File[];
  readonly fileValidationErrors: readonly string[];
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  setHasOlderRecords: (value: boolean) => void;
  setFiles: (files: readonly File[]) => void;
  removeFile: (index: number) => void;
  validateFiles: (files: readonly File[]) => boolean;
  setSubmitting: (value: boolean) => void;
  clearFiles: () => void;
}

export const useParentComplaintsStore = create<ParentComplaintsStoreState>((set, get) => ({
  isSubmitting: false,
  showSuccess: false,
  hasOlderRecords: true,
  selectedFiles: [],
  fileValidationErrors: [],

  setShowSuccess: value => {
    set({ showSuccess: value });
  },

  resetSuccess: () => {
    set({ showSuccess: false });
  },

  setHasOlderRecords: value => {
    set({ hasOlderRecords: value });
  },

  setFiles: files => {
    const isValid = get().validateFiles(files);
    if (isValid) {
      set({ selectedFiles: files, fileValidationErrors: [] });
    }
  },

  removeFile: index => {
    set(state => ({
      selectedFiles: state.selectedFiles.filter((_, i) => i !== index),
      fileValidationErrors: [],
    }));
  },

  validateFiles: files => {
    const errors: string[] = [];

    if (files.length > MAX_FILES) {
      errors.push(`Maximum ${MAX_FILES} files allowed. You selected ${files.length} files.`);
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the 10MB file size limit.`);
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
        errors.push(`"${file.name}" has an unsupported file type (${file.type || "unknown"}).`);
      }
    }

    if (errors.length > 0) {
      set({ fileValidationErrors: errors });
      return false;
    }

    return true;
  },

  setSubmitting: value => {
    set({ isSubmitting: value });
  },

  clearFiles: () => {
    set({ selectedFiles: [], fileValidationErrors: [] });
  },
}));
```

**Key points:**
- Store manages ONLY UI state (submitting, success, files, validation errors)
- NO Apollo imports — container uses `useQuery(parentComplaintsQueryDocument)` and `useMutation(submitComplaintMutationDocument)`
- NO type definitions — no domain-specific types needed
- Fake actions only — simple state setters and client-side file validation
- File validation runs synchronously in `validateFiles()` before any network request
- Container sets `isSubmitting` before mutation and clears files on success

---

## Store Architecture Rules

1. **Zustand for UI state** — All stores use `create` from `zustand`.
2. **Strict typing from generated types** — Store interfaces use types from `frontend/graphql/generated/gql/graphql-types.ts` and view-level `.types.ts` files. No redefining types.
3. **🚫 NO Apollo imports** — Store files MUST NEVER import `useQuery`, `useMutation`, `useApolloClient`, `useLazyQuery`, or any Apollo hook/client. Apollo belongs in container components ONLY.
4. **🚫 NO GraphQL document imports** — Store files MUST NEVER import from `@/frontend/graphql/sharedDocuments/` or any `.documents.ts` file.
5. **🚫 NO type definitions** — Store files MUST NOT define entity types, interfaces, or type aliases. Import all types from `.types.ts` files.
6. **Fake actions only** — Store actions are simple state setters. They do NOT perform network requests or call APIs. Real data fetching happens in container components.
7. **Generated GQL types and enums** — Use generated GraphQL types and enums from `graphql-types.ts` or view-level `.types.ts` files that re-export them. NEVER define local enum duplicates.
8. **No mock data in production stores** — Production stores manage UI state only. Mock data remains only in `*.stories.tsx` files and mock store files.
9. **Logger utility mandatory** — All logging uses `logger` from `@/frontend/utils/logger`. Never `console`.
10. **Container = bridge** — Container components are the ONLY place where Apollo hooks and Zustand stores coexist. Containers read store state for UI variables (search, tab, flags), pass them as Apollo query variables, and update store state based on Apollo loading/error/results.

---

## File Upload Validation Rules

The parent complaints store includes client-side file validation before submission:

| Rule | Limit | Error Message |
|------|-------|---------------|
| Maximum file count | 5 files | "Maximum 5 files allowed. You selected {count} files." |
| Maximum file size | 10MB per file | "{fileName}" exceeds the 10MB file size limit." |
| Allowed MIME types | PDF, JPEG, PNG, WebP, DOC, DOCX | "{fileName}" has an unsupported file type ({mimeType})." |

Validation runs synchronously in `validateFiles()` before any network request. If validation fails, `fileValidationErrors` is populated and the files are not accepted.

---

## Test Execution Requirements

Run TypeScript and lint checks after completing all store files:

```bash
bun tsgo
```

```bash
bun lint
```

Both commands must pass with zero errors.

---

## Success Criteria / Check Progress Points

- [ ] `adminSuggestionsStore.ts` created with UI state: `searchQuery`, `activeTab`, `searchResults`, loading flags, `markingReviewedId`, `isMarkingReviewed`
- [ ] `parentSuggestionsStore.ts` created with UI state: `isSubmitting`, `showSuccess`
- [ ] `adminComplaintsStore.ts` created with UI state: `searchQuery`, `activeTab`, `draftResponses`, `answerLoading`, `respondingToId`, `isResponding`
- [ ] `parentComplaintsStore.ts` created with UI state: `isSubmitting`, `showSuccess`, `selectedFiles`, `fileValidationErrors`, `hasOlderRecords`
- [ ] `parentComplaintsStore.ts` includes `validateFiles` with file count, size, and MIME type checks
- [ ] All stores use generated GraphQL types (no intermediate mappings)
- [ ] All stores use `logger` (no `console` calls)
- [ ] **NO Apollo imports in any store file** — no `useQuery`, `useMutation`, `useApolloClient`, `useLazyQuery`
- [ ] **NO GraphQL document imports in any store file** — no `*QueryDocument`, `*MutationDocument` from `sharedDocuments/`
- [ ] **NO local type definitions in any store file** — all types imported from `.types.ts` files
- [ ] **Store actions are simple state setters only** — no network requests, no API calls, no side effects
- [ ] **All types use generated GQL types and enums** from `graphql-types.ts` or view-level `.types.ts` files
- [ ] No mock data in any production store file
- [ ] No `any`, `unknown`, or casting in store definitions
- [ ] All state properties use `readonly` modifiers
- [ ] All state interfaces are NOT exported (internal to the store file)
- [ ] No circular import chains between stores and `.types.ts` files

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

---

## Notes

- Stores are PURE UI state containers. They do NOT fetch data or perform mutations.
- Container components are the bridge — they use Apollo hooks for data fetching and read/update store state for UI variables.
- The `adminSuggestionsStore` replaces the mock store in production containers. The mock store (`mockAdminSuggestionsStore.ts`) remains for Storybook backward compatibility.
- The `parentSuggestionsStore` is a new store. There was previously no dedicated parent suggestions store — the mock store only handled form submission. The new store adds UI state for the suggestion history view.
- File validation in `parentComplaintsStore` runs client-side only. Server-side validation will also occur in the backend service, but client-side validation provides immediate feedback to the user.
- All stores follow the pattern: Zustand manages UI state, Apollo manages data fetching and caching. This separation keeps stores simple and leverages Apollo's built-in cache normalization.
