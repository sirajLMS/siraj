# Task K — Frontend Stores

## Sprint 15 · Frontend Stores Layer · Section 6

---

## Objective

Extend suggestion and complaint stores with new actions for review, respond, duplicate, delete, file upload, and parent suggestion history. Create a new `parentSuggestionsStore.ts` for the parent suggestion history view. All stores use generated GraphQL types from `graphql-types.ts` and Apollo hooks via `TypedDocumentNode` from the frontend documents created in Task G.

---

## Dependencies

| Task | Description |
|------|-------------|
| I | Type Extraction (canonical types available in `suggestionsViewTypes.ts` and `complaintsViewTypes.ts`) |

---

## Target Files

| File | Action |
|------|--------|
| `frontend/stores/adminSuggestionsStore.ts` | NEW — Real store replacing `mockAdminSuggestionsStore.ts` |
| `frontend/stores/parentSuggestionsStore.ts` | NEW — Parent suggestion history store |
| `frontend/stores/adminComplaintsStore.ts` | NEW — Real store replacing `mockAdminComplaintsStore.ts` |
| `frontend/stores/parentComplaintsStore.ts` | NEW — Real store replacing `mockParentComplaintsStore.ts` |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/stores/AGENTS.md` for store layer rules
- [ ] Verify generated GraphQL documents exist from Task G:
  - `adminSuggestionsQueryDocument`
  - `respondToSuggestionMutationDocument`
  - `markSuggestionDuplicateMutationDocument`
  - `deleteSuggestionMutationDocument`
  - `searchSuggestionsQueryDocument`
  - `markSuggestionReviewedMutationDocument`
  - `parentSuggestionsQueryDocument`
  - `submitSuggestionMutationDocument`
  - `adminComplaintsQueryDocument`
  - `answerComplaintMutationDocument`
  - `parentComplaintsQueryDocument`
  - `submitComplaintMutationDocument`
- [ ] Verify canonical types exist from Task I:
  - `suggestionsViewTypes.ts` with `AdminSuggestionRow`, `SuggestionStatusType`, `ParentSuggestionRecord`, `SuggestionSearchResult`
  - `complaintsViewTypes.ts` with `AdminComplaintRow`, `ComplaintFileType`, `ParentComplaintRecord`
- [ ] Verify `useMutation` and `useQuery` are importable from `@apollo/client`
- [ ] Confirm no `any`, `unknown`, or casting will be used in store definitions
- [ ] Confirm all stores use `logger` from `@/frontend/utils/logger` (never `console`)

---

## Implementation Details

### 1. Admin Suggestions Store

Create `frontend/stores/adminSuggestionsStore.ts` as a real Zustand store that uses Apollo hooks for data fetching and mutations.

```typescript
import { create } from "zustand";
import { useMutation, useQuery } from "@apollo/client";
import { logger } from "@/frontend/utils/logger";
import {
  adminSuggestionsQueryDocument,
  respondToSuggestionMutationDocument,
  markSuggestionDuplicateMutationDocument,
  deleteSuggestionMutationDocument,
  searchSuggestionsQueryDocument,
  markSuggestionReviewedMutationDocument,
} from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import type {
  AdminSuggestionsQuery,
  RespondToSuggestionMutation,
  MarkSuggestionDuplicateMutation,
  DeleteSuggestionMutation,
  SearchSuggestionsQuery,
  MarkSuggestionReviewedMutation,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionSearchResult,
  SuggestionTab,
} from "@/frontend/views/dashboard/suggestions/types/suggestionsViewTypes";

interface AdminSuggestionsStoreState {
  readonly searchQuery: string;
  readonly activeTab: SuggestionTab;
  readonly searchResults: readonly SuggestionSearchResult[];
  readonly searchLoading: boolean;
  readonly respondLoading: boolean;
  readonly duplicateLoading: boolean;
  readonly deleteLoading: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: SuggestionTab) => void;
  useAdminSuggestionsQuery: () => {
    readonly data: AdminSuggestionsQuery | undefined;
    readonly loading: boolean;
    readonly error: string | undefined;
  };
  useRespondToSuggestion: () => (suggestionId: string, adminResponse: string) => Promise<void>;
  useMarkAsDuplicate: () => (suggestionId: string, duplicateOfId: string) => Promise<void>;
  useDeleteSuggestion: () => (suggestionId: string) => Promise<void>;
  useSearchSuggestions: () => (query: string, excludeId: string) => Promise<void>;
  useMarkReviewed: () => (suggestionId: string) => Promise<void>;
}

export const useAdminSuggestionsStore = create<AdminSuggestionsStoreState>((set, get) => ({
  searchQuery: "",
  activeTab: "pending",
  searchResults: [],
  searchLoading: false,
  respondLoading: false,
  duplicateLoading: false,
  deleteLoading: false,

  setSearchQuery: query => {
    set({ searchQuery: query });
  },

  setActiveTab: tab => {
    set({ activeTab: tab });
  },

  useAdminSuggestionsQuery: () => {
    const { data, loading, error } = useQuery(adminSuggestionsQueryDocument);
    return {
      data,
      loading,
      error: error?.message,
    };
  },

  useRespondToSuggestion: () => {
    const [respondMutation] = useMutation(respondToSuggestionMutationDocument);

    return async (suggestionId: string, adminResponse: string) => {
      set({ respondLoading: true });
      try {
        await respondMutation({
          variables: { suggestionId, adminResponse },
          refetchQueries: [{ query: adminSuggestionsQueryDocument }],
        });
        logger.info("Suggestion responded to successfully", { suggestionId });
      } catch (err) {
        logger.error("Failed to respond to suggestion", { suggestionId, error: err });
        throw err;
      } finally {
        set({ respondLoading: false });
      }
    };
  },

  useMarkAsDuplicate: () => {
    const [duplicateMutation] = useMutation(markSuggestionDuplicateMutationDocument);

    return async (suggestionId: string, duplicateOfId: string) => {
      set({ duplicateLoading: true });
      try {
        await duplicateMutation({
          variables: { suggestionId, duplicateOfId },
          refetchQueries: [{ query: adminSuggestionsQueryDocument }],
        });
        logger.info("Suggestion marked as duplicate", { suggestionId, duplicateOfId });
      } catch (err) {
        logger.error("Failed to mark suggestion as duplicate", { suggestionId, error: err });
        throw err;
      } finally {
        set({ duplicateLoading: false });
      }
    };
  },

  useDeleteSuggestion: () => {
    const [deleteMutation] = useMutation(deleteSuggestionMutationDocument);

    return async (suggestionId: string) => {
      set({ deleteLoading: true });
      try {
        await deleteMutation({
          variables: { suggestionId },
          refetchQueries: [{ query: adminSuggestionsQueryDocument }],
        });
        logger.info("Suggestion deleted successfully", { suggestionId });
      } catch (err) {
        logger.error("Failed to delete suggestion", { suggestionId, error: err });
        throw err;
      } finally {
        set({ deleteLoading: false });
      }
    };
  },

  useSearchSuggestions: () => {
    const [searchQuery] = useQuery(searchSuggestionsQueryDocument, {
      skip: true,
    });

    return async (query: string, excludeId: string) => {
      if (query.length < 3) {
        set({ searchResults: [], searchLoading: false });
        return;
      }

      set({ searchLoading: true });
      try {
        const result = await searchQuery({
          variables: { query, excludeId },
        });
        const results = result.data?.searchSuggestions ?? [];
        set({ searchResults: results as readonly SuggestionSearchResult[], searchLoading: false });
      } catch (err) {
        logger.error("Failed to search suggestions", { query, error: err });
        set({ searchResults: [], searchLoading: false });
      }
    };
  },

  useMarkReviewed: () => {
    const [reviewedMutation] = useMutation(markSuggestionReviewedMutationDocument);

    return async (suggestionId: string) => {
      try {
        await reviewedMutation({
          variables: { suggestionId },
          refetchQueries: [{ query: adminSuggestionsQueryDocument }],
        });
        logger.info("Suggestion marked as reviewed", { suggestionId });
      } catch (err) {
        logger.error("Failed to mark suggestion as reviewed", { suggestionId, error: err });
        throw err;
      }
    };
  },
}));
```

---

### 2. Parent Suggestions Store

Create `frontend/stores/parentSuggestionsStore.ts` as a new Zustand store for the parent suggestion history view. This is a mostly read-only store with a submit action.

```typescript
import { create } from "zustand";
import { useMutation, useQuery } from "@apollo/client";
import { logger } from "@/frontend/utils/logger";
import {
  parentSuggestionsQueryDocument,
  submitSuggestionMutationDocument,
} from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import type {
  ParentSuggestionsQuery,
  SubmitSuggestionMutation,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type { SuggestionFormData } from "@/frontend/views/dashboard/suggestions/schemas/suggestionFormSchema";

interface ParentSuggestionsStoreState {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  useParentSuggestionsQuery: () => {
    readonly data: ParentSuggestionsQuery | undefined;
    readonly loading: boolean;
    readonly error: string | undefined;
  };
  useSubmitSuggestion: () => (data: SuggestionFormData) => Promise<void>;
}

export const useParentSuggestionsStore = create<ParentSuggestionsStoreState>((set) => ({
  isSubmitting: false,
  showSuccess: false,

  setShowSuccess: value => {
    set({ showSuccess: value });
  },

  resetSuccess: () => {
    set({ showSuccess: false });
  },

  useParentSuggestionsQuery: () => {
    const { data, loading, error } = useQuery(parentSuggestionsQueryDocument);
    return {
      data,
      loading,
      error: error?.message,
    };
  },

  useSubmitSuggestion: () => {
    const [submitMutation] = useMutation(submitSuggestionMutationDocument);

    return async (data: SuggestionFormData) => {
      set({ isSubmitting: true });
      try {
        await submitMutation({
          variables: { body: data.suggestionText },
          refetchQueries: [{ query: parentSuggestionsQueryDocument }],
        });
        logger.info("Parent suggestion submitted successfully");
        set({ showSuccess: true, isSubmitting: false });
      } catch (err) {
        logger.error("Failed to submit suggestion", { error: err });
        set({ isSubmitting: false });
        throw err;
      }
    };
  },
}));
```

---

### 3. Admin Complaints Store

Create `frontend/stores/adminComplaintsStore.ts` as a real Zustand store replacing the mock store.

```typescript
import { create } from "zustand";
import { useMutation, useQuery } from "@apollo/client";
import { logger } from "@/frontend/utils/logger";
import {
  adminComplaintsQueryDocument,
  answerComplaintMutationDocument,
} from "@/frontend/graphql/sharedDocuments/complaint.documents";
import type {
  AdminComplaintsQuery,
  AnswerComplaintMutation,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type { ComplaintTab } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";

interface AdminComplaintsStoreState {
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly answerLoading: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  setDraftResponse: (id: string, text: string) => void;
  useAdminComplaintsQuery: () => {
    readonly data: AdminComplaintsQuery | undefined;
    readonly loading: boolean;
    readonly error: string | undefined;
  };
  useAnswerComplaint: () => (
    complaintId: string,
    adminResponse: string,
    options: { readonly sendEmail: boolean }
  ) => Promise<void>;
}

export const useAdminComplaintsStore = create<AdminComplaintsStoreState>((set, get) => ({
  searchQuery: "",
  activeTab: "unanswered",
  draftResponses: {},
  answerLoading: false,

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

  useAdminComplaintsQuery: () => {
    const { data, loading, error } = useQuery(adminComplaintsQueryDocument);
    return {
      data,
      loading,
      error: error?.message,
    };
  },

  useAnswerComplaint: () => {
    const [answerMutation] = useMutation(answerComplaintMutationDocument);

    return async (
      complaintId: string,
      adminResponse: string,
      options: { readonly sendEmail: boolean }
    ) => {
      set({ answerLoading: true });
      try {
        await answerMutation({
          variables: {
            complaintId,
            adminResponse,
            sendEmail: options.sendEmail,
          },
          refetchQueries: [{ query: adminComplaintsQueryDocument }],
        });

        set(state => ({
          draftResponses: Object.fromEntries(
            Object.entries(state.draftResponses).filter(([key]) => key !== complaintId)
          ),
          answerLoading: false,
        }));

        logger.info("Complaint answered successfully", { complaintId, sendEmail: options.sendEmail });
      } catch (err) {
        logger.error("Failed to answer complaint", { complaintId, error: err });
        set({ answerLoading: false });
        throw err;
      }
    };
  },
}));
```

---

### 4. Parent Complaints Store

Create `frontend/stores/parentComplaintsStore.ts` as a real Zustand store replacing the mock store, with file upload state management.

```typescript
import { create } from "zustand";
import { useMutation, useQuery } from "@apollo/client";
import { logger } from "@/frontend/utils/logger";
import {
  parentComplaintsQueryDocument,
  submitComplaintMutationDocument,
} from "@/frontend/graphql/sharedDocuments/complaint.documents";
import type {
  ParentComplaintsQuery,
  SubmitComplaintMutation,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type { ComplaintFormData } from "@/frontend/views/dashboard/complaints/schemas/complaintFormSchema";

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
  setFiles: (files: readonly File[]) => void;
  removeFile: (index: number) => void;
  validateFiles: (files: readonly File[]) => boolean;
  useParentComplaintsQuery: () => {
    readonly data: ParentComplaintsQuery | undefined;
    readonly loading: boolean;
    readonly error: string | undefined;
  };
  useSubmitComplaint: () => (data: ComplaintFormData) => Promise<void>;
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

  useParentComplaintsQuery: () => {
    const { data, loading, error } = useQuery(parentComplaintsQueryDocument);
    return {
      data,
      loading,
      error: error?.message,
    };
  },

  useSubmitComplaint: () => {
    const [submitMutation] = useMutation(submitComplaintMutationDocument);

    return async (data: ComplaintFormData) => {
      set({ isSubmitting: true });
      try {
        await submitMutation({
          variables: {
            studentId: data.studentId,
            complaintDetails: data.complaintDetails,
          },
          refetchQueries: [{ query: parentComplaintsQueryDocument }],
        });

        logger.info("Parent complaint submitted successfully");
        set({
          showSuccess: true,
          isSubmitting: false,
          selectedFiles: [],
          fileValidationErrors: [],
        });
      } catch (err) {
        logger.error("Failed to submit complaint", { error: err });
        set({ isSubmitting: false });
        throw err;
      }
    };
  },
}));
```

---

## Store Architecture Rules

1. **Zustand for global state** — All stores use `create` from `zustand`.
2. **Strict typing from generated types** — Store interfaces use types from `frontend/graphql/generated/gql/graphql-types.ts` and canonical view type files. No redefining types.
3. **Apollo hooks inside store hooks** — Store methods prefixed with `use` (e.g., `useAdminSuggestionsQuery`) are React hooks that call `useQuery` or `useMutation`. They must be called inside React components.
4. **UI state in Zustand, data in Apollo** — Zustand manages UI state (search query, active tab, loading flags, dialog state). Apollo manages data fetching and caching.
5. **No mock data in production stores** — Production stores fetch from the backend. Mock data remains only in `*.stories.tsx` files and mock store files.
6. **Logger utility mandatory** — All logging uses `logger` from `@/frontend/utils/logger`. Never `console`.
7. **Refetch after mutations** — All mutation actions include `refetchQueries` to update the Apollo cache after successful mutations.
8. **Error propagation** — Store actions catch errors, log them, and re-throw so components can display error UI.

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

- [ ] `adminSuggestionsStore.ts` created with `useAdminSuggestionsQuery`, `useRespondToSuggestion`, `useMarkAsDuplicate`, `useDeleteSuggestion`, `useSearchSuggestions`, `useMarkReviewed` hooks
- [ ] `adminSuggestionsStore.ts` manages UI state: `searchQuery`, `activeTab`, `searchResults`, loading flags
- [ ] `parentSuggestionsStore.ts` created with `useParentSuggestionsQuery` and `useSubmitSuggestion` hooks
- [ ] `parentSuggestionsStore.ts` manages UI state: `isSubmitting`, `showSuccess`
- [ ] `adminComplaintsStore.ts` created with `useAdminComplaintsQuery` and `useAnswerComplaint` hooks
- [ ] `adminComplaintsStore.ts` manages UI state: `searchQuery`, `activeTab`, `draftResponses`, `answerLoading`
- [ ] `parentComplaintsStore.ts` created with `useParentComplaintsQuery` and `useSubmitComplaint` hooks
- [ ] `parentComplaintsStore.ts` manages UI state: `isSubmitting`, `showSuccess`, `selectedFiles`, `fileValidationErrors`
- [ ] `parentComplaintsStore.ts` includes `validateFiles` with file count, size, and MIME type checks
- [ ] All stores use generated GraphQL types (no intermediate mappings)
- [ ] All stores use `logger` (no `console` calls)
- [ ] All mutation actions include `refetchQueries` for cache updates
- [ ] All mutation actions include proper loading state management
- [ ] All mutation actions catch errors, log them, and re-throw
- [ ] No mock data in any production store file
- [ ] No `any`, `unknown`, or casting in store definitions
- [ ] All `use*` methods are proper React hooks (called inside components)

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

- The `use*` prefix on store methods (e.g., `useAdminSuggestionsQuery`) indicates these are React hooks that must be called inside functional components. They cannot be called outside of React render context.
- The `adminSuggestionsStore` replaces the mock store in production containers. The mock store (`mockAdminSuggestionsStore.ts`) remains for Storybook backward compatibility.
- The `parentSuggestionsStore` is a new store. There was previously no dedicated parent suggestions store — the mock store only handled form submission. The new store adds query support for the suggestion history view.
- File validation in `parentComplaintsStore` runs client-side only. Server-side validation will also occur in the backend service, but client-side validation provides immediate feedback to the user.
- The `searchSuggestions` action uses `useQuery` with `skip: true` initially, then calls it manually with variables when the user types in the duplicate search field. This avoids unnecessary network requests on store initialization.
- All stores follow the pattern: Zustand manages UI state, Apollo manages data fetching and caching. This separation keeps stores simple and leverages Apollo's built-in cache normalization.
