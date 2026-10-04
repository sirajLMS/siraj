import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ComplaintStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import {
  ADMIN_PERMISSIONS,
  MOCK_ADMIN_COMPLAINT_ROWS,
  MOCK_ADMIN_SUMMARY,
} from "@/frontend/common/views/dashboard/complaints/AdminComplaintsDesktopView.fixtures";
import { AdminComplaintsDesktopStoryRenderer } from "@/frontend/common/views/dashboard/complaints/AdminComplaintsDesktopView.helpers";
import { createMockAdminDecorator } from "@/frontend/common/views/dashboard/components/createMockAdminDecorator";

const meta: Meta<typeof AdminComplaintsDesktopStoryRenderer> = {
  title: "Views/dashboard/complaints/AdminComplaintsDesktopView",
  component: AdminComplaintsDesktopStoryRenderer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: createMockAdminDecorator(ADMIN_PERMISSIONS),
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
    canDelete: true,
    page: 0,
    pageSize: 10,
    totalCount: 2,
    deleteDialogOpen: false,
    deleteComplaintId: null,
    isDeletingComplaint: false,
    loading: false,
    error: null,
    onRefetch: () => {
      logger.info("onRefetch");
    },
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    rows: [],
    summary: { unanswered: 0, answered: 0, avgResolutionHours: "0.0 Hours" },
  },
};
