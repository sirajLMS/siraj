import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountStatus, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { teacherAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { TeacherQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

const mockLabels: StudentQuotaLabels = {
  pageTitle: "Student Quota",
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

const mockStudentRows = [
  {
    __typename: "TeacherAssignedStudent" as const,
    id: "stu-001",
    name: "Ahmed Hassan",
    status: "ACTIVE",
    hoursPerWeek: 4,
    classesRemaining: 12,
    classesTotal: 20,
  },
  {
    __typename: "TeacherAssignedStudent" as const,
    id: "stu-002",
    name: "Khalid Omar",
    status: "ACTIVE",
    hoursPerWeek: 2,
    classesRemaining: 0,
    classesTotal: 10,
  },
];

const defaultMocks = [
  {
    request: { query: teacherAssignedStudentsQueryDocument },
    result: {
      data: {
        teacherAssignedStudents: {
          __typename: "TeacherAssignedStudentsResult" as const,
          id: "teacher-assigned-001",
          totalCount: 2,
          rows: mockStudentRows,
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: { query: teacherAssignedStudentsQueryDocument },
    result: {
      data: {
        teacherAssignedStudents: {
          __typename: "TeacherAssignedStudentsResult" as const,
          id: "teacher-assigned-empty",
          totalCount: 0,
          rows: [],
        },
      },
    },
  },
];

function setTeacherUser() {
  useUserStore.setState({
    role: "TEACHER",
    permissions: [],
    displayCurrency: CurrencyCode.Usd,
    user: {
      id: "teacher-001",
      name: "Ustadh Yusuf",
      role: "TEACHER",
      avatarUrl: null,
      permissions: [],
      notificationCount: 0,
      teacherId: "teacher-001",
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
  title: "Views/dashboard/students/quota/audience/TeacherQuotaView",
  component: TeacherQuotaView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    Story => {
      setTeacherUser();
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
} satisfies Meta<typeof TeacherQuotaView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { t: mockLabels },
};

export const Empty: Story = {
  args: { t: mockLabels },
  decorators: [
    Story => {
      setTeacherUser();
      return (
        <MockedProvider mocks={emptyMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
