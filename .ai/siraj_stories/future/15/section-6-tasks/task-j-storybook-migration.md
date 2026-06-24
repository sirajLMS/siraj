# Task J — Storybook Migration

## Sprint 15 · Frontend Storybook Layer · Section 6

---

## Objective

Update suggestion and complaint stories to include new action components, duplicate dialog, admin response panel, and file upload. All stories must use `MockedProvider` with updated mock GraphQL responses instead of relying on Zustand mock stores. Containers remain the top-level story components. Mock data is defined as constants within each story file using generated type shapes with `__typename`.

---

## Dependencies

| Task | Description |
|------|-------------|
| I | Type Extraction (types available in canonical type files) |

---

## Target Files

| File | Action |
|------|--------|
| `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.stories.tsx` | Rewrite with `MockedProvider` and new mock data |
| `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.stories.tsx` | Rewrite with `MockedProvider` and suggestion history |
| `frontend/views/dashboard/complaints/ParentComplaintsContainer.stories.tsx` | Rewrite with `MockedProvider` and file upload mocks |
| `frontend/views/dashboard/complaints/AdminComplaintsContainer.stories.tsx` | Rewrite with `MockedProvider` and file display mocks |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/views/AGENTS.md` for Storybook best practices
- [ ] Verify `@apollo/client/testing` is available (MockedProvider)
- [ ] Verify generated query/mutation documents exist from Task G:
  - `adminSuggestionsQueryDocument`
  - `respondToSuggestionMutationDocument`
  - `markSuggestionDuplicateMutationDocument`
  - `deleteSuggestionMutationDocument`
  - `searchSuggestionsQueryDocument`
  - `parentSuggestionsQueryDocument`
  - `submitSuggestionMutationDocument`
  - `adminComplaintsQueryDocument`
  - `answerComplaintMutationDocument`
  - `parentComplaintsQueryDocument`
  - `submitComplaintMutationDocument`
  - `complaintFilesQueryDocument`
- [ ] Verify generated types exist in `frontend/graphql/generated/gql/graphql-types.ts`
- [ ] Verify canonical types exist in `suggestionsViewTypes.ts` and `complaintsViewTypes.ts` (Task I)
- [ ] Confirm `StoryWrapper` provides permission seeding for admin components
- [ ] Confirm `NextIntlClientProvider` is provided by global Storybook decorators

---

## Implementation Details

### 1. Admin Suggestions Stories

Replace the entire contents of `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.stories.tsx`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { AdminSuggestionsContainer } from "./AdminSuggestionsContainer";
import {
  adminSuggestionsQueryDocument,
  respondToSuggestionMutationDocument,
  markSuggestionDuplicateMutationDocument,
  deleteSuggestionMutationDocument,
  searchSuggestionsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import type { SuggestionStatus } from "@/frontend/graphql/generated/gql/graphql-types";

const MOCK_ADMIN_SUGGESTIONS_RESPONSE = {
  request: {
    query: adminSuggestionsQueryDocument,
  },
  result: {
    data: {
      adminSuggestions: {
        __typename: "AdminSuggestionsPayload" as const,
        summary: {
          __typename: "SuggestionSummary" as const,
          pending: 24,
          reviewed: 148,
          avgResponseHours: "4.2 Hours",
        },
        rows: [
          {
            __typename: "Suggestion" as const,
            id: "sug-1001",
            parentName: "Ahmed Khan",
            suggestionPreview: "Could we add a mobile notification when class schedules change?",
            status: "PENDING" as SuggestionStatus,
            submittedAt: "2023-10-24T10:00:00Z",
            duplicateOfId: null,
            adminResponse: null,
            reviewedByName: null,
            reviewedAt: null,
          },
          {
            __typename: "Suggestion" as const,
            id: "sug-1002",
            parentName: "Sara Alii",
            suggestionPreview: "It would help to see attendance summaries in the parent dashboard.",
            status: "PENDING" as SuggestionStatus,
            submittedAt: "2023-10-23T14:30:00Z",
            duplicateOfId: null,
            adminResponse: null,
            reviewedByName: null,
            reviewedAt: null,
          },
          {
            __typename: "Suggestion" as const,
            id: "sug-1003",
            parentName: "John Smith",
            suggestionPreview: "Please offer quarterly billing options for multi-student families.",
            status: "REVIEWED" as SuggestionStatus,
            submittedAt: "2023-10-20T09:00:00Z",
            duplicateOfId: null,
            adminResponse: "We will consider this for the next billing cycle review.",
            reviewedByName: "Admin User",
            reviewedAt: "2023-10-21T11:00:00Z",
          },
          {
            __typename: "Suggestion" as const,
            id: "sug-1004",
            parentName: "Fatima Zayed",
            suggestionPreview: "Add Arabic subtitles to recorded class sessions for review.",
            status: "DUPLICATE" as SuggestionStatus,
            submittedAt: "2023-10-18T16:00:00Z",
            duplicateOfId: "sug-1003",
            adminResponse: null,
            reviewedByName: "Admin User",
            reviewedAt: "2023-10-19T08:00:00Z",
          },
        ],
      },
    },
  },
};

const MOCK_RESPOND_MUTATION: MockedResponse = {
  request: {
    query: respondToSuggestionMutationDocument,
    variables: {
      suggestionId: "sug-1001",
      adminResponse: "Thank you for your suggestion. We are implementing this feature.",
    },
  },
  result: {
    data: {
      respondToSuggestion: {
        __typename: "Suggestion" as const,
        id: "sug-1001",
        status: "REVIEWED" as SuggestionStatus,
        adminResponse: "Thank you for your suggestion. We are implementing this feature.",
        reviewedByName: "Admin User",
        reviewedAt: new Date().toISOString(),
      },
    },
  },
};

const MOCK_DUPLICATE_MUTATION: MockedResponse = {
  request: {
    query: markSuggestionDuplicateMutationDocument,
    variables: {
      suggestionId: "sug-1002",
      duplicateOfId: "sug-1001",
    },
  },
  result: {
    data: {
      markSuggestionDuplicate: {
        __typename: "Suggestion" as const,
        id: "sug-1002",
        status: "DUPLICATE" as SuggestionStatus,
        duplicateOfId: "sug-1001",
        reviewedByName: "Admin User",
        reviewedAt: new Date().toISOString(),
      },
    },
  },
};

const MOCK_DELETE_MUTATION: MockedResponse = {
  request: {
    query: deleteSuggestionMutationDocument,
    variables: {
      suggestionId: "sug-1004",
    },
  },
  result: {
    data: {
      deleteSuggestion: {
        __typename: "SoftDeleteResult" as const,
        success: true,
        entityId: "sug-1004",
      },
    },
  },
};

const MOCK_SEARCH_RESPONSE: MockedResponse = {
  request: {
    query: searchSuggestionsQueryDocument,
    variables: {
      query: "mobile notification",
      excludeId: "sug-1002",
    },
  },
  result: {
    data: {
      searchSuggestions: [
        {
          __typename: "SuggestionSearchResult" as const,
          id: "sug-1001",
          body: "Could we add a mobile notification when class schedules change?",
          submitterName: "Ahmed Khan",
          status: "PENDING" as SuggestionStatus,
          createdAt: "2023-10-24T10:00:00Z",
        },
      ],
    },
  },
};

const ADMIN_SUGGESTIONS_MOCKS: MockedResponse[] = [
  MOCK_ADMIN_SUGGESTIONS_RESPONSE,
  MOCK_RESPOND_MUTATION,
  MOCK_DUPLICATE_MUTATION,
  MOCK_DELETE_MUTATION,
  MOCK_SEARCH_RESPONSE,
];

const meta: Meta<typeof AdminSuggestionsContainer> = {
  title: "Views/dashboard/suggestions/AdminSuggestionsContainer",
  component: AdminSuggestionsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={ADMIN_SUGGESTIONS_MOCKS} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminSuggestionsContainer>;

export const Default: Story = {
  args: {},
};

export const PendingTab: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Admin view showing pending suggestions with respond and duplicate actions available.",
      },
    },
  },
};

export const ReviewedList: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Admin view showing reviewed suggestions with admin response and duplicate status.",
      },
    },
  },
};

export const WithDuplicateDialog: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Admin marking a suggestion as duplicate with search autocomplete for parent suggestion.",
      },
    },
  },
};

export const WithAdminResponse: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Admin responding to a suggestion with a text response panel.",
      },
    },
  },
};
```

---

### 2. Parent Suggestions Stories

Replace the entire contents of `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.stories.tsx`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { ParentSuggestionsContainer } from "./ParentSuggestionsContainer";
import {
  parentSuggestionsQueryDocument,
  submitSuggestionMutationDocument,
} from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import type { SuggestionStatus } from "@/frontend/graphql/generated/gql/graphql-types";

const MOCK_PARENT_SUGGESTIONS_RESPONSE: MockedResponse = {
  request: {
    query: parentSuggestionsQueryDocument,
  },
  result: {
    data: {
      parentSuggestions: {
        __typename: "ParentSuggestionsPayload" as const,
        suggestions: [
          {
            __typename: "Suggestion" as const,
            id: "psug-1001",
            status: "PENDING" as SuggestionStatus,
            body: "Could we add a mobile notification when class schedules change?",
            createdAt: "2023-10-24T10:00:00Z",
            adminResponse: null,
            duplicateOf: null,
          },
          {
            __typename: "Suggestion" as const,
            id: "psug-1002",
            status: "REVIEWED" as SuggestionStatus,
            body: "It would help to see attendance summaries in the parent dashboard.",
            createdAt: "2023-10-20T09:00:00Z",
            adminResponse: "Thank you for your suggestion. We are working on this feature for the next release.",
            duplicateOf: null,
          },
          {
            __typename: "Suggestion" as const,
            id: "psug-1003",
            status: "DUPLICATE" as SuggestionStatus,
            body: "Add Arabic subtitles to recorded class sessions for review.",
            createdAt: "2023-10-18T16:00:00Z",
            adminResponse: null,
            duplicateOf: {
              __typename: "Suggestion" as const,
              id: "psug-1002",
              body: "It would help to see attendance summaries in the parent dashboard.",
            },
          },
          {
            __typename: "Suggestion" as const,
            id: "psug-1004",
            status: "REVIEWED" as SuggestionStatus,
            body: "Please offer quarterly billing options for multi-student families.",
            createdAt: "2023-09-15T12:00:00Z",
            adminResponse: "We have forwarded this to the billing department for consideration.",
            duplicateOf: null,
          },
        ],
        total: 4,
      },
    },
  },
};

const MOCK_SUBMIT_MUTATION: MockedResponse = {
  request: {
    query: submitSuggestionMutationDocument,
    variables: {
      body: "Please add a dark mode option to the parent portal.",
    },
  },
  result: {
    data: {
      submitSuggestion: {
        __typename: "Suggestion" as const,
        id: "psug-1005",
        status: "PENDING" as SuggestionStatus,
        body: "Please add a dark mode option to the parent portal.",
        createdAt: new Date().toISOString(),
        adminResponse: null,
        duplicateOf: null,
      },
    },
  },
};

const PARENT_SUGGESTIONS_MOCKS: MockedResponse[] = [
  MOCK_PARENT_SUGGESTIONS_RESPONSE,
  MOCK_SUBMIT_MUTATION,
];

const meta: Meta<typeof ParentSuggestionsContainer> = {
  title: "Views/dashboard/suggestions/ParentSuggestionsContainer",
  component: ParentSuggestionsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={PARENT_SUGGESTIONS_MOCKS} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ParentSuggestionsContainer>;

export const Default: Story = {
  args: {},
};

export const WithHistory: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Parent view showing suggestion history with pending, reviewed, and duplicate statuses.",
      },
    },
  },
};

export const WithDuplicateSuggestion: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Parent view showing a suggestion marked as duplicate with link to parent suggestion.",
      },
    },
  },
};

export const EmptyHistory: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Parent view with no previous suggestions, showing the submission form only.",
      },
    },
  },
};

const EMPTY_HISTORY_MOCK: MockedResponse = {
  request: {
    query: parentSuggestionsQueryDocument,
  },
  result: {
    data: {
      parentSuggestions: {
        __typename: "ParentSuggestionsPayload" as const,
        suggestions: [],
        total: 0,
      },
    },
  },
};

EmptyHistory.decorators = [
  (Story) => (
    <MockedProvider mocks={[EMPTY_HISTORY_MOCK, MOCK_SUBMIT_MUTATION]} addTypename={false}>
      <Story />
    </MockedProvider>
  ),
];
```

---

### 3. Parent Complaints Stories

Replace the entire contents of `frontend/views/dashboard/complaints/ParentComplaintsContainer.stories.tsx`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { ParentComplaintsContainer } from "./ParentComplaintsContainer";
import {
  parentComplaintsQueryDocument,
  submitComplaintMutationDocument,
  complaintFilesQueryDocument,
} from "@/frontend/graphql/sharedDocuments/complaint.documents";

const MOCK_PARENT_COMPLAINTS_RESPONSE: MockedResponse = {
  request: {
    query: parentComplaintsQueryDocument,
  },
  result: {
    data: {
      parentComplaints: {
        __typename: "ParentComplaintsPayload" as const,
        records: [
          {
            __typename: "Complaint" as const,
            id: "rec-1001",
            regarding: "Tuition Fee Processing",
            summary: "The online payment portal is not reflecting the scholarship discount for Semester 2.",
            status: "resolved",
            adminResponse: {
              __typename: "ComplaintResponse" as const,
              text: "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
              answeredAt: "2023-10-24T10:15:00Z",
            },
            files: [
              {
                __typename: "ComplaintFile" as const,
                id: "file-2001",
                complaintId: "rec-1001",
                fileName: "payment_receipt.pdf",
                fileUrl: "/uploads/payment_receipt.pdf",
                fileSize: 128000,
                mimeType: "application/pdf",
                uploadedAt: "2023-10-20T09:00:00Z",
              },
            ],
          },
          {
            __typename: "Complaint" as const,
            id: "rec-1002",
            regarding: "Transportation Service",
            summary: "Bus #42 was delayed by 30 minutes this morning without notification.",
            status: "pending",
            adminResponse: null,
            files: [],
          },
          {
            __typename: "Complaint" as const,
            id: "rec-1003",
            regarding: "Grade Discrepancy",
            summary: "Mathematics mid-term score shows 78, but the physical script has 87.",
            status: "resolved",
            adminResponse: {
              __typename: "ComplaintResponse" as const,
              text: "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
              answeredAt: "2023-09-12T14:45:00Z",
            },
            files: [
              {
                __typename: "ComplaintFile" as const,
                id: "file-2002",
                complaintId: "rec-1003",
                fileName: "exam_script_photo.jpg",
                fileUrl: "/uploads/exam_script_photo.jpg",
                fileSize: 2048000,
                mimeType: "image/jpeg",
                uploadedAt: "2023-09-10T08:00:00Z",
              },
            ],
          },
        ],
        hasOlderRecords: true,
      },
    },
  },
};

const MOCK_COMPLAINT_FILES_RESPONSE: MockedResponse = {
  request: {
    query: complaintFilesQueryDocument,
    variables: { complaintId: "rec-1001" },
  },
  result: {
    data: {
      complaintFiles: [
        {
          __typename: "ComplaintFile" as const,
          id: "file-2001",
          complaintId: "rec-1001",
          fileName: "payment_receipt.pdf",
          fileUrl: "/uploads/payment_receipt.pdf",
          fileSize: 128000,
          mimeType: "application/pdf",
          uploadedAt: "2023-10-20T09:00:00Z",
        },
      ],
    },
  },
};

const MOCK_SUBMIT_COMPLAINT_MUTATION: MockedResponse = {
  request: {
    query: submitComplaintMutationDocument,
    variables: {
      studentId: "stu-zaid",
      complaintDetails: "The school bus was late again today without any notification.",
    },
  },
  result: {
    data: {
      submitComplaint: {
        __typename: "Complaint" as const,
        id: "rec-1005",
        regarding: "Regarding: Zaid Ahmad (Grade 4-B)",
        summary: "The school bus was late again today without any notification.",
        status: "pending",
        adminResponse: null,
        files: [],
      },
    },
  },
};

const PARENT_COMPLAINTS_MOCKS: MockedResponse[] = [
  MOCK_PARENT_COMPLAINTS_RESPONSE,
  MOCK_COMPLAINT_FILES_RESPONSE,
  MOCK_SUBMIT_COMPLAINT_MUTATION,
];

const meta: Meta<typeof ParentComplaintsContainer> = {
  title: "Views/dashboard/complaints/ParentComplaintsContainer",
  component: ParentComplaintsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={PARENT_COMPLAINTS_MOCKS} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ParentComplaintsContainer>;

export const Default: Story = {
  args: {},
};

export const WithFileAttachments: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Parent view showing complaints with attached files (PDF and image).",
      },
    },
  },
};

export const WithFileUpload: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Parent submitting a new complaint with file upload capability.",
      },
    },
  },
};

export const EmptyRecords: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Parent view with no previous complaints, showing the submission form only.",
      },
    },
  },
};

const EMPTY_RECORDS_MOCK: MockedResponse = {
  request: {
    query: parentComplaintsQueryDocument,
  },
  result: {
    data: {
      parentComplaints: {
        __typename: "ParentComplaintsPayload" as const,
        records: [],
        hasOlderRecords: false,
      },
    },
  },
};

EmptyRecords.decorators = [
  (Story) => (
    <MockedProvider mocks={[EMPTY_RECORDS_MOCK, MOCK_SUBMIT_COMPLAINT_MUTATION]} addTypename={false}>
      <Story />
    </MockedProvider>
  ),
];
```

---

### 4. Admin Complaints Stories

Replace the entire contents of `frontend/views/dashboard/complaints/AdminComplaintsContainer.stories.tsx`:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { AdminComplaintsContainer } from "./AdminComplaintsContainer";
import {
  adminComplaintsQueryDocument,
  answerComplaintMutationDocument,
} from "@/frontend/graphql/sharedDocuments/complaint.documents";

const MOCK_ADMIN_COMPLAINTS_RESPONSE: MockedResponse = {
  request: {
    query: adminComplaintsQueryDocument,
  },
  result: {
    data: {
      adminComplaints: {
        __typename: "AdminComplaintsPayload" as const,
        summary: {
          __typename: "ComplaintSummary" as const,
          unanswered: 24,
          answered: 148,
          avgResolutionHours: "4.2 Hours",
        },
        rows: [
          {
            __typename: "Complaint" as const,
            id: "cmp-1001",
            submitterName: "Sarah Jenkins",
            submitterRole: "Guardian • Student ID: #SR-9021",
            avatarUrl: "",
            priority: "urgent",
            receivedAt: "2023-10-24T08:00:00Z",
            complaintText:
              "The digital portal for the Grade 9 Science assignments seems to be malfunctioning. My son cannot upload his final lab report, and the deadline is tonight. We need an extension or a manual upload option.",
            status: "unanswered",
            adminResponse: null,
            answeredAt: null,
            files: [],
          },
          {
            __typename: "Complaint" as const,
            id: "cmp-1002",
            submitterName: "Prof. Robert Miller",
            submitterRole: "Faculty • Department of Humanities",
            avatarUrl: "",
            priority: "general",
            receivedAt: "2023-10-24T05:00:00Z",
            complaintText:
              "The attendance tracking module for the hybrid lecture sessions is not syncing correctly with the mobile app. Several students were marked absent despite being physically present.",
            status: "unanswered",
            adminResponse: null,
            answeredAt: null,
            files: [],
          },
          {
            __typename: "Complaint" as const,
            id: "cmp-1003",
            submitterName: "Michael Lee",
            submitterRole: "Guardian • Student ID: #SR-4412",
            priority: "general",
            receivedAt: "2023-10-20T09:00:00Z",
            complaintText:
              "The online payment portal is not reflecting the scholarship discount for Semester 2.",
            status: "answered",
            adminResponse:
              "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
            answeredAt: "2023-10-24T10:15:00Z",
            files: [
              {
                __typename: "ComplaintFile" as const,
                id: "file-1001",
                complaintId: "cmp-1003",
                fileName: "scholarship_letter.pdf",
                fileUrl: "/uploads/scholarship_letter.pdf",
                fileSize: 245000,
                mimeType: "application/pdf",
                uploadedAt: "2023-10-20T09:00:00Z",
              },
            ],
          },
          {
            __typename: "Complaint" as const,
            id: "cmp-1004",
            submitterName: "Fatima Zayed",
            submitterRole: "Guardian • Student ID: #SR-7788",
            priority: "urgent",
            receivedAt: "2023-09-10T12:00:00Z",
            complaintText:
              "Mathematics mid-term score shows 78, but the physical script has 87.",
            status: "answered",
            adminResponse:
              "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
            answeredAt: "2023-09-12T14:45:00Z",
            files: [
              {
                __typename: "ComplaintFile" as const,
                id: "file-1002",
                complaintId: "cmp-1004",
                fileName: "exam_script_scan.pdf",
                fileUrl: "/uploads/exam_script_scan.pdf",
                fileSize: 1536000,
                mimeType: "application/pdf",
                uploadedAt: "2023-09-10T12:30:00Z",
              },
              {
                __typename: "ComplaintFile" as const,
                id: "file-1003",
                complaintId: "cmp-1004",
                fileName: "grade_sheet_photo.jpg",
                fileUrl: "/uploads/grade_sheet_photo.jpg",
                fileSize: 890000,
                mimeType: "image/jpeg",
                uploadedAt: "2023-09-10T12:35:00Z",
              },
            ],
          },
        ],
      },
    },
  },
};

const MOCK_ANSWER_MUTATION: MockedResponse = {
  request: {
    query: answerComplaintMutationDocument,
    variables: {
      complaintId: "cmp-1001",
      adminResponse: "We have extended the deadline by 48 hours. Your son can submit the lab report via email as a temporary workaround.",
      sendEmail: true,
    },
  },
  result: {
    data: {
      answerComplaint: {
        __typename: "Complaint" as const,
        id: "cmp-1001",
        status: "answered",
        adminResponse:
          "We have extended the deadline by 48 hours. Your son can submit the lab report via email as a temporary workaround.",
        answeredAt: new Date().toISOString(),
      },
    },
  },
};

const ADMIN_COMPLAINTS_MOCKS: MockedResponse[] = [
  MOCK_ADMIN_COMPLAINTS_RESPONSE,
  MOCK_ANSWER_MUTATION,
];

const meta: Meta<typeof AdminComplaintsContainer> = {
  title: "Views/dashboard/complaints/AdminComplaintsContainer",
  component: AdminComplaintsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={ADMIN_COMPLAINTS_MOCKS} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminComplaintsContainer>;

export const Default: Story = {
  args: {},
};

export const UnansweredTab: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Admin view showing unanswered complaints with response panel and file display.",
      },
    },
  },
};

export const AnsweredWithFiles: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Admin view showing answered complaints with attached files displayed.",
      },
    },
  },
};

export const WithResponseDraft: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Admin composing a response to an unanswered complaint with email notification toggle.",
      },
    },
  },
};

export const EmptyUnanswered: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Admin view with no unanswered complaints.",
      },
    },
  },
};

const EMPTY_UNANSWERED_MOCK: MockedResponse = {
  request: {
    query: adminComplaintsQueryDocument,
  },
  result: {
    data: {
      adminComplaints: {
        __typename: "AdminComplaintsPayload" as const,
        summary: {
          __typename: "ComplaintSummary" as const,
          unanswered: 0,
          answered: 172,
          avgResolutionHours: "3.8 Hours",
        },
        rows: [],
      },
    },
  },
};

EmptyUnanswered.decorators = [
  (Story) => (
    <MockedProvider mocks={[EMPTY_UNANSWERED_MOCK]} addTypename={false}>
      <Story />
    </MockedProvider>
  ),
];
```

---

## Storybook Mock Data Rules

1. **All mock data uses `__typename`** — Every object in mock responses must include `__typename` for Apollo cache normalization.
2. **Mock data matches generated type shapes** — Use the exact field names and types from `frontend/graphql/generated/gql/graphql-types.ts`.
3. **Containers remain top-level** — Stories render the container component directly; no wrapper components.
4. **Permission gates mocked via global decorators** — The `StoryWrapper` provides admin permissions by default. No per-story permission setup needed.
5. **Multiple story variants** — Each story file includes Default plus variants for edge cases (empty, loading, error states).
6. **Mock mutations included** — Stories that trigger mutations include mock mutation responses for interactive testing.
7. **Mock data uses generated type shapes** — Story mock data uses `__typename` and generated type shapes from codegen.

---

## Test Execution Requirements

Run the Storybook build to verify all stories compile:

```bash
bun run build-storybook
```

Run TypeScript check:

```bash
bun tsgo
```

Both commands must pass with zero errors.

---

## Success Criteria / Check Progress Points

- [ ] `AdminSuggestionsContainer.stories.tsx` uses `MockedProvider` with mock query and mutation responses
- [ ] Admin suggestions mocks include: query response with 4 suggestions (pending, reviewed, duplicate), respond mutation, duplicate mutation, delete mutation, search query
- [ ] `ParentSuggestionsContainer.stories.tsx` uses `MockedProvider` with parent history query and submit mutation
- [ ] Parent suggestions mocks include: history with 4 suggestions (pending, reviewed, duplicate with parent link), submit mutation
- [ ] Parent suggestions includes `EmptyHistory` story variant with empty array mock
- [ ] `ParentComplaintsContainer.stories.tsx` uses `MockedProvider` with complaints query, file query, and submit mutation
- [ ] Parent complaints mocks include: 3 complaint records with file attachments, complaint files query, submit mutation
- [ ] Parent complaints includes `EmptyRecords` story variant
- [ ] `AdminComplaintsContainer.stories.tsx` uses `MockedProvider` with admin complaints query and answer mutation
- [ ] Admin complaints mocks include: 4 complaints (2 unanswered, 2 answered with files), answer mutation with email toggle
- [ ] Admin complaints includes `EmptyUnanswered` story variant
- [ ] All mock data objects include `__typename` field
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
