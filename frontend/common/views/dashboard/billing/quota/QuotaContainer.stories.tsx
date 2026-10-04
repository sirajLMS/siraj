import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QuotaContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaContainer";
import {
  defaultMocks,
  emptyMocks,
  errorMocks,
  resetQuotaStore,
} from "@/frontend/common/views/dashboard/billing/quota/QuotaContainer.stories.fixtures";
import { withQuotaMocks } from "@/frontend/common/views/dashboard/billing/quota/quotaStories.helpers";

const meta = {
  title: "Views/dashboard/billing/quota/QuotaContainer",
  component: QuotaContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withQuotaMocks(defaultMocks, resetQuotaStore)],
} satisfies Meta<typeof QuotaContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [withQuotaMocks([], resetQuotaStore)],
};

export const Empty: Story = {
  decorators: [withQuotaMocks(emptyMocks, resetQuotaStore)],
};

export const ErrorState: Story = {
  decorators: [withQuotaMocks(errorMocks, resetQuotaStore)],
};
