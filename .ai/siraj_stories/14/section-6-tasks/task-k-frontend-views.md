### Task K — Frontend Views: Container Migration & Mock Store Deletion

**Objective:**
Replace mock store imports in all 4 complaint and suggestion containers with real Zustand stores (UI state only) and Apollo `useQuery`/`useMutation` hooks (data fetching). Fix incorrect permission checks to use the new `AppPermission` enum values from Task A. Wrap container output in `<RequirePermission>` for declarative access control. Delete all 4 mock store files after migration is complete.

**Dependencies:**
- **Task I** — Storybook Migration: Stories already use `MockedProvider` with mock GraphQL responses, so containers can safely switch from mock stores to real Apollo hooks without breaking stories.
- **Task J** — Real Zustand Stores: `parentComplaintsStore`, `adminComplaintsStore`, `parentSuggestionsStore`, `adminSuggestionsStore` exist and export UI-state-only hooks plus shared view types.

---

#### Layer-Specific Rules

Read `frontend/views/AGENTS.md` before starting.

1. **Functional Components only** — no class components.
2. **Access Control**: Use `<RequirePermission permissions={[AppPermission.X]} />` to gate rendered output. Derive secondary capability flags (e.g., `canManage`) from `useUserStore` via `hasPermission`.
3. **Data Fetching**: Apollo `useQuery` with `TypedDocumentNode` from `@apollo/client/react`. Mutations use `useMutation` from the same path.
4. **NO hardcoded colors** — theme palette only via `sx` callbacks or `styled`.
5. **Mock Data Ban**: Containers NEVER import mock data or mock stores. Stories keep mock data via `MockedProvider`.
6. **No `console.*`** — use `logger` from `@/frontend/utils/logger`.
7. **Loading/Error states**: Show `<CircularProgress />` while loading, styled error `Typography` on error.

---

#### Target Files

| # | File | Status |
|---|------|--------|
| 1 | `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx` | REFACTOR |
| 2 | `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx` | REFACTOR |
| 3 | `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx` | REFACTOR |
| 4 | `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx` | REFACTOR |
| 5 | `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts` | MODIFY — update imports |
| 6 | `frontend/views/dashboard/suggestions/types/suggestionsViewTypes.ts` | MODIFY — update imports |
| 7 | `frontend/views/dashboard/complaints/utils/complaintFilters.ts` | MODIFY — update imports |
| 8 | `frontend/views/dashboard/suggestions/utils/suggestionFilters.ts` | MODIFY — update imports |
| 9 | `frontend/stores/mockParentComplaintsStore.ts` | DELETE |
| 10 | `frontend/stores/mockAdminComplaintsStore.ts` | DELETE |
| 11 | `frontend/stores/mockParentSuggestionsStore.ts` | DELETE |
| 12 | `frontend/stores/mockAdminSuggestionsStore.ts` | DELETE |

---

### Detailed Implementation Steps

---

#### Step 1 — Update `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts`

Replace mock store imports with real store imports. The type shapes remain identical.

```typescript
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
} from "@/frontend/stores/adminComplaintsStore";
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/stores/parentComplaintsStore";
import type { ComplaintsLabels } from "@/shared/messages/types/dashboard/complaints/main";
import type { ComplaintFormData } from "../schemas/complaintFormSchema";

export type { ComplaintsLabels };

export interface ParentComplaintsViewProps {
  readonly labels: ComplaintsLabels["parent"];
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly hasOlderRecords: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: ComplaintFormData) => void;
  readonly onDismissSuccess: () => void;
  readonly onLoadOlderRecords: () => void;
}

export interface AdminComplaintsViewProps {
  readonly labels: ComplaintsLabels["admin"];
  readonly summary: AdminComplaintsSummary;
  readonly rows: readonly AdminComplaintRow[];
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: ComplaintTab) => void;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
}
```

---

#### Step 2 — Update `frontend/views/dashboard/complaints/utils/complaintFilters.ts`

Replace mock store import with real store import.

```typescript
import type { AdminComplaintRow, ComplaintTab } from "@/frontend/stores/adminComplaintsStore";

export function filterComplaintsByTab(
  rows: readonly AdminComplaintRow[],
  activeTab: ComplaintTab,
  searchQuery: string
): AdminComplaintRow[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return rows.filter(row => {
    if (row.status !== activeTab) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    return (
      row.submitterName.toLowerCase().includes(normalizedQuery) ||
      row.submitterRole.toLowerCase().includes(normalizedQuery) ||
      row.complaintText.toLowerCase().includes(normalizedQuery)
    );
  });
}
```

---

#### Step 3 — Refactor `ParentComplaintsContainer.tsx`

Replace the entire file with the following complete implementation:

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  parentComplaintsQueryDocument,
  submitComplaintMutationDocument,
} from "@/frontend/graphql/sharedDocuments/complaint.documents";
import { useParentComplaintsStore } from "@/frontend/stores/parentComplaintsStore";
import { ParentComplaintsView } from "./ParentComplaintsView";
import { buildComplaintsLabels } from "./utils/buildComplaintsLabels";
import type { ComplaintFormData } from "./schemas/complaintFormSchema";
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/stores/parentComplaintsStore";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function ParentComplaintsContainer() {
  const t = useTranslations("dashboard.complaints");
  const labels = buildComplaintsLabels(t);

  const isSubmitting = useParentComplaintsStore(state => state.isSubmitting);
  const showSuccess = useParentComplaintsStore(state => state.showSuccess);
  const setSubmitting = useParentComplaintsStore(state => state.setSubmitting);
  const resetSuccess = useParentComplaintsStore(state => state.resetSuccess);

  const { data, loading, error, refetch } = useQuery(parentComplaintsQueryDocument);

  const [submitComplaint] = useMutation(submitComplaintMutationDocument, {
    onCompleted: () => {
      setSubmitting(false);
      useParentComplaintsStore.setState({ showSuccess: true });
      void refetch();
    },
    onError: () => {
      setSubmitting(false);
    },
  });

  const studentOptions: readonly ParentStudentOption[] = useMemo(() => {
    if (!data?.parentComplaints) return [];
    return (data.parentComplaints.studentOptions ?? []).map(option => ({
      id: option.id ?? "",
      label: option.label ?? "",
    }));
  }, [data?.parentComplaints]);

  const records: readonly ParentComplaintRecord[] = useMemo(() => {
    if (!data?.parentComplaints) return [];
    return (data.parentComplaints.records ?? []).map(record => ({
      id: record.id ?? "",
      regarding: record.category ?? "",
      summary: record.body ?? "",
      status: (record.status?.toLowerCase() === "answered" ? "resolved" : "pending") as "pending" | "resolved",
      adminResponse:
        record.responses && record.responses.length > 0
          ? {
              text: record.responses[0].body ?? "",
              answeredAt: record.responses[0].createdAt ?? "",
            }
          : undefined,
    }));
  }, [data?.parentComplaints]);

  const hasOlderRecords = useMemo(() => {
    return data?.parentComplaints?.hasOlderRecords ?? false;
  }, [data?.parentComplaints?.hasOlderRecords]);

  const handleSubmit = (formData: ComplaintFormData) => {
    setSubmitting(true);
    resetSuccess();
    void submitComplaint({
      variables: {
        input: {
          studentId: formData.studentId,
          contactEmail: formData.contactEmail,
          body: formData.complaintDetails,
        },
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <StyledErrorTypography>{error.message}</StyledErrorTypography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.SupportSubmitComplaint]}>
      <ParentComplaintsView
        labels={labels.parent}
        studentOptions={studentOptions}
        records={records}
        hasOlderRecords={hasOlderRecords}
        isSubmitting={isSubmitting}
        showSuccess={showSuccess}
        canSubmit={true}
        onSubmit={handleSubmit}
        onDismissSuccess={resetSuccess}
        onLoadOlderRecords={() => void refetch()}
      />
    </RequirePermission>
  );
}
```

---

#### Step 4 — Refactor `AdminComplaintsContainer.tsx`

Replace the entire file with the following complete implementation:

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  adminComplaintQueueQueryDocument,
  respondToComplaintMutationDocument,
} from "@/frontend/graphql/sharedDocuments/complaint.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { useAdminComplaintsStore } from "@/frontend/stores/adminComplaintsStore";
import type { AdminComplaintRow, AdminComplaintsSummary } from "@/frontend/stores/adminComplaintsStore";
import { AdminComplaintsView } from "./AdminComplaintsView";
import { buildComplaintsLabels } from "./utils/buildComplaintsLabels";
import { filterComplaintsByTab } from "./utils/complaintFilters";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function AdminComplaintsContainer() {
  const t = useTranslations("dashboard.complaints");
  const labels = buildComplaintsLabels(t);
  const hasPermission = useUserStore(state => state.hasPermission);

  const searchQuery = useAdminComplaintsStore(state => state.searchQuery);
  const activeTab = useAdminComplaintsStore(state => state.activeTab);
  const draftResponses = useAdminComplaintsStore(state => state.draftResponses);
  const setSearchQuery = useAdminComplaintsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminComplaintsStore(state => state.setActiveTab);
  const setDraftResponse = useAdminComplaintsStore(state => state.setDraftResponse);

  const { data, loading, error, refetch } = useQuery(adminComplaintQueueQueryDocument, {
    variables: {
      filter: {
        search: searchQuery || undefined,
        status: activeTab.toUpperCase(),
      },
    },
  });

  const [respondToComplaint] = useMutation(respondToComplaintMutationDocument, {
    onCompleted: () => {
      void refetch();
    },
  });

  const summary: AdminComplaintsSummary = useMemo(() => {
    const metrics = data?.adminComplaintQueue?.metrics;
    return {
      unanswered: metrics?.unanswered ?? 0,
      answered: metrics?.answered ?? 0,
      avgResolutionHours: metrics?.avgResolutionTime ?? "0.0 Hours",
    };
  }, [data?.adminComplaintQueue?.metrics]);

  const rows: readonly AdminComplaintRow[] = useMemo(() => {
    if (!data?.adminComplaintQueue?.rows) return [];
    return data.adminComplaintQueue.rows.map(row => ({
      id: row.id ?? "",
      submitterName: row.parentName ?? row.submitterEmail ?? "",
      submitterRole: row.studentName ? `Guardian • ${row.studentName}` : "Guardian",
      avatarUrl: "",
      priority: (row.category?.toLowerCase().includes("urgent") ? "urgent" : "general") as "urgent" | "general",
      receivedAt: row.createdAt ?? "",
      complaintText: row.body ?? "",
      status: (row.status?.toLowerCase() === "answered" ? "answered" : "unanswered") as "answered" | "unanswered",
      adminResponse: undefined,
      answeredAt: undefined,
    }));
  }, [data?.adminComplaintQueue?.rows]);

  const canManage = hasPermission(AppPermission.ComplaintsRespond);

  const filteredRows = useMemo(
    () => filterComplaintsByTab(rows, activeTab, searchQuery),
    [activeTab, rows, searchQuery]
  );

  const handleAnswer = (id: string, options: { readonly sendEmail: boolean }) => {
    const draft = draftResponses[id] ?? "";
    void respondToComplaint({
      variables: {
        input: {
          complaintId: id,
          body: draft,
          sendEmail: options.sendEmail,
        },
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <StyledErrorTypography>{error.message}</StyledErrorTypography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.ComplaintsRespond, AppPermission.ComplaintsList]}>
      <AdminComplaintsView
        labels={labels.admin}
        summary={summary}
        rows={filteredRows}
        searchQuery={searchQuery}
        activeTab={activeTab}
        draftResponses={draftResponses}
        canManage={canManage}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
        onDraftChange={setDraftResponse}
        onAnswer={handleAnswer}
      />
    </RequirePermission>
  );
}
```

---

#### Step 5 — Update `frontend/views/dashboard/suggestions/types/suggestionsViewTypes.ts`

Replace mock store import with real store import.

```typescript
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionTab,
} from "@/frontend/stores/adminSuggestionsStore";
import type { SuggestionsLabels } from "@/shared/messages/types/dashboard/suggestions/main";
import type { SuggestionFormData } from "../schemas/suggestionFormSchema";

export type { SuggestionsLabels };

export interface ParentSuggestionsViewProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: SuggestionFormData) => void;
  readonly onDismissSuccess: () => void;
}

export interface AdminSuggestionsViewProps {
  readonly labels: SuggestionsLabels["admin"];
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly searchQuery: string;
  readonly activeTab: SuggestionTab;
  readonly canManage: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: SuggestionTab) => void;
  readonly onMarkReviewed: (id: string) => void;
}
```

---

#### Step 6 — Update `frontend/views/dashboard/suggestions/utils/suggestionFilters.ts`

Replace mock store import with real store import.

```typescript
import type { AdminSuggestionRow, SuggestionTab } from "@/frontend/stores/adminSuggestionsStore";

export function filterSuggestionsByTab(
  rows: readonly AdminSuggestionRow[],
  activeTab: SuggestionTab,
  searchQuery: string
): AdminSuggestionRow[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return rows.filter(row => {
    if (row.status !== activeTab) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    return (
      row.parentName.toLowerCase().includes(normalizedQuery) ||
      row.suggestionPreview.toLowerCase().includes(normalizedQuery)
    );
  });
}
```

---

#### Step 7 — Refactor `ParentSuggestionsContainer.tsx`

Replace the entire file with the following complete implementation:

```typescript
"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { submitSuggestionMutationDocument } from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import { useParentSuggestionsStore } from "@/frontend/stores/parentSuggestionsStore";
import { ParentSuggestionsView } from "./ParentSuggestionsView";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";
import type { SuggestionFormData } from "./schemas/suggestionFormSchema";

export function ParentSuggestionsContainer() {
  const t = useTranslations("dashboard.suggestions");
  const labels = buildSuggestionsLabels(t);

  const isSubmitting = useParentSuggestionsStore(state => state.isSubmitting);
  const showSuccess = useParentSuggestionsStore(state => state.showSuccess);
  const setSubmitting = useParentSuggestionsStore(state => state.setSubmitting);
  const resetSuccess = useParentSuggestionsStore(state => state.resetSuccess);

  const [submitSuggestion] = useMutation(submitSuggestionMutationDocument, {
    onCompleted: () => {
      setSubmitting(false);
      useParentSuggestionsStore.setState({ showSuccess: true });
    },
    onError: () => {
      setSubmitting(false);
    },
  });

  const handleSubmit = (formData: SuggestionFormData) => {
    setSubmitting(true);
    resetSuccess();
    void submitSuggestion({
      variables: {
        input: {
          fullName: formData.fullName,
          body: formData.suggestion,
        },
      },
    });
  };

  return (
    <RequirePermission permissions={[AppPermission.CommunicationSubmitSuggestion]}>
      <ParentSuggestionsView
        labels={labels.parent}
        isSubmitting={isSubmitting}
        showSuccess={showSuccess}
        canSubmit={true}
        onSubmit={handleSubmit}
        onDismissSuccess={resetSuccess}
      />
    </RequirePermission>
  );
}
```

---

#### Step 8 — Refactor `AdminSuggestionsContainer.tsx`

Replace the entire file with the following complete implementation:

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  adminSuggestionsQueryDocument,
  markSuggestionReviewedMutationDocument,
} from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import { useAdminSuggestionsStore } from "@/frontend/stores/adminSuggestionsStore";
import type { AdminSuggestionRow, AdminSuggestionsSummary } from "@/frontend/stores/adminSuggestionsStore";
import { AdminSuggestionsView } from "./AdminSuggestionsView";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";
import { filterSuggestionsByTab } from "./utils/suggestionFilters";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function AdminSuggestionsContainer() {
  const t = useTranslations("dashboard.suggestions");
  const labels = buildSuggestionsLabels(t);

  const searchQuery = useAdminSuggestionsStore(state => state.searchQuery);
  const activeTab = useAdminSuggestionsStore(state => state.activeTab);
  const setSearchQuery = useAdminSuggestionsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminSuggestionsStore(state => state.setActiveTab);

  const { data, loading, error, refetch } = useQuery(adminSuggestionsQueryDocument, {
    variables: {
      filter: {
        search: searchQuery || undefined,
        status: activeTab.toUpperCase(),
      },
    },
  });

  const [markReviewed] = useMutation(markSuggestionReviewedMutationDocument, {
    onCompleted: () => {
      void refetch();
    },
  });

  const summary: AdminSuggestionsSummary = useMemo(() => {
    const metrics = data?.adminSuggestions?.metrics;
    return {
      pending: metrics?.pending ?? 0,
      reviewed: metrics?.reviewed ?? 0,
      avgResponseHours: metrics?.avgResponseTime ?? "0.0 Hours",
    };
  }, [data?.adminSuggestions?.metrics]);

  const rows: readonly AdminSuggestionRow[] = useMemo(() => {
    if (!data?.adminSuggestions?.rows) return [];
    return data.adminSuggestions.rows.map(row => ({
      id: row.id ?? "",
      parentName: row.parentName ?? "",
      suggestionPreview: row.body ?? "",
      status: (row.emailSentAt ? "reviewed" : "pending") as "pending" | "reviewed",
      submittedAt: row.createdAt ?? "",
    }));
  }, [data?.adminSuggestions?.rows]);

  const filteredRows = useMemo(
    () => filterSuggestionsByTab(rows, activeTab, searchQuery),
    [activeTab, rows, searchQuery]
  );

  const handleMarkReviewed = (id: string) => {
    void markReviewed({
      variables: { suggestionId: id },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <StyledErrorTypography>{error.message}</StyledErrorTypography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.ComplaintsList]}>
      <AdminSuggestionsView
        labels={labels.admin}
        summary={summary}
        rows={filteredRows}
        searchQuery={searchQuery}
        activeTab={activeTab}
        canManage={true}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
        onMarkReviewed={handleMarkReviewed}
      />
    </RequirePermission>
  );
}
```

---

#### Step 9 — Verify no remaining mock store imports

Before deleting the mock store files, verify that no production code still imports from them. Stories already use `MockedProvider` (from Task I) and do not import mock stores.

Run the following searches and confirm zero results:

```bash
rg "mockParentComplaintsStore" --type ts --type tsx
rg "mockAdminComplaintsStore" --type ts --type tsx
rg "mockParentSuggestionsStore" --type ts --type tsx
rg "mockAdminSuggestionsStore" --type ts --type tsx
```

If any results appear in non-story files, update those imports to point to the corresponding real store before proceeding.

**Expected result**: Zero matches in production files. Story files (`*.stories.tsx`) should also have zero matches since Task I already migrated them to `MockedProvider`.

---

#### Step 10 — Delete mock store files

After confirming no remaining imports, delete all 4 mock store files:

```bash
rm frontend/stores/mockParentComplaintsStore.ts
rm frontend/stores/mockAdminComplaintsStore.ts
rm frontend/stores/mockParentSuggestionsStore.ts
rm frontend/stores/mockAdminSuggestionsStore.ts
```

---

#### Step 11 — Verify TypeScript compilation

Run TypeScript type-checking to confirm all imports resolve and types align:

```bash
~/.bun/bin/bun tsgo
```

This must pass with zero errors. If errors occur, verify that:
1. Real stores export the same type names (`AdminComplaintRow`, `AdminComplaintsSummary`, `ComplaintTab`, `ParentComplaintRecord`, `ParentStudentOption`, `AdminSuggestionRow`, `AdminSuggestionsSummary`, `SuggestionTab`).
2. GraphQL document imports resolve from `@/frontend/graphql/sharedDocuments/complaint.documents` and `@/frontend/graphql/sharedDocuments/suggestion.documents`.
3. `AppPermission.SupportSubmitComplaint` and `AppPermission.CommunicationSubmitSuggestion` exist in the generated enum (requires Task A codegen to have been run).

---

### File Modification Order

Execute the steps in this exact order to satisfy incremental type-checking:

1. `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts` — update imports
2. `frontend/views/dashboard/complaints/utils/complaintFilters.ts` — update imports
3. `frontend/views/dashboard/suggestions/types/suggestionsViewTypes.ts` — update imports
4. `frontend/views/dashboard/suggestions/utils/suggestionFilters.ts` — update imports
5. `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx` — full refactor
6. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx` — full refactor
7. `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx` — full refactor
8. `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx` — full refactor
9. Verify no remaining mock store imports (search)
10. Delete 4 mock store files
11. Run `bun tsgo` to verify

After modifying each file (steps 1–8), run the Quality Gate — Per-File Validation checklist before proceeding.

---

### Test Execution Requirements

Run the UI component tests to verify all containers render correctly with `MockedProvider`-backed stories:

```bash
bun run test:ui:components
```

Run the GraphQL integration tests to verify document imports and query shapes are correct:

```bash
bun run test:graphql
```

Verify Storybook builds without errors:

```bash
bun run build-storybook
```

---

### Success Criteria

- [ ] `ParentComplaintsContainer` uses `useQuery(parentComplaintsQueryDocument)` for data and `useMutation(submitComplaintMutationDocument)` for submission.
- [ ] `AdminComplaintsContainer` uses `useQuery(adminComplaintQueueQueryDocument)` with filter variables and `useMutation(respondToComplaintMutationDocument)` for responses.
- [ ] `ParentSuggestionsContainer` uses `useMutation(submitSuggestionMutationDocument)` for submission.
- [ ] `AdminSuggestionsContainer` uses `useQuery(adminSuggestionsQueryDocument)` with filter variables and `useMutation(markSuggestionReviewedMutationDocument)` for review actions.
- [ ] All 4 containers use `<RequirePermission>` for declarative access control.
- [ ] `ParentComplaintsContainer` permission: `AppPermission.SupportSubmitComplaint` (was `ComplaintsList`).
- [ ] `AdminComplaintsContainer` permissions: `[AppPermission.ComplaintsRespond, AppPermission.ComplaintsList]` (unchanged).
- [ ] `ParentSuggestionsContainer` permission: `AppPermission.CommunicationSubmitSuggestion` (was `ComplaintsList`).
- [ ] `AdminSuggestionsContainer` permission: `AppPermission.ComplaintsList` (was `ComplaintsRespond`).
- [ ] All 4 containers import UI state from real Zustand stores (not mock stores).
- [ ] `complaintsViewTypes.ts` imports types from `adminComplaintsStore` and `parentComplaintsStore` (not mock).
- [ ] `suggestionsViewTypes.ts` imports types from `adminSuggestionsStore` (not mock).
- [ ] `complaintFilters.ts` imports types from `adminComplaintsStore` (not mock).
- [ ] `suggestionFilters.ts` imports types from `adminSuggestionsStore` (not mock).
- [ ] All 4 mock store files deleted: `mockParentComplaintsStore.ts`, `mockAdminComplaintsStore.ts`, `mockParentSuggestionsStore.ts`, `mockAdminSuggestionsStore.ts`.
- [ ] Zero imports from any `mock*ComplaintsStore` or `mock*SuggestionsStore` path remain in the codebase.
- [ ] `bun run test:ui:components` passes with zero failures.
- [ ] `bun run test:graphql` passes with zero failures.
- [ ] `bun run build-storybook` completes without errors.
- [ ] No TypeScript errors in any modified file.

---

### Quality Gate — Pre-Submission Checklist

- [ ] All imports resolve correctly (no missing modules).
- [ ] No `console.*` calls — use `logger` from `@/frontend/utils/logger` if logging is needed.
- [ ] No hardcoded colors — all styling comes from theme palette via `sx` callbacks or `styled`.
- [ ] No `any` types used anywhere in the refactored containers.
- [ ] `useQuery` and `useMutation` imported from `@apollo/client/react` (not `@apollo/client`).
- [ ] All GraphQL documents imported from correct shared document files (`complaint.documents`, `suggestion.documents`).
- [ ] `<RequirePermission>` wraps the view in every container (not manual `if (!canView) return null`).
- [ ] Loading states render `<CircularProgress />` centered in a `<Box>`.
- [ ] Error states render `<StyledErrorTypography>` with `error.message`.
- [ ] Mutation `onCompleted` callbacks trigger `refetch()` for query-based containers.
- [ ] Mutation `onError` callbacks reset `isSubmitting` state for form-based containers.
- [ ] Real Zustand stores used exclusively for UI state (search, tab, drafts, submitting, success).
- [ ] View types files updated to import from real stores, not mock stores.
- [ ] Filter utility files updated to import from real stores, not mock stores.
- [ ] Permission enum values use `AppPermission.SupportSubmitComplaint` and `AppPermission.CommunicationSubmitSuggestion` (new values from Task A).
- [ ] `tags: ["autodocs"]` and `parameters: { layout: "fullscreen" }` remain intact in story files (not modified by this task).

### Quality Gate — Post-Submission Checklist

- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings.
- [ ] `bun biome:check` passes with 0 errors & 0 warnings.
- [ ] `bun lint` passes with 0 errors & 0 warnings.
- [ ] `bun codescene` passes with 0 errors & 0 warnings.
- [ ] `bun run test:ui:components` passes.
- [ ] `bun run test:graphql` passes.
- [ ] `bun run build-storybook` passes.
- [ ] `bun quality-gate` passes (tsgo, biome, lint, CodeScene, SonarQube).
- [ ] No new SonarQube issues introduced.
- [ ] No new duplication blocks introduced.
- [ ] Storybook renders all variants (Default, Empty, Loading) without runtime errors after container refactoring.
- [ ] Permission-gated content is visible in all story variants.
- [ ] No regressions in other containers or stories that share the same domain utilities.
