import type { Meta, StoryObj } from "@storybook/react";
import { ParentDashboardContainer } from "@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer";

const meta: Meta<typeof ParentDashboardContainer> = {
  title: "Views/dashboard/parents/dashboard/ParentDashboardContainer",
  component: ParentDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ParentDashboardContainer>;

export const Default: Story = {
  args: {},
};
