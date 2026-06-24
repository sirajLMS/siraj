# Task J — Storybook Migration

## Sprint 15 · Frontend Storybook Layer · Section 6

---

## Objective

Update suggestion and complaint stories to render View components (NOT Containers) with mock data and mock action handlers passed as props. Add stories for new action components, duplicate dialog, admin response panel, and file upload. Stories are pure UI showcases — no Apollo, no GraphQL, no stores.

---

## Dependencies

| Task | Description |
|------|-------------|
| I | Type Extraction (types available in canonical type files) |

---

## Layer-Specific Rules

- **🚫 NO Apollo imports** — Stories MUST NEVER import `MockedProvider`, `MockedResponse`, or any Apollo testing utilities.
- **🚫 NO Container imports** — Stories MUST NEVER import or render Container components. Containers use Apollo hooks and stores, which violates story isolation.
- **🚫 NO GraphQL document imports** — Stories MUST NEVER import query/mutation documents from `sharedDocuments/`.
- **View components only** — Stories render View components (DesktopView, MobileView, or base View) that receive data and actions as props.
- **Mock data as props** — Stories provide mock data directly as component props using generated GraphQL types and view-level `.types.ts` types.
- **Mock actions as props** — Stories provide mock action handlers (e.g., `onRespond`, `onMarkDuplicate`, `onDelete`) as props. These are simple `() => void` or `(id: string) => void` functions.
- **Generated types only** — Mock data shapes MUST use generated GraphQL types and enums from `graphql-types.ts` or view-level `.types.ts` files. NEVER define local enum duplicates or inline type definitions.
- **Permission mocking** — If views check permissions via `useUserStore`, stories seed the store via `useUserStore.setState()` in decorators.
- **Multiple variants** — Provide Default, Empty, Loading variants where applicable.

---

## Target Files

| File | Action |
|------|--------|
| `frontend/views/dashboard/suggestions/AdminSuggestionsDesktopView.stories.tsx` | Create with mock props for new actions |
| `frontend/views/dashboard/suggestions/ParentSuggestionsDesktopView.stories.tsx` | Create with suggestion history mock props |
| `frontend/views/dashboard/complaints/ParentComplaintsDesktopView.stories.tsx` | Create with file upload mock props |
| `frontend/views/dashboard/complaints/AdminComplaintsDesktopView.stories.tsx` | Create with file display mock props |
| `frontend/views/dashboard/suggestions/components/SuggestionDetailDialog.stories.tsx` | Create for detail dialog component |
| `frontend/views/dashboard/suggestions/components/DuplicateSearchDialog.stories.tsx` | Create for duplicate search component |
| `frontend/views/dashboard/complaints/components/ComplaintFileUpload.stories.tsx` | Create for file upload component |
| `frontend/views/dashboard/complaints/components/ComplaintFileList.stories.tsx` | Create for file list component |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/views/AGENTS.md` for Storybook best practices
- [ ] Verify generated types exist in `frontend/graphql/generated/gql/graphql-types.ts`
- [ ] Verify canonical types exist in `suggestionsViewTypes.ts` and `complaintsViewTypes.ts` (Task I)
- [ ] Confirm `StoryWrapper` provides permission seeding for admin components
- [ ] Confirm `NextIntlClientProvider` is provided by global Storybook decorators
- [ ] **Confirm NO Apollo imports will be used** — stories render View components with mock props only
- [ ] **Confirm NO Container imports will be used** — stories render View components only
- [ ] **Confirm NO GraphQL document imports will be used** — stories do not interact with GraphQL

---

## Implementation Details

### 1. Admin Suggestions Stories

Create `frontend/views/dashboard/suggestions/AdminSuggestionsDesktopView.stories.tsx`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { AdminSuggestionRow, AdminSuggestionsSummary, SuggestionTab, SuggestionSearchResult } from "@/frontend/views/dashboard/suggestions/types/suggestionsViewTypes";
import { AdminSuggestionsDesktopView } from "./AdminSuggestionsDesktopView";

const MOCK_ADMIN_SUGGESTIONS: readonly AdminSuggestionRow[] = [
  {
    id: "sug-1001",
    parentName: "Ahmed Khan",
    suggestionPreview: "Could we add a mobile notification when class schedules change?",
    status: "PENDING",
    submittedAt: "2023-10-24T10:00:00Z",
    duplicateOfId: null,
    adminResponse: null,
    reviewedByName: null,
    reviewedAt: null,
  },
  {
    id: "sug-1002",
    parentName: "Sara Alii",
    suggestionPreview: "It would help to see attendance summaries in the parent dashboard.",
    status: "PENDING",
    submittedAt: "2023-10-23T14:30:00Z",
    duplicateOfId: null,
    adminResponse: null,
    reviewedByName: null,
    reviewedAt: null,
  },
  {
    id: "sug-1003",
    parentName: "John Smith",
    suggestionPreview: "Please offer quarterly billing options for multi-student families.",
    status: "REVIEWED",
    submittedAt: "2023-10-20T09:00:00Z",
    duplicateOfId: null,
    adminResponse: "We will consider this for the next billing cycle review.",
    reviewedByName: "Admin User",
    reviewedAt: "2023-10-21T11:00:00Z",
  },
  {
    id: "sug-1004",
    parentName: "Fatima Zayed",
    suggestionPreview: "Add Arabic subtitles to recorded class sessions for review.",
    status: "DUPLICATE",
    submittedAt: "2023-10-18T16:00:00Z",
    duplicateOfId: "sug-1003",
    adminResponse: null,
    reviewedByName: "Admin User",
    reviewedAt: "2023-10-19T08:00:00Z",
  },
];

const MOCK_SUMMARY: AdminSuggestionsSummary = {
  pending: 24,
  reviewed: 148,
  avgResponseHours: "4.2 Hours",
};

const ADMIN_PERMISSIONS = [
  AppPermission.SuggestionsList,
  AppPermission.SuggestionsReview,
  AppPermission.SuggestionsDelete,
];

const mockActions = {
  onSearchChange: (query: string) => { console.log("Search:", query); },
  onTabChange: (tab: SuggestionTab) => { console.log("Tab:", tab); },
  onRespond: (id: string, adminResponse: string) => { console.log("Respond:", id, adminResponse); },
  onMarkDuplicate: (id: string, duplicateOfId: string) => { console.log("Mark duplicate:", id, duplicateOfId); },
  onDelete: (id: string) => { console.log("Delete:", id); },
  onSearchSuggestions: (query: string, excludeId: string) => { console.log("Search suggestions:", query, excludeId); },
};

const meta: Meta<typeof AdminSuggestionsDesktopView> = {
  title: "Views/dashboard/suggestions/AdminSuggestionsDesktopView",
  component: AdminSuggestionsDesktopView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof AdminSuggestionsDesktopView>;

export const Default: Story = {
  args: {
    labels: {} as any,
    summary: MOCK_SUMMARY,
    rows: MOCK_ADMIN_SUGGESTIONS,
    searchQuery: "",
    activeTab: "pending",
    searchResults: [],
    searchLoading: false,
    respondLoading: false,
    duplicateLoading: false,
    deleteLoading: false,
    markingReviewedId: "",
    isMarkingReviewed: false,
    ...mockActions,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    rows: [],
    summary: { pending: 0, reviewed: 0, avgResponseHours: "0.0 Hours" },
  },
};
```

**Key points:**
- Story renders `AdminSuggestionsDesktopView` (NOT `AdminSuggestionsContainer`)
- NO Apollo imports (`MockedProvider`, `MockedResponse`, etc.)
- NO GraphQL document imports (`adminSuggestionsQueryDocument`, `respondToSuggestionMutationDocument`, etc.)
- Mock data passed as props using generated types from `suggestionsViewTypes.ts`
- Mock action handlers passed as simple functions
- Permission gates mocked via `useUserStore.setState()`
- Multiple variants: Default, Empty

---

### 2. Parent Suggestions Stories

Create `frontend/views/dashboard/suggestions/ParentSuggestionsDesktopView.stories.tsx` following the same pattern with parent suggestion history mock data.

---

### 3. Parent Complaints Stories

Create `frontend/views/dashboard/complaints/ParentComplaintsDesktopView.stories.tsx` following the same pattern with complaint records and file upload mock data.

---

### 4. Admin Complaints Stories

Create `frontend/views/dashboard/complaints/AdminComplaintsDesktopView.stories.tsx` following the same pattern with admin complaints and file display mock data.

---

### 5. Component Stories

Create individual story files for new components:
- `SuggestionDetailDialog.stories.tsx`
- `DuplicateSearchDialog.stories.tsx`
- `ComplaintFileUpload.stories.tsx`
- `ComplaintFileList.stories.tsx`

Each story renders the component directly with mock props, following the same pattern as above.

---

## Storybook Mock Data Rules

1. **View components only** — Stories render View components (DesktopView, MobileView, or base View), NOT Containers.
2. **Mock data as props** — Stories provide mock data directly as component props using generated GraphQL types.
3. **Mock actions as props** — Stories provide mock action handlers as simple functions (e.g., `(id: string) => void`).
4. **Generated types only** — Mock data shapes MUST use generated GraphQL types and enums from `graphql-types.ts` or view-level `.types.ts` files.
5. **Permission gates mocked via global decorators** — The `StoryWrapper` provides admin permissions by default. No per-story permission setup needed.
6. **Multiple story variants** — Each story file includes Default plus variants for edge cases (empty, loading, error states).
7. **NO Apollo imports** — Stories MUST NEVER import `MockedProvider`, `MockedResponse`, or any Apollo testing utilities.
8. **NO Container imports** — Stories MUST NEVER import or render Container components.
9. **NO GraphQL document imports** — Stories MUST NEVER import query/mutation documents.
---

## Success Criteria / Check Progress Points

- [ ] `AdminSuggestionsDesktopView.stories.tsx` renders View component with mock props
- [ ] Admin suggestions mocks include: 4 suggestions (pending, reviewed, duplicate), mock action handlers for respond, duplicate, delete, search
- [ ] `ParentSuggestionsDesktopView.stories.tsx` renders View component with suggestion history mock props
- [ ] Parent suggestions mocks include: 4 suggestions (pending, reviewed, duplicate with parent link), mock submit handler
- [ ] Parent suggestions includes `EmptyHistory` story variant with empty array mock
- [ ] `ParentComplaintsDesktopView.stories.tsx` renders View component with complaints and file upload mock props
- [ ] Parent complaints mocks include: 3 complaint records with file attachments, mock file upload handlers
- [ ] Parent complaints includes `EmptyRecords` story variant
- [ ] `AdminComplaintsDesktopView.stories.tsx` renders View component with admin complaints and file display mock props
- [ ] Admin complaints mocks include: 4 complaints (2 unanswered, 2 answered with files), mock answer handler with email toggle
- [ ] Admin complaints includes `EmptyUnanswered` story variant
- [ ] `SuggestionDetailDialog.stories.tsx` renders dialog component with mock suggestion data
- [ ] `DuplicateSearchDialog.stories.tsx` renders dialog component with mock search results
- [ ] `ComplaintFileUpload.stories.tsx` renders file upload component with mock handlers
- [ ] `ComplaintFileList.stories.tsx` renders file list component with mock file data
- [ ] NO Apollo imports in any story file (`MockedProvider`, `MockedResponse`, etc.)
- [ ] NO Container imports in any story file
- [ ] NO GraphQL document imports in any story file
- [ ] All mock data field names match generated GraphQL type shapes exactly
- [ ] No Zustand mock store imports in story files
- [ ] All stories compile with `bun tsgo` (zero errors)
- [ ] No local entity type definitions — all types sourced from generated GraphQL types or extracted `types.ts` files

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

- The `MockedProvider` `addTypename` option is set to `false` because mock data already includes explicit `__typename` fields. This prevents Apollo from adding duplicate typename fields.
- Story variants like `EmptyHistory` and `EmptyUnanswered` override the default decorator with their own `MockedProvider` to provide different mock data.
- The `MOCK_SEARCH_RESPONSE` in admin suggestions uses specific variables (`query: "mobile notification"`, `excludeId: "sug-1002"`) that must match what the component sends when the duplicate dialog search is triggered.
- File attachment mocks include realistic file sizes and MIME types to test the file display UI properly.
- The `submitComplaintMutationDocument` variables must match what the form sends. If the form schema changes, update the mock variables accordingly.
