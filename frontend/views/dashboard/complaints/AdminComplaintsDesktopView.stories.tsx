import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { AppPermission, ComplaintStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { AdminComplaintsDesktopView } from "./AdminComplaintsDesktopView";
import type { AdminComplaintRow, AdminComplaintsSummary, ComplaintTab } from "./types/complaints.types";
import { buildComplaintsLabels } from "./utils/buildComplaintsLabels";

const MOCK_ADMIN_COMPLAINT_ROWS: readonly AdminComplaintRow[] = [
  {
    id: "cmp-1001",
    submitterName: "Sarah Jenkins",
    submitterRole: "Guardian • Student ID: #SR-9021",
    avatarUrl: "",
    priority: "urgent" as const,
    receivedAt: "2 hours ago",
    complaintText: "The digital portal for the Grade 9 Science assignments seems to be malfunctioning...",
    status: ComplaintStatus.Unanswered,
  },
  {
    id: "cmp-1002",
    submitterName: "David Miller",
    submitterRole: "Guardian • Student ID: #DM-4820",
    avatarUrl: "",
    priority: "general" as const,
    receivedAt: "1 day ago",
    complaintText: "Could we get clarification on the school bus route changes for next week?",
    status: ComplaintStatus.Answered,
    adminResponse: "We have finalized the new routes and sent out a detailed map via email. Please check your inbox.",
    answeredAt: "Oct 24, 2023 • 10:15 AM",
  },
];

const MOCK_ADMIN_SUMMARY: AdminComplaintsSummary = {
  unanswered: 1,
  answered: 1,
  avgResolutionHours: "4.2 Hours",
};

const ADMIN_PERMISSIONS = [
  AppPermission.ComplaintsList,
  AppPermission.ComplaintsRespond,
  AppPermission.ComplaintsDelete,
];

const mockActions = {
  onSearchChange: (query: string) => {
    logger.info("onSearchChange:", query);
  },
  onTabChange: (tab: ComplaintTab) => {
    logger.info("onTabChange:", tab);
  },
  onDraftChange: (id: string, text: string) => {
    logger.info("onDraftChange:", id, text);
  },
  onAnswer: (id: string, options: { readonly sendEmail: boolean }) => {
    logger.info("onAnswer:", id, options);
  },
};

interface AdminComplaintsDesktopStoryProps {
  readonly summary: AdminComplaintsSummary;
  readonly rows: readonly AdminComplaintRow[];
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
}

function AdminComplaintsDesktopStoryRenderer({
  summary,
  rows,
  searchQuery,
  activeTab,
  draftResponses,
  canManage,
}: Readonly<AdminComplaintsDesktopStoryProps>) {
  const t = useTranslations("dashboard.complaints");
  const labels = buildComplaintsLabels(t).admin;

  return (
    <AdminComplaintsDesktopView
      labels={labels}
      summary={summary}
      rows={rows}
      searchQuery={searchQuery}
      activeTab={activeTab}
      draftResponses={draftResponses}
      canManage={canManage}
      {...mockActions}
    />
  );
}

const meta: Meta<typeof AdminComplaintsDesktopStoryRenderer> = {
  title: "Views/dashboard/complaints/AdminComplaintsDesktopView",
  component: AdminComplaintsDesktopStoryRenderer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      const mockUser = {
        id: "mock-admin-id",
        name: "Admin User",
        role: "Administrator",
        avatarUrl: "",
        permissions: ADMIN_PERMISSIONS,
        notificationCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerifiedAt: new Date().toISOString(),
        email: "admin@example.com",
        __typename: "User" as const,
      };
      useUserStore.setState({ permissions: ADMIN_PERMISSIONS, user: mockUser });
      useMockUserStore.setState({ permissions: ADMIN_PERMISSIONS, user: mockUser });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof AdminComplaintsDesktopStoryRenderer>;

export const Default: Story = {
  args: {
    summary: MOCK_ADMIN_SUMMARY,
    rows: MOCK_ADMIN_COMPLAINT_ROWS,
    searchQuery: "",
    activeTab: ComplaintStatus.Unanswered,
    draftResponses: {},
    canManage: true,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    rows: [],
    summary: { unanswered: 0, answered: 0, avgResolutionHours: "0.0 Hours" },
  },
};
