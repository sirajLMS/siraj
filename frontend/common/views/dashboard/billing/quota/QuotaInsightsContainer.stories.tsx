import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QuotaInsightsContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer";
import {
  defaultMocks,
  emptyMocks,
  errorMocks,
} from "@/frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.stories.fixtures";
import { withQuotaMocks } from "@/frontend/common/views/dashboard/billing/quota/quotaStories.helpers";

const meta = {
  title: "Views/dashboard/billing/quota/QuotaInsightsContainer",
  component: QuotaInsightsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withQuotaMocks(defaultMocks)],
} satisfies Meta<typeof QuotaInsightsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [withQuotaMocks([])],
};

export const Empty: Story = {
  decorators: [withQuotaMocks(emptyMocks)],
};

export const ErrorState: Story = {
  decorators: [withQuotaMocks(errorMocks)],
};
