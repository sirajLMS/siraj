import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountStatus, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { parentAssociatedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ParentQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/ParentQuotaView";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

const mockLabels: StudentQuotaLabels = {
  pageTitle: "Children Quota",
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

const mockChildren = [
  {
    __typename: "AssociatedStudent" as const,
    id: "stu-001",
    name: "Ahmed Hassan",
    avatarUrl: null,
    status: "ACTIVE",
    primaryTeacherId: "teacher-001",
    teacherUserId: "teacher-001",
    teacherName: "Ustadh Yusuf",
    hoursPerWeek: "4",
    classesRemaining: 12,
    classesTotal: 20,
    language: "ARABIC",
    gender: "MALE",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
  {
    __typename: "AssociatedStudent" as const,
    id: "stu-002",
    name: "Fatima Hassan",
    avatarUrl: null,
    status: "ACTIVE",
    primaryTeacherId: "teacher-002",
    teacherUserId: "teacher-002",
    teacherName: "Ustadha Sara",
    hoursPerWeek: "2",
    classesRemaining: 8,
    classesTotal: 10,
    language: "ARABIC",
    gender: "FEMALE",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

const mockChildQuotas = [
  {
    __typename: "Quota" as const,
    id: "child-quota-001",
    studentId: "stu-001",
    name: "Hifz Package — 20 Classes",
    kind: "PACKAGE",
    totalClasses: 20,
    remaining: 12,
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

const mockLedgerRows = [
  {
    __typename: "QuotaLedger" as const,
    id: "ledger-001",
    quotaId: "child-quota-001",
    studentId: "stu-001",
    recurringScheduleId: null,
    classInstanceId: null,
    delta: 20,
    reason: "GRANT",
    reasonNote: "Initial purchase",
    actorUserId: "admin-001",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

const defaultMocks = [
  {
    request: {
      query: parentAssociatedStudentsQueryDocument,
      variables: { parentId: "parent-001" },
    },
    result: { data: { parentAssociatedStudents: mockChildren } },
  },
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    result: { data: { studentQuotas: mockChildQuotas } },
  },
  {
    request: {
      query: quotaLedgerQueryDocument,
      variables: { quotaId: "child-quota-001", pagination: ledgerPagination },
    },
    result: {
      data: {
        quotaLedger: {
          __typename: "QuotaPaginatedResult" as const,
          rows: mockLedgerRows,
          totalCount: 1,
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: parentAssociatedStudentsQueryDocument,
      variables: { parentId: "parent-001" },
    },
    result: { data: { parentAssociatedStudents: [] } },
  },
];

function setParentUser() {
  useUserStore.setState({
    role: "PARENT",
    permissions: [],
    displayCurrency: CurrencyCode.Usd,
    user: {
      id: "parent-001",
      name: "Hassan Parent",
      role: "PARENT",
      avatarUrl: null,
      permissions: [],
      notificationCount: 0,
      teacherId: null,
      parentId: "parent-001",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-06-01T00:00:00.000Z",
      emailVerifiedAt: null,
      email: null,
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
      __typename: "User",
    },
  });
}

const meta = {
  title: "Views/dashboard/students/quota/audience/ParentQuotaView",
  component: ParentQuotaView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    Story => {
      setParentUser();
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
} satisfies Meta<typeof ParentQuotaView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { t: mockLabels },
};

export const Loading: Story = {
  args: { t: mockLabels },
  decorators: [
    Story => {
      setParentUser();
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
      setParentUser();
      return (
        <MockedProvider mocks={emptyMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
