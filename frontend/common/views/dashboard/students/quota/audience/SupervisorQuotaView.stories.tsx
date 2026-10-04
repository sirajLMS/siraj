import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildQuotaAudienceLabels } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.fixtures";
import { withQuotaAudienceMocks } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.helpers";
import { SupervisorQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView";
import {
  defaultMocks,
  emptyMocks,
  errorMocks,
  setSupervisorUser,
} from "@/frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.stories.fixtures";

const mockLabels = buildQuotaAudienceLabels("All Quotas");

const meta = {
  title: "Views/dashboard/students/quota/audience/SupervisorQuotaView",
  component: SupervisorQuotaView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withQuotaAudienceMocks(defaultMocks, setSupervisorUser)],
} satisfies Meta<typeof SupervisorQuotaView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { t: mockLabels },
};

export const Loading: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks([], setSupervisorUser)],
};

export const Empty: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks(emptyMocks, setSupervisorUser)],
};

export const ErrorState: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks(errorMocks, setSupervisorUser)],
};

export const AllStudentsOverview: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks(defaultMocks, setSupervisorUser)],
};
