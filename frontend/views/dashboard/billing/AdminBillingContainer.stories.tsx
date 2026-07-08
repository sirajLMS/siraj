import type { Meta, StoryObj } from "@storybook/react";
import { StoryBookPageContainer } from "@/frontend/components/ui/story/StoryBookPageContainer";
import { AdminBillingContainer } from "./AdminBillingContainer";

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
