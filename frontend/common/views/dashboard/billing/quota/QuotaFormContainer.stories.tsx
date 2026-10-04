import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QuotaFormContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaFormContainer";
import {
  createMocks,
  editMocks,
  noResponseMocks,
  resetQuotaFormStore,
} from "@/frontend/common/views/dashboard/billing/quota/QuotaFormContainer.stories.fixtures";
import { withQuotaMocks } from "@/frontend/common/views/dashboard/billing/quota/quotaStories.helpers";

const meta = {
  title: "Views/dashboard/billing/quota/QuotaFormContainer",
  component: QuotaFormContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withQuotaMocks(createMocks, resetQuotaFormStore)],
} satisfies Meta<typeof QuotaFormContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Edit: Story = {
  args: { quotaId: "quota-edit-001" },
  decorators: [withQuotaMocks(editMocks, resetQuotaFormStore)],
};

export const ValidationErrors: Story = {
  args: {},
  decorators: [withQuotaMocks(noResponseMocks, resetQuotaFormStore)],
};
