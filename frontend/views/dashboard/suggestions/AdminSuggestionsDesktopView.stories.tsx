import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { AdminSuggestionsDesktopView } from "./AdminSuggestionsDesktopView";
import type { AdminSuggestionRow, AdminSuggestionsSummary, SuggestionStatus } from "./types/suggestions.types";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";

const MOCK_ADMIN_SUGGESTION_ROWS: readonly AdminSuggestionRow[] = [
  {
    id: "sug-1001",
    parentName: "Sarah Jenkins",
    suggestionPreview: "It would be great to have a weekend coding club for Grade 5-8 students...",
    status: "PENDING" as SuggestionStatus,
    submittedAt: "2 hours ago",
  },
  {
    id: "sug-1002",
    parentName: "David Miller",
    suggestionPreview: "Consider adding organic options to the cafeteria lunch menu.",
    status: "REVIEWED" as SuggestionStatus,
    submittedAt: "1 day ago",
  },
];

const MOCK_ADMIN_SUMMARY: AdminSuggestionsSummary = {
  pending: 1,
  reviewed: 1,
  avgResponseHours: "12.5 Hours",
};

const ADMIN_PERMISSIONS = [AppPermission.ComplaintsRespond];

const mockActions = {
  onSearchChange: (query: string) => {
    logger.info("onSearchChange:", query);
  },
  onTabChange: (tab: SuggestionStatus) => {
    logger.info("onTabChange:", tab);
  },
  onMarkReviewed: (id: string) => {
    logger.info("onMarkReviewed:", id);
  },
};

interface AdminSuggestionsDesktopStoryProps {
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  readonly canManage: boolean;
}

function AdminSuggestionsDesktopStoryRenderer({
  summary,
  rows,
  searchQuery,
  activeTab,
  canManage,
}: Readonly<AdminSuggestionsDesktopStoryProps>) {
  const t = useTranslations("dashboard.suggestions");
  const labels = buildSuggestionsLabels(t).admin;

  return (
    <AdminSuggestionsDesktopView
      labels={labels}
      summary={summary}
      rows={rows}
      searchQuery={searchQuery}
      activeTab={activeTab}
      canManage={canManage}
      {...mockActions}
    />
  );
}

const meta: Meta<typeof AdminSuggestionsDesktopStoryRenderer> = {
  title: "Views/dashboard/suggestions/AdminSuggestionsDesktopView",
  component: AdminSuggestionsDesktopStoryRenderer,
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
type Story = StoryObj<typeof AdminSuggestionsDesktopStoryRenderer>;

export const Default: Story = {
  args: {
    summary: MOCK_ADMIN_SUMMARY,
    rows: MOCK_ADMIN_SUGGESTION_ROWS,
    searchQuery: "",
    activeTab: "PENDING" as SuggestionStatus,
    canManage: true,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    rows: [],
    summary: { pending: 0, reviewed: 0, avgResponseHours: "0.0 Hours" },
  },
};
