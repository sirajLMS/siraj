import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ReportsView } from "./ReportsView";
import type { ReportType } from "./types/reportsTypes";

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
    paidEgp: "Paid (EGP)",
    paidUsd: "Paid (USD)",
    noEntries: "No report data found.",
  },
  summaryLabels: {
    engagementRate: "Engagement Rate",
    engagementGrowth: "Growth",
    increase: "Increase",
    financialDistribution: "Currency Split",
    financialSubtitle: "Distribution of payouts",
    egpLabel: "EGP",
    usdLabel: "USD",
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

const mockRows = [
  {
    id: "2024-05-01",
    name: "May 1, 2024",
    studentName: "",
    avatarInitials: "M1",
    status: "active" as const,
    taken: 15,
    absent: 2,
    leave: 1,
    pending: 0,
    hours: "12:30",
    paidEgp: 1500,
    paidUsd: 0,
  },
  {
    id: "2024-05-02",
    name: "May 2, 2024",
    studentName: "",
    avatarInitials: "M2",
    status: "active" as const,
    taken: 10,
    absent: 0,
    leave: 0,
    pending: 1,
    hours: "10:00",
    paidEgp: 1000,
    paidUsd: 0,
  },
];

const mockSummary = {
  engagementRate: 89.3,
  engagementGrowth: 12.4,
  egpPercent: 100,
  usdPercent: 0,
  totalHours: "22:30",
  totalEgp: 2500,
  totalUsd: 0,
};

const baseArgs = {
  labels: mockLabels,
  fromDate: "2023-08-01",
  toDate: "2023-08-31",
  teacherId: "",
  reportType: "by_teacher" as const,
  teachers: mockTeachers,
  rows: mockRows,
  summary: mockSummary,
  canGenerate: true,
  onFromDateChange: (date: string) => {
    logger.info("onFromDateChange:", date);
  },
  onToDateChange: (date: string) => {
    logger.info("onToDateChange:", date);
  },
  onTeacherChange: (teacherId: string) => {
    logger.info("onTeacherChange:", teacherId);
  },
  onReportTypeChange: (type: ReportType) => {
    logger.info("onReportTypeChange:", type);
  },
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

export const AdminFullAccess: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      const perms = [AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          __typename: "User",
        },
      });
      useMockUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          __typename: "User",
        },
      });
      return <Story />;
    },
  ],
};

export const RestrictedAccess: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      const perms = [AppPermission.ReportGenerateCustom];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          __typename: "User",
        },
      });
      useMockUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          __typename: "User",
        },
      });
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
      egpPercent: 100,
      usdPercent: 0,
      totalHours: "0:00",
      totalEgp: 0,
      totalUsd: 0,
    },
  },
  decorators: [
    Story => {
      const perms = [AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          __typename: "User",
        },
      });
      useMockUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          __typename: "User",
        },
      });
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
      egpPercent: 100,
      usdPercent: 0,
      totalHours: "0:00",
      totalEgp: 0,
      totalUsd: 0,
    },
  },
  decorators: [
    Story => {
      const perms = [AppPermission.ReportGenerateCustom, AppPermission.ReportViewFinancials];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          __typename: "User",
        },
      });
      useMockUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          __typename: "User",
        },
      });
      return <Story />;
    },
  ],
};
