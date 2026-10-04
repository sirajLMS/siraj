import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QuotaDetailContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaDetailContainer";
import {
  defaultMocks,
  errorMocks,
  notFoundMocks,
} from "@/frontend/common/views/dashboard/billing/quota/QuotaDetailContainer.stories.fixtures";
import { withQuotaMocks } from "@/frontend/common/views/dashboard/billing/quota/quotaStories.helpers";

const meta = {
  title: "Views/dashboard/billing/quota/QuotaDetailContainer",
  component: QuotaDetailContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withQuotaMocks(defaultMocks)],
} satisfies Meta<typeof QuotaDetailContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { quotaId: "quota-001" },
};

export const Loading: Story = {
  args: { quotaId: "quota-001" },
  decorators: [withQuotaMocks([])],
};

export const NotFound: Story = {
  args: { quotaId: "missing-quota" },
  decorators: [withQuotaMocks(notFoundMocks)],
};

export const ErrorState: Story = {
  args: { quotaId: "quota-error" },
  decorators: [withQuotaMocks(errorMocks)],
};
