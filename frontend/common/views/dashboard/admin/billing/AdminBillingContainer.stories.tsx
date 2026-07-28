import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StoryBookPageContainer } from "@/frontend/common/components/ui/story/StoryBookPageContainer";
import { AdminBillingContainer } from "@/frontend/common/views/dashboard/admin/billing/AdminBillingContainer";

const meta: Meta<typeof AdminBillingContainer> = {
  title: "Views/dashboard/billing/AdminBillingContainer",
  component: AdminBillingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => (
      <StoryBookPageContainer>
        <Story />
      </StoryBookPageContainer>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminBillingContainer>;

export const Default: Story = {
  args: {},
};
