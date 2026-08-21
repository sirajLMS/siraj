import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountStatus, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { StudentQuotaAudienceView } from "@/frontend/common/views/dashboard/students/quota/audience/StudentQuotaView";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

const mockLabels: StudentQuotaLabels = {
  pageTitle: "My Quota",
  common: { system: "System", notSet: "Not Set" },
  breadcrumbs: { students: "Students", adjustQuota: "Adjust Quota" },
  sections: { studentInfo: "Student Info", courseDetails: "Course Details" },
  fields: {
    studentName: "Student Name",
    studentNamePlaceholder: "Enter name",
    dateOfBirth: "Date of Birth",
    language: "Language",
    arabic: "Arabic",
    english: "English",
    gender: "Gender",
    male: "Male",
    female: "Female",
    teacher: "Teacher",
    loadingTeachers: "Loading teachers…",
    totalClasses: "Total Classes",
    classesLeft: "Classes Left",
    overrideActive: "Override Active",
    overrideNotice: "Manual override in effect",
  },
  actions: {
    save: "Save",
    cancel: "Cancel",
    saving: "Saving…",
    saved: "Saved",
    saveSuccess: "Changes saved successfully",
    lastEditedAt: (time: string) => `Last edited ${time}`,
  },
  info: {
    quotaTitle: "Quota Information",
    quotaDesc: "Manage student class quota",
    publicTitle: "Public Profile",
    publicDesc: "Visible to parents",
  },
  validation: {
    nameRequired: "Name is required",
    dobRequired: "Date of birth is required",
    languageRequired: "Language is required",
    genderRequired: "Gender is required",
    teacherRequired: "Teacher is required",
    totalClassesRequired: "Total classes is required",
    totalClassesMin: "Must be at least 1",
    classesLeftRequired: "Classes left is required",
    classesLeftMin: "Must be at least 0",
  },
  errors: { invalidId: "Invalid student ID" },
  audience: {
    studentTitle: "My Quota Balance",
    parentTitle: "Children Quota",
    teacherTitle: "Student Quota Overview",
    supervisorTitle: "All Quotas",
    activeQuotas: "Active Quotas",
    remainingCredits: "Remaining Credits",
    onDemandPending: "On-Demand Pending",
    noChildren: "No children found",
    quotaSummary: "Quota Summary",
    classQuotaUsage: "Class Quota Usage",
    onDemandPendingQueue: "On-Demand Queue",
    classAnalytics: "Class Analytics",
    lowBalanceAlerts: "Low Balance Alerts",
    conflictHeld: "Conflict Held",
    analyticsOverview: "Analytics Overview",
    noData: "No data available",
    noQuotaAssigned: "No quota assigned",
    quotaExhausted: "Quota exhausted — no classes remaining",
    eligibleForNextClass: "Eligible for next class",
    notEligibleForNextClass: "Not eligible — no classes remaining",
    expiryWarning: (days: number) => `Expiring in ${days} days`,
    remainingOfTotal: (remaining: number, total: number) => `${remaining} / ${total}`,
    validPeriod: "Valid Period",
    recentLedgerEntries: "Recent Ledger Entries",
    noLedgerEntries: "No ledger entries",
    loadingData: "Loading data…",
    selectChildPrompt: "Please select a child",
    name: "Name",
    kind: "Kind",
    remaining: "Remaining",
    totalClasses: "Total Classes",
    status: "Status",
    validFrom: "Valid From",
    validUntil: "Valid Until",
    delta: "Delta",
    reason: "Reason",
    ledgerDate: "Date",
    createdAt: "Created At",
    newQuota: "New Quota",
    editQuota: "Edit",
    deleteQuota: "Delete",
    statuses: { ACTIVE: "Active", EXPIRED: "Expired", ARCHIVED: "Archived" },
    kinds: { PACKAGE: "Package", PERIODIC: "Periodic" },
    ledgerReasons: {
      ADJUST: "Adjustment",
      EXPIRE: "Expiration",
      GRANT: "Grant",
      REDEEM: "Redemption",
      RELEASE: "Release",
      RESERVE: "Reserve",
    },
  },
  quotaCount: (count: number) => (count === 1 ? "1 quota" : `${count} quotas`),
};

const ledgerPagination = {
  after: null,
  before: null,
  first: 5,
  last: null,
  maxCount: null,
  page: null,
  skip: 0,
};

const mockQuotas = [
  {
    __typename: "Quota" as const,
    id: "stu-quota-001",
    studentId: "stu-001",
    name: "Hifz Package — 20 Classes",
    kind: "PACKAGE",
    totalClasses: 20,
    remaining: 14,
    reservedClasses: 0,
    validFrom: "2025-01-01T00:00:00.000Z",
    validUntil: "2026-01-01T00:00:00.000Z",
    status: "ACTIVE",
    periodType: null,
    periodDays: null,
    priority: 10,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

const exhaustedQuotas = [
  {
    __typename: "Quota" as const,
    id: "stu-quota-exh-001",
    studentId: "stu-001",
    name: "Exhausted Package — 10 Classes",
    kind: "PACKAGE",
    totalClasses: 10,
    remaining: 0,
    reservedClasses: 0,
    validFrom: "2025-01-01T00:00:00.000Z",
    validUntil: "2026-01-01T00:00:00.000Z",
    status: "ACTIVE",
    periodType: null,
    periodDays: null,
    priority: 5,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

const mockLedgerRows = [
  {
    __typename: "QuotaLedger" as const,
    id: "ledger-001",
    quotaId: "stu-quota-001",
    studentId: "stu-001",
    recurringScheduleId: null,
    classInstanceId: null,
    delta: 20,
    reason: "GRANT",
    reasonNote: "Initial purchase",
    actorUserId: "admin-001",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    __typename: "QuotaLedger" as const,
    id: "ledger-002",
    quotaId: "stu-quota-001",
    studentId: "stu-001",
    recurringScheduleId: "schedule-001",
    classInstanceId: "class-001",
    delta: -1,
    reason: "REDEEM",
    reasonNote: "Class redeemed",
    actorUserId: "teacher-001",
    createdAt: "2025-06-01T00:00:00.000Z",
  },
];

const defaultMocks = [
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    result: { data: { studentQuotas: mockQuotas } },
  },
  {
    request: {
      query: quotaLedgerQueryDocument,
      variables: { quotaId: "stu-quota-001", pagination: ledgerPagination },
    },
    result: {
      data: {
        quotaLedger: {
          __typename: "QuotaPaginatedResult" as const,
          rows: mockLedgerRows,
          totalCount: 2,
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    result: { data: { studentQuotas: [] } },
  },
];

const exhaustedMocks = [
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    result: { data: { studentQuotas: exhaustedQuotas } },
  },
  {
    request: {
      query: quotaLedgerQueryDocument,
      variables: { quotaId: "stu-quota-exh-001", pagination: ledgerPagination },
    },
    result: {
      data: {
        quotaLedger: {
          __typename: "QuotaPaginatedResult" as const,
          rows: [],
          totalCount: 0,
        },
      },
    },
  },
];

const errorMocks = [
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    error: new Error("Failed to load quotas"),
  },
];

function setStudentUser() {
  useUserStore.setState({
    role: "STUDENT",
    permissions: [],
    displayCurrency: CurrencyCode.Usd,
    user: {
      id: "stu-001",
      name: "Test Student",
      role: "STUDENT",
      avatarUrl: null,
      permissions: [],
      notificationCount: 0,
      teacherId: null,
      parentId: null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-06-01T00:00:00.000Z",
      emailVerifiedAt: null,
      email: null,
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
    },
  });
}

const meta = {
  title: "Views/dashboard/students/quota/audience/StudentQuotaView",
  component: StudentQuotaAudienceView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    Story => {
      setStudentUser();
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
} satisfies Meta<typeof StudentQuotaAudienceView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { t: mockLabels },
};

export const Loading: Story = {
  args: { t: mockLabels },
  decorators: [
    Story => {
      setStudentUser();
      return (
        <MockedProvider mocks={[]}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const Empty: Story = {
  args: { t: mockLabels },
  decorators: [
    Story => {
      setStudentUser();
      return (
        <MockedProvider mocks={emptyMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const ErrorState: Story = {
  args: { t: mockLabels },
  decorators: [
    Story => {
      setStudentUser();
      return (
        <MockedProvider mocks={errorMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const Exhausted: Story = {
  args: { t: mockLabels },
  decorators: [
    Story => {
      setStudentUser();
      return (
        <MockedProvider mocks={exhaustedMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
