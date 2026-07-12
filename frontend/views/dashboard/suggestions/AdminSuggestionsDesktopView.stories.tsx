import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { AppPermission, SuggestionStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { logger } from "@/frontend/utils/logger";
import { createMockAdminDecorator } from "@/frontend/views/dashboard/components/createMockAdminDecorator";
import { AdminSuggestionsDesktopView } from "@/frontend/views/dashboard/suggestions/desktop/adminSuggestions.desktop";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
} from "@/frontend/views/dashboard/suggestions/types/suggestions.types";
import { buildSuggestionsLabels } from "@/frontend/views/dashboard/suggestions/utils/buildSuggestionsLabels";

const MOCK_ADMIN_SUGGESTION_ROWS: readonly AdminSuggestionRow[] = [
  {
    id: "sug-1001",
    parentId: "par-1001",
    parentUserId: "usr-par-1001",
    parentName: "Sarah Jenkins",
    suggestionPreview: "It would be great to have a weekend coding club for Grade 5-8 students...",
    status: SuggestionStatus.Pending,
    submittedAt: "2 hours ago",
    adminResponse: null,
    duplicateOfBody: null,
    duplicateOfSubmitterName: null,
    responseCount: null,
  },
  {
    id: "sug-1002",
    parentId: "par-1002",
    parentUserId: "usr-par-1002",
    parentName: "David Miller",
    suggestionPreview: "Consider adding organic options to the cafeteria lunch menu.",
    status: SuggestionStatus.Reviewed,
    submittedAt: "1 day ago",
    adminResponse: "Thank you for the suggestion. We are reviewing it.",
    duplicateOfBody: null,
    duplicateOfSubmitterName: null,
    responseCount: 1,
  },
  {
    id: "sug-1003",
    parentId: "par-1003",
    parentUserId: "usr-par-1003",
    parentName: "Fatima Ali",
    suggestionPreview: "Weekend coding club would be wonderful for the students.",
    status: SuggestionStatus.Duplicate,
    submittedAt: "3 hours ago",
    adminResponse: null,
    duplicateOfBody: "It would be great to have a weekend coding club for Grade 5-8 students...",
    duplicateOfSubmitterName: "Sarah Jenkins",
    responseCount: null,
  },
];

const MOCK_ADMIN_SUMMARY: AdminSuggestionsSummary = {
  pending: 1,
  reviewed: 1,
  duplicateCount: 1,
  avgResponseHours: "12.5 Hours",
};

const ADMIN_PERMISSIONS = [AppPermission.SuggestionsReview, AppPermission.SuggestionsDelete];

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
  onRespond: (id: string) => {
    logger.info("onRespond:", id);
  },
  onMarkDuplicate: (id: string) => {
    logger.info("onMarkDuplicate:", id);
  },
  onDelete: (id: string) => {
    logger.info("onDelete:", id);
  },
};

interface AdminSuggestionsDesktopStoryProps {
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  readonly canManage: boolean;
  readonly canDelete: boolean;
}

function AdminSuggestionsDesktopStoryRenderer({
  summary,
  rows,
  searchQuery,
  activeTab,
  canManage,
  canDelete,
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
      canDelete={canDelete}
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
  decorators: createMockAdminDecorator(ADMIN_PERMISSIONS),
};

export default meta;
type Story = StoryObj<typeof AdminSuggestionsDesktopStoryRenderer>;

export const Default: Story = {
  args: {
    summary: MOCK_ADMIN_SUMMARY,
    rows: MOCK_ADMIN_SUGGESTION_ROWS,
    searchQuery: "",
    activeTab: SuggestionStatus.Pending,
    canManage: true,
    canDelete: true,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    rows: [],
    summary: { pending: 0, reviewed: 0, duplicateCount: 0, avgResponseHours: "0.0 Hours" },
  },
};

export const WithoutDeletePermission: Story = {
  args: {
    ...Default.args,
    canDelete: false,
  },
};
