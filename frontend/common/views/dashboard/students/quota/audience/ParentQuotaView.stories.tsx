import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ParentQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/ParentQuotaView";
import {
  defaultMocks,
  emptyMocks,
  setParentUser,
} from "@/frontend/common/views/dashboard/students/quota/audience/ParentQuotaView.stories.fixtures";
import { buildQuotaAudienceLabels } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.fixtures";
import { withQuotaAudienceMocks } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.helpers";

const mockLabels = buildQuotaAudienceLabels("Children Quota");

const meta = {
  title: "Views/dashboard/students/quota/audience/ParentQuotaView",
  component: ParentQuotaView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withQuotaAudienceMocks(defaultMocks, setParentUser)],
} satisfies Meta<typeof ParentQuotaView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { t: mockLabels },
};

export const Loading: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks([], setParentUser)],
};

export const Empty: Story = {
  args: { t: mockLabels },
  decorators: [withQuotaAudienceMocks(emptyMocks, setParentUser)],
};
