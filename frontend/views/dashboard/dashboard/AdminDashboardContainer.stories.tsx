import type { Meta, StoryObj } from "@storybook/react";
import { AdminDashboardContainer } from "./AdminDashboardContainer";

const meta: Meta<typeof AdminDashboardContainer> = {
  title: "Views/dashboard/dashboard/AdminDashboardContainer",
  component: AdminDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AdminDashboardContainer>;

export const Default: Story = {
  args: {},
};
