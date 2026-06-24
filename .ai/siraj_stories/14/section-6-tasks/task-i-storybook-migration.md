### Task I — Storybook Migration to View Components with Mock Props

**Objective:**
Update all 4 complaint and suggestion story files to render View components (NOT Containers) with mock data and mock action handlers passed as props. Stories are pure UI showcases — no Apollo, no GraphQL, no stores.

**Dependencies:**
Task G (types extracted to `.types` files, mock stores updated to re-import from `.types`).

**Layer-Specific Rules:**
Read `frontend/views/AGENTS.md` before starting.

1. **🚫 NO Apollo imports** — Stories MUST NEVER import `MockedProvider`, `MockedResponse`, or any Apollo testing utilities.
2. **🚫 NO Container imports** — Stories MUST NEVER import or render Container components. Containers use Apollo hooks and stores, which violates story isolation.
3. **🚫 NO GraphQL document imports** — Stories MUST NEVER import query/mutation documents from `sharedDocuments/`.
4. **View components only** — Stories render View components (DesktopView, MobileView, or base View) that receive data and actions as props.
5. **Mock data as props** — Stories provide mock data directly as component props using generated GraphQL types and view-level `.types.ts` types.
6. **Mock actions as props** — Stories provide mock action handlers (e.g., `onRespond`, `onMarkDuplicate`, `onDelete`) as props. These are simple `() => void` or `(id: string) => void` functions.
7. **Generated types only** — Mock data shapes MUST use generated GraphQL types and enums from `graphql-types.ts` or view-level `.types.ts` files. NEVER define local enum duplicates or inline type definitions.
8. **Permission mocking** — If views check permissions via `useUserStore`, stories seed the store via `useUserStore.setState()` in decorators.
9. **Multiple variants** — Provide Default, Empty, Loading variants where applicable.

**Target Files:**
- `frontend/views/dashboard/complaints/ParentComplaintsDesktopView.stories.tsx` — Create
- `frontend/views/dashboard/complaints/AdminComplaintsDesktopView.stories.tsx` — Create
- `frontend/views/dashboard/suggestions/ParentSuggestionsDesktopView.stories.tsx` — Create
- `frontend/views/dashboard/suggestions/AdminSuggestionsDesktopView.stories.tsx` — Create

---

### Detailed Implementation Steps

#### Step 1 — Create `ParentComplaintsDesktopView.stories.tsx`

Create a new story file that renders the View component with mock props:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";
import { ParentComplaintsDesktopView } from "./ParentComplaintsDesktopView";

const MOCK_PARENT_COMPLAINTS: readonly ParentComplaintRecord[] = [
  {
    id: "rec-1001",
    regarding: "Tuition Fee Processing",
    summary: "The online payment portal is not reflecting the scholarship discount for Semester 2.",
    status: "resolved",
    createdAt: "2025-10-20T09:00:00Z",
    adminResponse: {
      text: "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
      answeredAt: "Oct 24, 2023 • 10:15 AM",
    },
  },
  {
    id: "rec-1002",
    regarding: "Transportation Service",
    summary: "Bus #42 was delayed by 30 minutes this morning without notification.",
    status: "pending",
    createdAt: "2025-10-22T07:30:00Z",
    adminResponse: null,
  },
  {
    id: "rec-1003",
    regarding: "Grade Discrepancy",
    summary: "Mathematics mid-term score shows 78, but the physical script has 87.",
    status: "resolved",
    createdAt: "2025-09-10T14:00:00Z",
    adminResponse: {
      text: "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
      answeredAt: "Sep 12, 2023 • 02:45 PM",
    },
  },
];

const MOCK_STUDENT_OPTIONS: readonly ParentStudentOption[] = [
  { id: "stu-zaid", label: "Zaid Ahmad (Grade 4-B)" },
  { id: "stu-ayesha", label: "Ayesha Ahmad (Grade 1-A)" },
];

const PARENT_PERMISSIONS = [
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsRespond,
];

const mockActions = {
  onSubmitComplaint: (data: any) => { console.log("Submit complaint:", data); },
  onLoadOlderRecords: () => { console.log("Load older records"); },
  onFilesSelected: (files: readonly File[]) => { console.log("Files selected:", files); },
  onRemoveFile: (index: number) => { console.log("Remove file:", index); },
};

const meta: Meta<typeof ParentComplaintsDesktopView> = {
  title: "Views/dashboard/complaints/ParentComplaintsDesktopView",
  component: ParentComplaintsDesktopView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: PARENT_PERMISSIONS });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ParentComplaintsDesktopView>;

export const Default: Story = {
  args: {
    labels: {} as any, // Provide actual labels object from i18n
    records: MOCK_PARENT_COMPLAINTS,
    studentOptions: MOCK_STUDENT_OPTIONS,
    hasOlderRecords: true,
    isSubmitting: false,
    showSuccess: false,
    canSubmit: true,
    selectedFiles: [],
    fileValidationErrors: [],
    ...mockActions,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    records: [],
    hasOlderRecords: false,
  },
};

export const Submitting: Story = {
  args: {
    ...Default.args,
    isSubmitting: true,
  },
};

export const Success: Story = {
  args: {
    ...Default.args,
    showSuccess: true,
  },
};
```

**Key points:**
- Story renders `ParentComplaintsDesktopView` (NOT `ParentComplaintsContainer`)
- NO Apollo imports (`MockedProvider`, `MockedResponse`, etc.)
- NO GraphQL document imports (`parentComplaintsQueryDocument`)
- Mock data passed as props using generated types from `complaintsViewTypes.ts`
- Mock action handlers passed as simple functions
- Permission gates mocked via `useUserStore.setState()`
- Multiple variants: Default, Empty, Submitting, Success

---

#### Step 2 — Create `AdminComplaintsDesktopView.stories.tsx`

Create a new story file following the same pattern:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { AdminComplaintRow, AdminComplaintsSummary, ComplaintTab } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";
import { AdminComplaintsDesktopView } from "./AdminComplaintsDesktopView";

const MOCK_ADMIN_COMPLAINT_ROWS: readonly AdminComplaintRow[] = [
  {
    id: "cmp-1001",
    submitterName: "Sarah Jenkins",
    submitterRole: "Guardian • Student ID: #SR-9021",
    avatarUrl: "",
    priority: "urgent",
    receivedAt: "2 hours ago",
    complaintText: "The digital portal for the Grade 9 Science assignments seems to be malfunctioning...",
    status: "unanswered",
    adminResponse: undefined,
    answeredAt: undefined,
    files: [],
  },
  // ... more mock rows
];

const MOCK_ADMIN_SUMMARY: AdminComplaintsSummary = {
  unanswered: 24,
  answered: 148,
  avgResolutionHours: "4.2 Hours",
};

const ADMIN_PERMISSIONS = [
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsRespond,
  AppPermission.ComplaintsDelete,
];

const mockActions = {
  onSearchChange: (query: string) => { console.log("Search:", query); },
  onTabChange: (tab: ComplaintTab) => { console.log("Tab:", tab); },
  onDraftChange: (id: string, text: string) => { console.log("Draft:", id, text); },
  onAnswer: (id: string, options: { readonly sendEmail: boolean }) => { console.log("Answer:", id, options); },
};

const meta: Meta<typeof AdminComplaintsDesktopView> = {
  title: "Views/dashboard/complaints/AdminComplaintsDesktopView",
  component: AdminComplaintsDesktopView,
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
type Story = StoryObj<typeof AdminComplaintsDesktopView>;

export const Default: Story = {
  args: {
    labels: {} as any,
    summary: MOCK_ADMIN_SUMMARY,
    rows: MOCK_ADMIN_COMPLAINT_ROWS,
    searchQuery: "",
    activeTab: "unanswered",
    draftResponses: {},
    canManage: true,
    ...mockActions,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    rows: [],
    summary: { unanswered: 0, answered: 0, avgResolutionHours: "0.0 Hours" },
  },
};
```

---

#### Step 3 — Create `ParentSuggestionsDesktopView.stories.tsx`

Follow the same pattern for parent suggestions view.

---

#### Step 4 — Create `AdminSuggestionsDesktopView.stories.tsx`

Follow the same pattern for admin suggestions view.

---

### Test Execution Requirements

Run the UI component tests to verify all stories render correctly:

```bash
bun run test:ui:components
```

Verify Storybook builds without errors:

```bash
bun run build-storybook
```

---

### Success Criteria

- [ ] All 4 story files render View components (NOT Containers).
- [ ] NO Apollo imports in story files (`MockedProvider`, `MockedResponse`, etc.).
- [ ] NO Container imports in story files.
- [ ] NO GraphQL document imports in story files (`*QueryDocument`, `*MutationDocument`).
- [ ] Mock data passed as props using generated types from `complaintsViewTypes.ts` and `suggestionsViewTypes.ts`.
- [ ] Mock action handlers passed as simple functions (e.g., `(id: string) => void`).
- [ ] `ParentComplaintsDesktopView.stories.tsx` has Default, Empty, Submitting, Success variants.
- [ ] `AdminComplaintsDesktopView.stories.tsx` has Default, Empty variants.
- [ ] `ParentSuggestionsDesktopView.stories.tsx` has Default, Empty variants.
- [ ] `AdminSuggestionsDesktopView.stories.tsx` has Default, Empty variants.
- [ ] Permission gates mocked via `useUserStore.setState()` in decorators.
- [ ] Mock data shapes use generated GraphQL types and enums from `graphql-types.ts` — no local enum duplicates or inline type definitions.
- [ ] `bun run test:ui:components` passes with zero failures.
- [ ] `bun run build-storybook` completes without errors.
- [ ] No TypeScript errors in any of the 4 story files.

---

### Quality Gate — Pre-Submission Checklist

- [ ] All imports resolve correctly (no missing modules).
- [ ] No `console.*` calls in production code — mock action handlers can use `console.log` for debugging.
- [ ] No hardcoded colors — all styling comes from theme or component defaults.
- [ ] No `any` types used in mock data definitions (except for labels objects which may require `as any` temporarily).
- [ ] Mock data shapes match the generated GraphQL types from `graphql-types.ts`.
- [ ] Permission arrays use `AppPermission` enum values (not raw strings).
- [ ] `useUserStore` is seeded in every decorator.
- [ ] Story titles follow the `Views/dashboard/<domain>/<ComponentName>` convention.
- [ ] `tags: ["autodocs"]` present on all story meta objects.
- [ ] `parameters: { layout: "fullscreen" }` present on all story meta objects.

### `Quality Gate — Post-Submission Checklist`

- [ ] `bun run test:ui:components` passes.
- [ ] `bun run build-storybook` passes.
- [ ] `bun quality-gate` passes (tsgo, biome, lint, CodeScene, SonarQube).
- [ ] No new SonarQube issues introduced.
- [ ] No new duplication blocks introduced.
- [ ] Storybook renders all variants (Default, Empty, Submitting, Success) without runtime errors.
- [ ] Permission-gated content is visible in all story variants.
- [ ] Empty variants display appropriate empty-state UI.
- [ ] Loading variants display loading spinners or skeleton states.
- [ ] No regressions in other stories that share the same containers.
