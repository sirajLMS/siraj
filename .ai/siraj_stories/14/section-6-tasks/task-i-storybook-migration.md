### Task I — Storybook Migration to MockedProvider

**Objective:**
Update all 4 complaint and suggestion story files to use Apollo's `MockedProvider` with mock GraphQL responses instead of relying on mock Zustand stores. Stories will provide predictable, self-contained data through Apollo mock resolution, making them independent of global store state for data fetching.

**Dependencies:**
Task G (types extracted to `.types` files, mock stores updated to re-import from `.types`).

**Layer-Specific Rules:**
Read `frontend/views/AGENTS.md` before starting.

1. Stories use `MockedProvider` from `@apollo/client/testing/react` as a decorator.
2. Mock data defined as constants within story files (with `__typename` and generated type shapes).
3. Containers remain top-level story components — stories never render View components directly.
4. Permission gates mocked via `useUserStore.setState()` and `useMockUserStore.setState()` in decorators.
5. Multiple variants per story: Default, Empty, Loading.
6. Stories CANNOT import Apollo client instances or call Apollo hooks directly — they receive everything through MockedProvider.
7. Mock data uses `__typename` fields on every object to match GraphQL response shapes.
8. Stories follow the existing pattern from `StudentsContainer.stories.tsx` and `ManagersContainer.stories.tsx`.

**Target Files:**
- `frontend/views/dashboard/complaints/ParentComplaintsContainer.stories.tsx` — Rewrite
- `frontend/views/dashboard/complaints/AdminComplaintsContainer.stories.tsx` — Rewrite
- `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.stories.tsx` — Rewrite
- `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.stories.tsx` — Rewrite

---

### Detailed Implementation Steps

#### Step 1 — Rewrite `ParentComplaintsContainer.stories.tsx`

Replace the entire file with the following complete implementation:

```typescript
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentComplaintsQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-complaints.documents";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { ParentComplaintsContainer } from "./ParentComplaintsContainer";

const MOCK_PARENT_COMPLAINTS = [
  {
    __typename: "ParentComplaintRecord" as const,
    id: "rec-1001",
    regarding: "Tuition Fee Processing",
    summary:
      "The online payment portal is not reflecting the scholarship discount for Semester 2.",
    status: "resolved",
    createdAt: "2025-10-20T09:00:00Z",
    adminResponse: {
      __typename: "ComplaintAdminResponse" as const,
      text: "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
      answeredAt: "Oct 24, 2023 • 10:15 AM",
    },
  },
  {
    __typename: "ParentComplaintRecord" as const,
    id: "rec-1002",
    regarding: "Transportation Service",
    summary:
      "Bus #42 was delayed by 30 minutes this morning without notification.",
    status: "pending",
    createdAt: "2025-10-22T07:30:00Z",
    adminResponse: null,
  },
  {
    __typename: "ParentComplaintRecord" as const,
    id: "rec-1003",
    regarding: "Grade Discrepancy",
    summary:
      "Mathematics mid-term score shows 78, but the physical script has 87.",
    status: "resolved",
    createdAt: "2025-09-10T14:00:00Z",
    adminResponse: {
      __typename: "ComplaintAdminResponse" as const,
      text: "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
      answeredAt: "Sep 12, 2023 • 02:45 PM",
    },
  },
];

const MOCK_STUDENT_OPTIONS = [
  {
    __typename: "ParentStudentOption" as const,
    id: "stu-zaid",
    label: "Zaid Ahmad (Grade 4-B)",
  },
  {
    __typename: "ParentStudentOption" as const,
    id: "stu-ayesha",
    label: "Ayesha Ahmad (Grade 1-A)",
  },
];

const PARENT_PERMISSIONS = [
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsRespond,
];

const defaultMocks = [
  {
    request: {
      query: parentComplaintsQueryDocument,
    },
    result: {
      data: {
        parentComplaints: {
          __typename: "ParentComplaintsPayload" as const,
          records: MOCK_PARENT_COMPLAINTS,
          studentOptions: MOCK_STUDENT_OPTIONS,
          hasOlderRecords: true,
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: parentComplaintsQueryDocument,
    },
    result: {
      data: {
        parentComplaints: {
          __typename: "ParentComplaintsPayload" as const,
          records: [],
          studentOptions: MOCK_STUDENT_OPTIONS,
          hasOlderRecords: false,
        },
      },
    },
  },
];

const meta: Meta<typeof ParentComplaintsContainer> = {
  title: "Views/dashboard/complaints/ParentComplaintsContainer",
  component: ParentComplaintsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: PARENT_PERMISSIONS });
      useMockUserStore.setState({ permissions: PARENT_PERMISSIONS });
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ParentComplaintsContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: PARENT_PERMISSIONS });
      useMockUserStore.setState({ permissions: PARENT_PERMISSIONS });
      return (
        <MockedProvider mocks={emptyMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const Loading: Story = {
  args: {},
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: PARENT_PERMISSIONS });
      useMockUserStore.setState({ permissions: PARENT_PERMISSIONS });
      return (
        <MockedProvider mocks={[]}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
```

#### Step 2 — Rewrite `AdminComplaintsContainer.stories.tsx`

Replace the entire file with the following complete implementation:

```typescript
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { adminComplaintQueueQueryDocument } from "@/frontend/graphql/sharedDocuments/admin-complaints.documents";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { AdminComplaintsContainer } from "./AdminComplaintsContainer";

const MOCK_ADMIN_COMPLAINT_ROWS = [
  {
    __typename: "AdminComplaintRow" as const,
    id: "cmp-1001",
    submitterName: "Sarah Jenkins",
    submitterRole: "Guardian • Student ID: #SR-9021",
    avatarUrl: "",
    priority: "urgent",
    receivedAt: "2 hours ago",
    complaintText:
      "The digital portal for the Grade 9 Science assignments seems to be malfunctioning. My son cannot upload his final lab report, and the deadline is tonight. We need an extension or a manual upload option.",
    status: "unanswered",
    adminResponse: null,
    answeredAt: null,
  },
  {
    __typename: "AdminComplaintRow" as const,
    id: "cmp-1002",
    submitterName: "Prof. Robert Miller",
    submitterRole: "Faculty • Department of Humanities",
    avatarUrl: "",
    priority: "general",
    receivedAt: "5 hours ago",
    complaintText:
      "The attendance tracking module for the hybrid lecture sessions is not syncing correctly with the mobile app. Several students were marked absent despite being physically present.",
    status: "unanswered",
    adminResponse: null,
    answeredAt: null,
  },
  {
    __typename: "AdminComplaintRow" as const,
    id: "cmp-1003",
    submitterName: "Michael Lee",
    submitterRole: "Guardian • Student ID: #SR-4412",
    avatarUrl: "",
    priority: "general",
    receivedAt: "Oct 20, 2023",
    complaintText:
      "The online payment portal is not reflecting the scholarship discount for Semester 2.",
    status: "answered",
    adminResponse:
      "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
    answeredAt: "Oct 24, 2023 • 10:15 AM",
  },
  {
    __typename: "AdminComplaintRow" as const,
    id: "cmp-1004",
    submitterName: "Fatima Zayed",
    submitterRole: "Guardian • Student ID: #SR-7788",
    avatarUrl: "",
    priority: "urgent",
    receivedAt: "Sep 10, 2023",
    complaintText:
      "Mathematics mid-term score shows 78, but the physical script has 87.",
    status: "answered",
    adminResponse:
      "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
    answeredAt: "Sep 12, 2023 • 02:45 PM",
  },
];

const MOCK_ADMIN_SUMMARY = {
  __typename: "AdminComplaintsSummary" as const,
  unanswered: 24,
  answered: 148,
  avgResolutionHours: "4.2 Hours",
};

const ADMIN_PERMISSIONS = [
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsRespond,
  AppPermission.ComplaintsDelete,
];

const defaultMocks = [
  {
    request: {
      query: adminComplaintQueueQueryDocument,
    },
    result: {
      data: {
        adminComplaintQueue: {
          __typename: "AdminComplaintQueuePayload" as const,
          summary: MOCK_ADMIN_SUMMARY,
          rows: MOCK_ADMIN_COMPLAINT_ROWS,
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: adminComplaintQueueQueryDocument,
    },
    result: {
      data: {
        adminComplaintQueue: {
          __typename: "AdminComplaintQueuePayload" as const,
          summary: {
            __typename: "AdminComplaintsSummary" as const,
            unanswered: 0,
            answered: 0,
            avgResolutionHours: "0.0 Hours",
          },
          rows: [],
        },
      },
    },
  },
];

const meta: Meta<typeof AdminComplaintsContainer> = {
  title: "Views/dashboard/complaints/AdminComplaintsContainer",
  component: AdminComplaintsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      useMockUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof AdminComplaintsContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      useMockUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      return (
        <MockedProvider mocks={emptyMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const Loading: Story = {
  args: {},
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      useMockUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      return (
        <MockedProvider mocks={[]}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
```

#### Step 3 — Rewrite `ParentSuggestionsContainer.stories.tsx`

Replace the entire file with the following complete implementation:

```typescript
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { submitSuggestionMutationDocument } from "@/frontend/graphql/sharedDocuments/parent-suggestions.documents";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { ParentSuggestionsContainer } from "./ParentSuggestionsContainer";

const PARENT_PERMISSIONS = [AppPermission.ComplaintsList];

const submitMocks = [
  {
    request: {
      query: submitSuggestionMutationDocument,
      variables: {
        input: {
          fullName: "Ahmad Parent",
          suggestion:
            "It would be helpful to receive weekly email summaries of student activity.",
        },
      },
    },
    result: {
      data: {
        submitSuggestion: {
          __typename: "SubmitSuggestionPayload" as const,
          success: true,
        },
      },
    },
  },
];

const meta: Meta<typeof ParentSuggestionsContainer> = {
  title: "Views/dashboard/suggestions/ParentSuggestionsContainer",
  component: ParentSuggestionsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: PARENT_PERMISSIONS });
      useMockUserStore.setState({ permissions: PARENT_PERMISSIONS });
      return (
        <MockedProvider mocks={submitMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ParentSuggestionsContainer>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {},
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: PARENT_PERMISSIONS });
      useMockUserStore.setState({ permissions: PARENT_PERMISSIONS });
      return (
        <MockedProvider mocks={[]}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
```

#### Step 4 — Rewrite `AdminSuggestionsContainer.stories.tsx`

Replace the entire file with the following complete implementation:

```typescript
import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { adminSuggestionsQueryDocument } from "@/frontend/graphql/sharedDocuments/admin-suggestions.documents";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { AdminSuggestionsContainer } from "./AdminSuggestionsContainer";

const MOCK_ADMIN_SUGGESTION_ROWS = [
  {
    __typename: "AdminSuggestionRow" as const,
    id: "sug-1001",
    parentName: "Ahmed Khan",
    suggestionPreview:
      "Could we add a mobile notification when class schedules change?",
    status: "pending",
    submittedAt: "Oct 24, 2023",
  },
  {
    __typename: "AdminSuggestionRow" as const,
    id: "sug-1002",
    parentName: "Sara Ali",
    suggestionPreview:
      "It would help to see attendance summaries in the parent dashboard.",
    status: "pending",
    submittedAt: "Oct 23, 2023",
  },
  {
    __typename: "AdminSuggestionRow" as const,
    id: "sug-1003",
    parentName: "John Smith",
    suggestionPreview:
      "Please offer quarterly billing options for multi-student families.",
    status: "reviewed",
    submittedAt: "Oct 20, 2023",
  },
  {
    __typename: "AdminSuggestionRow" as const,
    id: "sug-1004",
    parentName: "Fatima Zayed",
    suggestionPreview:
      "Add Arabic subtitles to recorded class sessions for review.",
    status: "reviewed",
    submittedAt: "Oct 18, 2023",
  },
];

const MOCK_ADMIN_SUGGESTIONS_SUMMARY = {
  __typename: "AdminSuggestionsSummary" as const,
  pending: 24,
  reviewed: 148,
  avgResponseHours: "4.2 Hours",
};

const ADMIN_PERMISSIONS = [AppPermission.ComplaintsRespond];

const defaultMocks = [
  {
    request: {
      query: adminSuggestionsQueryDocument,
    },
    result: {
      data: {
        adminSuggestions: {
          __typename: "AdminSuggestionsPayload" as const,
          summary: MOCK_ADMIN_SUGGESTIONS_SUMMARY,
          rows: MOCK_ADMIN_SUGGESTION_ROWS,
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: adminSuggestionsQueryDocument,
    },
    result: {
      data: {
        adminSuggestions: {
          __typename: "AdminSuggestionsPayload" as const,
          summary: {
            __typename: "AdminSuggestionsSummary" as const,
            pending: 0,
            reviewed: 0,
            avgResponseHours: "0.0 Hours",
          },
          rows: [],
        },
      },
    },
  },
];

const meta: Meta<typeof AdminSuggestionsContainer> = {
  title: "Views/dashboard/suggestions/AdminSuggestionsContainer",
  component: AdminSuggestionsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      useMockUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof AdminSuggestionsContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      useMockUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      return (
        <MockedProvider mocks={emptyMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const Loading: Story = {
  args: {},
  decorators: [
    (Story) => {
      useUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      useMockUserStore.setState({ permissions: ADMIN_PERMISSIONS });
      return (
        <MockedProvider mocks={[]}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
```

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

- [ ] All 4 story files use `MockedProvider` from `@apollo/client/testing/react` as a decorator.
- [ ] Mock data constants defined within each story file with `__typename` on every object.
- [ ] `ParentComplaintsContainer.stories.tsx` has Default, Empty, and Loading variants with 3 mock complaint records.
- [ ] `AdminComplaintsContainer.stories.tsx` has Default, Empty, and Loading variants with 4 mock queue rows and summary metrics.
- [ ] `ParentSuggestionsContainer.stories.tsx` has Default and Loading variants with submit mutation mock.
- [ ] `AdminSuggestionsContainer.stories.tsx` has Default, Empty, and Loading variants with 4 mock suggestion rows and summary metrics.
- [ ] Permission gates are mocked via `useUserStore.setState()` and `useMockUserStore.setState()` in decorators.
- [ ] Stories do not import or call Apollo hooks directly.
- [ ] Stories do not depend on Zustand mock stores for data — all data flows through MockedProvider.
- [ ] `bun run test:ui:components` passes with zero failures.
- [ ] `bun run build-storybook` completes without errors.
- [ ] No TypeScript errors in any of the 4 rewritten story files.

---

### Quality Gate — Pre-Submission Checklist

- [ ] All imports resolve correctly (no missing modules).
- [ ] No `console.*` calls — use `logger` from `@/frontend/utils/logger` if logging is needed.
- [ ] No hardcoded colors — all styling comes from theme or component defaults.
- [ ] No `any` types used in mock data definitions.
- [ ] `__typename` fields present on every mock object and nested object.
- [ ] Mock data shapes match the GraphQL schema types expected by the containers.
- [ ] Permission arrays use `AppPermission` enum values (not raw strings).
- [ ] Both `useUserStore` and `useMockUserStore` are seeded in every decorator.
- [ ] Loading variants use empty `mocks={[]}` array to trigger unresolved loading state.
- [ ] Story titles follow the `Views/dashboard/<domain>/<ComponentName>` convention.
- [ ] `tags: ["autodocs"]` present on all story meta objects.
- [ ] `parameters: { layout: "fullscreen" }` present on all story meta objects.

### Quality Gate — Post-Submission Checklist

- [ ] `bun run test:ui:components` passes.
- [ ] `bun run build-storybook` passes.
- [ ] `bun quality-gate` passes (tsgo, biome, lint, CodeScene, SonarQube).
- [ ] No new SonarQube issues introduced.
- [ ] No new duplication blocks introduced.
- [ ] Storybook renders all variants (Default, Empty, Loading) without runtime errors.
- [ ] Permission-gated content is visible in all story variants.
- [ ] Empty variants display appropriate empty-state UI.
- [ ] Loading variants display loading spinners or skeleton states.
- [ ] No regressions in other stories that share the same containers.
