# Task I — Type Extraction

## Sprint 15 · Frontend Types Layer · Section 6

---

## Objective

Extract new types from updated mock stores for suggestion management features (status, duplicate, admin response, file attachments). Re-export generated GraphQL types where available; define UI-specific types only where no generated equivalent exists. Update all component imports that reference suggestion and complaint types to point to the new canonical type files.

---

## Dependencies

| Task | Description |
|------|-------------|
| G | Frontend Apollo Documents (codegen has run, generated types available in `frontend/graphql/generated/gql/graphql-types.ts`) |

---

## Layer-Specific Rules

- Read `frontend/stores/AGENTS.md` and `frontend/views/AGENTS.md` before starting.
- **Generated types first** — Before defining any custom type, check `frontend/graphql/generated/gql/graphql-types.ts` for the generated equivalent.
- **Re-export generated types** — If a generated type exists, re-export it with a type alias.
- **UI-specific types only** — Only define types that have no generated equivalent.
- **Backend canonical types flow through** — Frontend `types.ts` files re-export generated GraphQL types (which originate from backend canonical types). No duplication of backend entity structures.
- **Update components to use generated GQL types and enums** — Replace any locally-defined types, inline enums, or string literals in component files with imports from generated GraphQL types or view-level `.types.ts` files.
- **Ensure stores import types from `.types.ts` files** — If any store file defines types locally, those types are moved to `.types.ts` files and re-imported. Stores MUST NOT define entity types.
- **No `any`, `unknown`, casting, or mapping** — All types must be strictly typed.

---

## Target Files

| File | Action |
|------|--------|
| `frontend/views/dashboard/suggestions/types/suggestionsViewTypes.ts` | Extend with new suggestion types |
| `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts` | Extend with complaint file types |
| `frontend/stores/mockAdminSuggestionsStore.ts` | Update to re-import types from `suggestionsViewTypes.ts` |
| `frontend/stores/mockParentSuggestionsStore.ts` | Update to re-import types from `suggestionsViewTypes.ts` |
| `frontend/stores/mockAdminComplaintsStore.ts` | Update to re-import types from `complaintsViewTypes.ts` |
| `frontend/stores/mockParentComplaintsStore.ts` | Update to re-import types from `complaintsViewTypes.ts` |
| `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx` | Update imports |
| `frontend/views/dashboard/suggestions/AdminSuggestionsDesktopView.tsx` | Update imports |
| `frontend/views/dashboard/suggestions/AdminSuggestionsMobileView.tsx` | Update imports |
| `frontend/views/dashboard/suggestions/AdminSuggestionsView.tsx` | Update imports |
| `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx` | Update imports |
| `frontend/views/dashboard/suggestions/ParentSuggestionsDesktopView.tsx` | Update imports |
| `frontend/views/dashboard/suggestions/ParentSuggestionsMobileView.tsx` | Update imports |
| `frontend/views/dashboard/suggestions/ParentSuggestionsView.tsx` | Update imports |
| `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx` | Update imports |
| `frontend/views/dashboard/complaints/AdminComplaintsDesktopView.tsx` | Update imports |
| `frontend/views/dashboard/complaints/AdminComplaintsMobileView.tsx` | Update imports |
| `frontend/views/dashboard/complaints/AdminComplaintsView.tsx` | Update imports |
| `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx` | Update imports |
| `frontend/views/dashboard/complaints/ParentComplaintsDesktopView.tsx` | Update imports |
| `frontend/views/dashboard/complaints/ParentComplaintsMobileView.tsx` | Update imports |
| `frontend/views/dashboard/complaints/ParentComplaintsView.tsx` | Update imports |

---

## Pre-Implementation Checklist

- [ ] Read `frontend/stores/AGENTS.md` for store layer rules
- [ ] Read `frontend/views/AGENTS.md` for view layer rules
- [ ] Verify codegen has run: `frontend/graphql/generated/gql/graphql-types.ts` contains `SuggestionStatus` enum
- [ ] Verify codegen has run: `frontend/graphql/generated/gql/graphql-types.ts` contains `ComplaintFile` type
- [ ] Verify codegen has run: `frontend/graphql/generated/gql/graphql-types.ts` contains `Suggestion` type with new fields
- [ ] Confirm `SuggestionStatus` enum values: `Pending`, `Reviewed`, `Duplicate`
- [ ] Confirm no `any`, `unknown`, or casting in any type definition
- [ ] Confirm all existing component imports are cataloged before making changes

---

## Implementation Details

### 1. Audit Generated Types

Before writing any type, check `frontend/graphql/generated/gql/graphql-types.ts` for the generated equivalent. The following types are expected to exist after codegen (Task G):

#### Expected Generated Types

```typescript
// frontend/graphql/generated/gql/graphql-types.ts

export enum SuggestionStatus {
  Pending = 'PENDING',
  Reviewed = 'REVIEWED',
  Duplicate = 'DUPLICATE'
}

export type Suggestion = {
  __typename?: 'Suggestion';
  id: Scalars['ID']['output'];
  parentId: Scalars['String']['output'];
  submitterName: Scalars['String']['output'];
  body: Scalars['String']['output'];
  status: SuggestionStatus;
  duplicateOfId: Maybe<Scalars['String']['output']>;
  adminResponse: Maybe<Scalars['String']['output']>;
  reviewedByUserId: Maybe<Scalars['String']['output']>;
  reviewedAt: Maybe<Scalars['DateTime']['output']>;
  reviewedByName: Maybe<Scalars['String']['output']>;
  emailSentAt: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
};

export type ComplaintFile = {
  __typename?: 'ComplaintFile';
  id: Scalars['ID']['output'];
  complaintId: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  fileUrl: Scalars['String']['output'];
  fileSize: Scalars['Int']['output'];
  mimeType: Scalars['String']['output'];
  uploadedAt: Scalars['DateTime']['output'];
};

export type SuggestionSearchResult = {
  __typename?: 'SuggestionSearchResult';
  id: Scalars['ID']['output'];
  body: Scalars['String']['output'];
  submitterName: Scalars['String']['output'];
  status: SuggestionStatus;
  createdAt: Scalars['DateTime']['output'];
};
```

---

### 2. Extend `suggestionsViewTypes.ts`

Replace the entire contents of `frontend/views/dashboard/suggestions/types/suggestionsViewTypes.ts` with the following. This file becomes the canonical source for all suggestion-related view types.

```typescript
import type {
  Suggestion,
  SuggestionSearchResult as GeneratedSuggestionSearchResult,
  SuggestionStatus as GeneratedSuggestionStatus,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type { SuggestionsLabels } from "@/shared/messages/types/dashboard/suggestions/main";
import type { SuggestionFormData } from "../schemas/suggestionFormSchema";

export type { SuggestionsLabels };

export type SuggestionStatusType = GeneratedSuggestionStatus;

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
  readonly status: SuggestionStatusType;
  readonly submittedAt: string;
  readonly duplicateOfId: string | null;
  readonly adminResponse: string | null;
  readonly reviewedByName: string | null;
  readonly reviewedAt: string | null;
}

export type SuggestionSearchResult = GeneratedSuggestionSearchResult;

export interface ParentSuggestionRecord {
  readonly id: string;
  readonly status: SuggestionStatusType;
  readonly body: string;
  readonly createdAt: string;
  readonly adminResponse: string | null;
  readonly duplicateOf: {
    readonly id: string;
    readonly body: string;
  } | null;
}

export interface ParentSuggestionsViewProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly suggestions: readonly ParentSuggestionRecord[];
  readonly loading: boolean;
  readonly error: string | null;
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
  readonly onRespond: (id: string, adminResponse: string) => void;
  readonly onMarkDuplicate: (id: string, duplicateOfId: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onSearchSuggestions: (query: string, excludeId: string) => void;
}
```

---

### 3. Extend `complaintsViewTypes.ts`

Replace the entire contents of `frontend/views/dashboard/complaints/types/complaintsViewTypes.ts` with the following. This file becomes the canonical source for all complaint-related view types.

```typescript
import type { ComplaintFile as GeneratedComplaintFile } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ComplaintsLabels } from "@/shared/messages/types/dashboard/complaints/main";
import type { ComplaintFormData } from "../schemas/complaintFormSchema";

export type { ComplaintsLabels };

export type ComplaintTab = "unanswered" | "answered";

export type ComplaintPriority = "urgent" | "general";

export type ComplaintStatus = "unanswered" | "answered";

export type ComplaintFileType = GeneratedComplaintFile;

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
  readonly files: readonly ComplaintFileType[];
}

export interface ParentComplaintRecord {
  readonly id: string;
  readonly regarding: string;
  readonly summary: string;
  readonly status: "pending" | "resolved";
  readonly adminResponse?: { readonly text: string; readonly answeredAt: string };
  readonly files: readonly ComplaintFileType[];
}

export interface ParentStudentOption {
  readonly id: string;
  readonly label: string;
}

export interface ParentComplaintsViewProps {
  readonly labels: ComplaintsLabels["parent"];
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly hasOlderRecords: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly selectedFiles: readonly File[];
  readonly fileValidationErrors: readonly string[];
  readonly onSubmit: (data: ComplaintFormData) => void;
  readonly onDismissSuccess: () => void;
  readonly onLoadOlderRecords: () => void;
  readonly onFilesSelected: (files: readonly File[]) => void;
  readonly onRemoveFile: (index: number) => void;
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

### 4. Update `mockAdminSuggestionsStore.ts`

Update `frontend/stores/mockAdminSuggestionsStore.ts` to re-import types from the canonical type file instead of defining them locally.

```typescript
// cspell:disable
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionStatusType,
  SuggestionTab,
} from "@/frontend/views/dashboard/suggestions/types/suggestionsViewTypes";

export type { AdminSuggestionRow, AdminSuggestionsSummary, SuggestionStatusType, SuggestionTab };

interface AdminSuggestionsState {
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly searchQuery: string;
  readonly activeTab: SuggestionTab;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: SuggestionTab) => void;
  markReviewed: (id: string) => void;
}

const MOCK_SUMMARY: AdminSuggestionsSummary = {
  pending: 24,
  reviewed: 148,
  avgResponseHours: "4.2 Hours",
};

const MOCK_ROWS: AdminSuggestionRow[] = [
  {
    id: "sug-1001",
    parentName: "Ahmed Khan",
    suggestionPreview: "Could we add a mobile notification when class schedules change?",
    status: "PENDING" as SuggestionStatusType,
    submittedAt: "Oct 24, 2023",
    duplicateOfId: null,
    adminResponse: null,
    reviewedByName: null,
    reviewedAt: null,
  },
  {
    id: "sug-1002",
    parentName: "Sara Alii",
    suggestionPreview: "It would help to see attendance summaries in the parent dashboard.",
    status: "PENDING" as SuggestionStatusType,
    submittedAt: "Oct 23, 2023",
    duplicateOfId: null,
    adminResponse: null,
    reviewedByName: null,
    reviewedAt: null,
  },
  {
    id: "sug-1003",
    parentName: "John Smith",
    suggestionPreview: "Please offer quarterly billing options for multi-student families.",
    status: "REVIEWED" as SuggestionStatusType,
    submittedAt: "Oct 20, 2023",
    duplicateOfId: null,
    adminResponse: "We will consider this for the next billing cycle.",
    reviewedByName: "Admin User",
    reviewedAt: "Oct 21, 2023",
  },
  {
    id: "sug-1004",
    parentName: "Fatima Zayed",
    suggestionPreview: "Add Arabic subtitles to recorded class sessions for review.",
    status: "DUPLICATE" as SuggestionStatusType,
    submittedAt: "Oct 18, 2023",
    duplicateOfId: "sug-1003",
    adminResponse: null,
    reviewedByName: "Admin User",
    reviewedAt: "Oct 19, 2023",
  },
];

export const useAdminSuggestionsStore = create<AdminSuggestionsState>(set => ({
  summary: MOCK_SUMMARY,
  rows: MOCK_ROWS,
  searchQuery: "",
  activeTab: "pending",
  setSearchQuery: query => {
    set({ searchQuery: query });
  },
  setActiveTab: tab => {
    set({ activeTab: tab });
  },
  markReviewed: id => {
    logger.info("Suggestion marked reviewed", { id });
    set(state => ({
      rows: state.rows.map(row =>
        row.id === id ? { ...row, status: "REVIEWED" as SuggestionStatusType } : row
      ),
      summary: {
        ...state.summary,
        pending: Math.max(state.summary.pending - 1, 0),
        reviewed: state.summary.reviewed + 1,
      },
    }));
  },
}));
```

---

### 5. Update `mockParentSuggestionsStore.ts`

Update `frontend/stores/mockParentSuggestionsStore.ts` to re-import types from the canonical type file.

```typescript
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type {
  ParentSuggestionRecord,
  SuggestionStatusType,
} from "@/frontend/views/dashboard/suggestions/types/suggestionsViewTypes";
import type { SuggestionFormData } from "@/frontend/views/dashboard/suggestions/schemas/suggestionFormSchema";

export type { ParentSuggestionRecord };

interface ParentSuggestionsState {
  readonly suggestions: readonly ParentSuggestionRecord[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  submitSuggestion: (data: SuggestionFormData) => void;
}

const MOCK_SUGGESTIONS: ParentSuggestionRecord[] = [
  {
    id: "psug-1001",
    status: "PENDING" as SuggestionStatusType,
    body: "Could we add a mobile notification when class schedules change?",
    createdAt: "Oct 24, 2023",
    adminResponse: null,
    duplicateOf: null,
  },
  {
    id: "psug-1002",
    status: "REVIEWED" as SuggestionStatusType,
    body: "It would help to see attendance summaries in the parent dashboard.",
    createdAt: "Oct 20, 2023",
    adminResponse: "Thank you for your suggestion. We are working on this feature.",
    duplicateOf: null,
  },
  {
    id: "psug-1003",
    status: "DUPLICATE" as SuggestionStatusType,
    body: "Add Arabic subtitles to recorded class sessions.",
    createdAt: "Oct 18, 2023",
    adminResponse: null,
    duplicateOf: {
      id: "psug-1002",
      body: "It would help to see attendance summaries in the parent dashboard.",
    },
  },
];

export const useParentSuggestionsStore = create<ParentSuggestionsState>(set => ({
  suggestions: MOCK_SUGGESTIONS,
  loading: false,
  error: null,
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
  submitSuggestion: data => {
    logger.info("Parent suggestion submitted", { data });
    set({ showSuccess: true });
  },
}));
```

---

### 6. Update `mockAdminComplaintsStore.ts`

Update `frontend/stores/mockAdminComplaintsStore.ts` to re-import types from the canonical type file.

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
} from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";

export type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintTab,
};

interface AdminComplaintsState {
  readonly summary: AdminComplaintsSummary;
  readonly rows: readonly AdminComplaintRow[];
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  setDraftResponse: (id: string, text: string) => void;
  answerComplaint: (id: string, options: { readonly sendEmail: boolean }) => void;
}

const MOCK_SUMMARY: AdminComplaintsSummary = {
  unanswered: 24,
  answered: 148,
  avgResolutionHours: "4.2 Hours",
};

const MOCK_ROWS: AdminComplaintRow[] = [
  {
    id: "cmp-1001",
    submitterName: "Sarah Jenkins",
    submitterRole: "Guardian • Student ID: #SR-9021",
    avatarUrl: "",
    priority: "urgent",
    receivedAt: "2 hours ago",
    complaintText:
      "The digital portal for the Grade 9 Science assignments seems to be malfunctioning. My son cannot upload his final lab report, and the deadline is tonight. We need an extension or a manual upload option.",
    status: "unanswered",
    files: [],
  },
  {
    id: "cmp-1002",
    submitterName: "Prof. Robert Miller",
    submitterRole: "Faculty • Department of Humanities",
    avatarUrl: "",
    priority: "general",
    receivedAt: "5 hours ago",
    complaintText:
      "The attendance tracking module for the hybrid lecture sessions is not syncing correctly with the mobile app. Several students were marked absent despite being physically present.",
    status: "unanswered",
    files: [],
  },
  {
    id: "cmp-1003",
    submitterName: "Michael Lee",
    submitterRole: "Guardian • Student ID: #SR-4412",
    priority: "general",
    receivedAt: "Oct 20, 2023",
    complaintText: "The online payment portal is not reflecting the scholarship discount for Semester 2.",
    status: "answered",
    adminResponse:
      "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
    answeredAt: "Oct 24, 2023 • 10:15 AM",
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
    id: "cmp-1004",
    submitterName: "Fatima Zayed",
    submitterRole: "Guardian • Student ID: #SR-7788",
    priority: "urgent",
    receivedAt: "Sep 10, 2023",
    complaintText: "Mathematics mid-term score shows 78, but the physical script has 87.",
    status: "answered",
    adminResponse:
      "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
    answeredAt: "Sep 12, 2023 • 02:45 PM",
    files: [],
  },
];

export const useAdminComplaintsStore = create<AdminComplaintsState>(set => ({
  summary: MOCK_SUMMARY,
  rows: MOCK_ROWS,
  searchQuery: "",
  activeTab: "unanswered",
  draftResponses: {},
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
  answerComplaint: (id, options) => {
    logger.info("Complaint answered", { id, sendEmail: options.sendEmail });
    set(state => {
      const draft = state.draftResponses[id] ?? "";
      const now = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      return {
        rows: state.rows.map(row =>
          row.id === id
            ? {
                ...row,
                status: "answered" as const,
                adminResponse: draft,
                answeredAt: now,
              }
            : row
        ),
        summary: {
          ...state.summary,
          unanswered: Math.max(state.summary.unanswered - 1, 0),
          answered: state.summary.answered + 1,
        },
        draftResponses: Object.fromEntries(
          Object.entries(state.draftResponses).filter(([key]) => key !== id)
        ),
      };
    });
  },
}));
```

---

### 7. Update `mockParentComplaintsStore.ts`

Update `frontend/stores/mockParentComplaintsStore.ts` to re-import types from the canonical type file.

```typescript
import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type {
  ParentComplaintRecord,
  ParentStudentOption,
} from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";
import type { ComplaintFormData } from "@/frontend/views/dashboard/complaints/schemas/complaintFormSchema";

export type { ParentComplaintRecord, ParentStudentOption };

interface ParentComplaintsState {
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly hasOlderRecords: boolean;
  readonly selectedFiles: readonly File[];
  readonly fileValidationErrors: readonly string[];
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  submitComplaint: (data: ComplaintFormData) => void;
  loadOlderRecords: () => void;
  setFiles: (files: readonly File[]) => void;
  removeFile: (index: number) => void;
}

const MOCK_STUDENT_OPTIONS: ParentStudentOption[] = [
  { id: "stu-zaid", label: "Zaid Ahmad (Grade 4-B)" },
  { id: "stu-ayesha", label: "Ayesha Ahmad (Grade 1-A)" },
];

const MOCK_RECORDS: ParentComplaintRecord[] = [
  {
    id: "rec-1001",
    regarding: "Tuition Fee Processing",
    summary: "The online payment portal is not reflecting the scholarship discount for Semester 2.",
    status: "resolved",
    adminResponse: {
      text: "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
      answeredAt: "Oct 24, 2023 • 10:15 AM",
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
    id: "rec-1002",
    regarding: "Transportation Service",
    summary: "Bus #42 was delayed by 30 minutes this morning without notification.",
    status: "pending",
    files: [],
  },
  {
    id: "rec-1003",
    regarding: "Grade Discrepancy",
    summary: "Mathematics mid-term score shows 78, but the physical script has 87.",
    status: "resolved",
    adminResponse: {
      text: "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
      answeredAt: "Sep 12, 2023 • 02:45 PM",
    },
    files: [],
  },
];

const OLDER_RECORDS: ParentComplaintRecord[] = [
  {
    id: "rec-1004",
    regarding: "Class Schedule Change",
    summary: "The updated timetable for Grade 4-B was not reflected in the parent portal.",
    status: "resolved",
    adminResponse: {
      text: "The schedule has been synchronized. Please log out and back in to see the updated timetable.",
      answeredAt: "Aug 5, 2023 • 09:30 AM",
    },
    files: [],
  },
];

export const useParentComplaintsStore = create<ParentComplaintsState>(set => ({
  studentOptions: MOCK_STUDENT_OPTIONS,
  records: MOCK_RECORDS,
  isSubmitting: false,
  showSuccess: false,
  hasOlderRecords: true,
  selectedFiles: [],
  fileValidationErrors: [],
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
  setShowSuccess: value => {
    set({ showSuccess: value });
  },
  resetSuccess: () => {
    set({ showSuccess: false });
  },
  submitComplaint: data => {
    logger.info("Parent complaint submitted", { data });
    const studentLabel =
      MOCK_STUDENT_OPTIONS.find(option => option.id === data.studentId)?.label ?? "Student";

    const newRecord: ParentComplaintRecord = {
      id: `rec-${Date.now()}`,
      regarding: `Regarding: ${studentLabel}`,
      summary: data.complaintDetails,
      status: "pending",
      files: [],
    };

    set(state => ({
      records: [newRecord, ...state.records],
      showSuccess: true,
      selectedFiles: [],
      fileValidationErrors: [],
    }));
  },
  loadOlderRecords: () => {
    set(state => ({
      records: [...state.records, ...OLDER_RECORDS],
      hasOlderRecords: false,
    }));
  },
  setFiles: files => {
    set({ selectedFiles: files, fileValidationErrors: [] });
  },
  removeFile: index => {
    set(state => ({
      selectedFiles: state.selectedFiles.filter((_, i) => i !== index),
    }));
  },
}));
```

---

### 8. Update Component Imports

Update all component files that currently import types from mock stores to import from the canonical type files instead.

#### Pattern for Suggestion Components

**Before:**
```typescript
import type { AdminSuggestionRow, SuggestionTab } from "@/frontend/stores/mockAdminSuggestionsStore";
```

**After:**
```typescript
import type { AdminSuggestionRow, SuggestionTab } from "@/frontend/views/dashboard/suggestions/types/suggestionsViewTypes";
```

#### Pattern for Complaint Components

**Before:**
```typescript
import type { AdminComplaintRow, ComplaintTab } from "@/frontend/stores/mockAdminComplaintsStore";
```

**After:**
```typescript
import type { AdminComplaintRow, ComplaintTab } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";
```

#### Files to Update

For each file listed below, locate the import statement that references a mock store for types and replace it with the canonical type file import:

1. `frontend/views/dashboard/suggestions/AdminSuggestionsContainer.tsx`
2. `frontend/views/dashboard/suggestions/AdminSuggestionsDesktopView.tsx`
3. `frontend/views/dashboard/suggestions/AdminSuggestionsMobileView.tsx`
4. `frontend/views/dashboard/suggestions/AdminSuggestionsView.tsx`
5. `frontend/views/dashboard/suggestions/ParentSuggestionsContainer.tsx`
6. `frontend/views/dashboard/suggestions/ParentSuggestionsDesktopView.tsx`
7. `frontend/views/dashboard/suggestions/ParentSuggestionsMobileView.tsx`
8. `frontend/views/dashboard/suggestions/ParentSuggestionsView.tsx`
9. `frontend/views/dashboard/complaints/AdminComplaintsContainer.tsx`
10. `frontend/views/dashboard/complaints/AdminComplaintsDesktopView.tsx`
11. `frontend/views/dashboard/complaints/AdminComplaintsMobileView.tsx`
12. `frontend/views/dashboard/complaints/AdminComplaintsView.tsx`
13. `frontend/views/dashboard/complaints/ParentComplaintsContainer.tsx`
14. `frontend/views/dashboard/complaints/ParentComplaintsDesktopView.tsx`
15. `frontend/views/dashboard/complaints/ParentComplaintsMobileView.tsx`
16. `frontend/views/dashboard/complaints/ParentComplaintsView.tsx`

For each file, apply the following import migration:

**Suggestion components** — replace:
```typescript
import type { ... } from "@/frontend/stores/mockAdminSuggestionsStore";
```
with:
```typescript
import type { ... } from "@/frontend/views/dashboard/suggestions/types/suggestionsViewTypes";
```

**Parent suggestion components** — replace:
```typescript
import type { ... } from "@/frontend/stores/mockParentSuggestionsStore";
```
with:
```typescript
import type { ... } from "@/frontend/views/dashboard/suggestions/types/suggestionsViewTypes";
```

**Admin complaint components** — replace:
```typescript
import type { ... } from "@/frontend/stores/mockAdminComplaintsStore";
```
with:
```typescript
import type { ... } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";
```

**Parent complaint components** — replace:
```typescript
import type { ... } from "@/frontend/stores/mockParentComplaintsStore";
```
with:
```typescript
import type { ... } from "@/frontend/views/dashboard/complaints/types/complaintsViewTypes";
```

---

## Type Migration Rules

1. **Check generated types FIRST** — Before defining any type, search `frontend/graphql/generated/gql/graphql-types.ts` for the generated equivalent.
2. **Re-export generated types** — If a generated type exists, re-export it with a type alias (e.g., `export type SuggestionStatusType = GeneratedSuggestionStatus`).
3. **Define UI-specific types only when needed** — Only define types that have no generated equivalent (e.g., view props, UI state types, summary types).
4. **No `any`, `unknown`, casting, or mapping** — All types must be strictly typed. No intermediate mapping functions.
5. **Preserve backward compatibility** — Mock stores re-export types so existing Storybook stories continue to work during migration.
6. **Backend canonical types flow through** — Frontend `types.ts` files re-export generated GraphQL types (which originate from backend canonical types). No duplication of backend entity structures.
7. **Update components to use generated GQL types and enums** — When updating component imports, replace any locally-defined types, inline enums, or string literals with imports from generated GraphQL types or view-level `.types.ts` files. Components must use the same types that stores use.
8. **Ensure stores import types from `.types.ts` files** — If any store file defines types locally, those types are moved to `.types.ts` files and re-imported. Stores MUST NOT define entity types.

---

## Test Execution Requirements

Run the full TypeScript and lint checks after completing all file modifications:

```bash
bun tsgo
```

```bash
bun lint
```

Both commands must pass with zero errors.

---

## Success Criteria / Check Progress Points

- [ ] `SuggestionStatusType` re-exported from generated `SuggestionStatus` enum in `suggestionsViewTypes.ts`
- [ ] `AdminSuggestionRow` extended with `duplicateOfId`, `adminResponse`, `reviewedByName`, `reviewedAt` fields (all nullable)
- [ ] `SuggestionSearchResult` re-exported from generated type in `suggestionsViewTypes.ts`
- [ ] `ParentSuggestionRecord` defined with `id`, `status`, `body`, `createdAt`, `adminResponse`, `duplicateOf` fields
- [ ] `ComplaintFileType` re-exported from generated `ComplaintFile` type in `complaintsViewTypes.ts`
- [ ] `AdminComplaintRow` extended with `files: readonly ComplaintFileType[]` field
- [ ] `ParentComplaintRecord` extended with `files: readonly ComplaintFileType[]` field
- [ ] `ParentComplaintsViewProps` extended with `selectedFiles`, `fileValidationErrors`, `onFilesSelected`, `onRemoveFile`
- [ ] `AdminSuggestionsViewProps` extended with `onRespond`, `onMarkDuplicate`, `onDelete`, `onSearchSuggestions`
- [ ] `mockAdminSuggestionsStore.ts` re-imports types from `suggestionsViewTypes.ts`
- [ ] `mockParentSuggestionsStore.ts` re-imports types from `suggestionsViewTypes.ts`
- [ ] `mockAdminComplaintsStore.ts` re-imports types from `complaintsViewTypes.ts`
- [ ] `mockParentComplaintsStore.ts` re-imports types from `complaintsViewTypes.ts`
- [ ] All ~16 component files updated to import from canonical type files
- [ ] **All component files updated to use generated GQL types and enums** — no locally-defined types, inline enums, or string literals remain
- [ ] **All store files import types from `.types.ts` files** — no local type definitions in stores
- [ ] No `any`, `unknown`, or casting in any type definition
- [ ] No circular import dependencies
- [ ] All mock store mock data updated to match new type shapes (nullable fields included)
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

- The `SuggestionStatus` enum in generated types uses PascalCase values (`PENDING`, `REVIEWED`, `DUPLICATE`). The mock store previously used lowercase (`"pending"`, `"reviewed"`). All mock data must be updated to use the enum values.
- The `ComplaintFileType` includes `__typename: "ComplaintFile"` for Apollo cache normalization.
- The `ParentSuggestionRecord.duplicateOf` field is a nested object (not just an ID) to support displaying duplicate target info in the parent history view.
- Mock stores retain their mock data arrays for backward compatibility with Storybook stories that have not yet been migrated to `MockedProvider`.
- The `AdminSuggestionRow` type adds nullable fields (`duplicateOfId`, `adminResponse`, `reviewedByName`, `reviewedAt`) to support the new admin review workflow UI.
