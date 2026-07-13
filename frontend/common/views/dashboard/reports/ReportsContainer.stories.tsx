import type { Meta, StoryObj } from "@storybook/react";
import { AccountStatus, AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { ReportsView } from "@/frontend/common/views/dashboard/reports/reportsView";
import type { ReportLedgerRow } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

const mockLabels = {
  pageTitle: "Attendance Reports",
  pageSubtitle: "View teacher and student attendance metrics",
  filtersTitle: "Report Filters",
  exportCsv: "Export CSV",
  printReport: "Print Report",
  filtersLabels: {
    fromDate: "From Date",
    toDate: "To Date",
    teacher: "Teacher",
    allTeachers: "All Teachers",
    reportType: "Group By",
    submit: "Generate Report",
    reportTypes: {
      byTeacher: "Teacher",
      byStudent: "Student",
      byDate: "Date",
    },
  },
  tableLabels: {
    name: "Group",
    taken: "Taken",
    absent: "Absent",
    leave: "Leave",
    pending: "Pending",
    hours: "Hours",
    paid: "Paid",
    noEntries: "No report data found.",
  },
  summaryLabels: {
    engagementRate: "Engagement Rate",
    engagementGrowth: "Growth",
    increase: "Increase",
    financialDistribution: "Currency Split",
    financialSubtitle: "Distribution of payouts",
  },
  totalsLabel: "Totals",
  ledgerTitle: "Attendance Ledger",
  ledgerLabels: {
    studentLabel: "Student",
    paid: "Paid",
    statusLabels: {
      active: "Active",
      on_break: "On Break",
    },
    taken: "Taken",
    absent: "Absent",
    leave: "Leave",
    pending: "Pending",
    hours: "Hours",
  },
};

const mockTeachers = [
  { id: "teacher-1", name: "John Doe" },
  { id: "teacher-2", name: "Jane Smith" },
];

const mockRows: readonly ReportLedgerRow[] = [
  {
    id: "2024-05-01",
    entityId: null,
    name: "May 1, 2024",
    studentName: "",
    avatarInitials: "M1",
    status: "active",
    taken: 15,
    absent: 2,
    leave: 1,
    pending: 0,
    hours: "12:30",
    paidAmounts: [{ id: "paid-1", amount: "1500", currency: CurrencyCode.Egp, displayAmount: null }],
  },
  {
    id: "2024-05-02",
    entityId: null,
    name: "May 2, 2024",
    studentName: "",
    avatarInitials: "M2",
    status: "active",
    taken: 10,
    absent: 0,
    leave: 0,
    pending: 1,
    hours: "10:00",
    paidAmounts: [{ id: "paid-2", amount: "1000", currency: CurrencyCode.Egp, displayAmount: null }],
  },
];

const mockSummary = {
  engagementRate: 89.3,
  engagementGrowth: 12.4,
  currencyDistribution: [{ currency: CurrencyCode.Egp, amount: 2500, percent: 100, label: "Egyptian Pound" }],
  totalHours: "22:30",
} as const;

const baseArgs = {
  labels: mockLabels,
  teachers: mockTeachers,
  rows: mockRows,
  summary: mockSummary,
  canGenerate: true,
  loading: false,
  onSubmit: () => {
    logger.info("onSubmit clicked");
  },
  onExportCsv: () => {
    logger.info("onExportCsv clicked");
  },
  onPrintReport: () => {
    logger.info("onPrintReport clicked");
  },
};

const meta: Meta<typeof ReportsView> = {
  title: "Views/dashboard/reports/ReportsView",
  component: ReportsView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ReportsView>;

function seedPermissions(perms: AppPermission[]) {
  useUserStore.setState({
    permissions: perms,
    user: {
      id: "mock-id",
      name: "Mock User",
      role: "Mock Role",
      avatarUrl: "",
      permissions: perms,
      notificationCount: 0,
      teacherId: null,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      email: "mock@example.com",
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
      __typename: "User",
    },
  });
}

export const AdminFullAccess: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      seedPermissions([AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials]);
      return <Story />;
    },
  ],
};

export const RestrictedAccess: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      seedPermissions([AppPermission.ReportGenerateCustom]);
      return <Story />;
    },
  ],
};

export const EmptyData: Story = {
  args: {
    ...baseArgs,
    rows: [],
    summary: {
      engagementRate: 0,
      engagementGrowth: 0,
      currencyDistribution: [],
      totalHours: "0:00",
    },
  },
  decorators: [
    Story => {
      seedPermissions([AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials]);
      return <Story />;
    },
  ],
};

export const ApiError: Story = {
  args: {
    ...baseArgs,
    rows: [],
    summary: {
      engagementRate: 0,
      engagementGrowth: 0,
      currencyDistribution: [],
      totalHours: "0:00",
    },
  },
  decorators: [
    Story => {
      seedPermissions([AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials]);
      return <Story />;
    },
  ],
};

export const Loading: Story = {
  args: {
    ...baseArgs,
    loading: true,
  },
  decorators: [
    Story => {
      seedPermissions([AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials]);
      return <Story />;
    },
  ],
};
