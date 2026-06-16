import type { Meta, StoryObj } from "@storybook/react";
import { DashboardContainer } from "./DashboardContainer";

const meta: Meta<typeof DashboardContainer> = {
  title: "Views/dashboard/dashboard/DashboardContainer",
  component: DashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof DashboardContainer>;

export const Default: Story = {
  args: {},
};
