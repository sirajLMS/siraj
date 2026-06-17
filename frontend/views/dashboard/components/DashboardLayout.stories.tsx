import type { Meta, StoryObj } from "@storybook/react";
import { DashboardLayoutContainer } from "./DashboardLayoutContainer";

const meta: Meta<typeof DashboardLayoutContainer> = {
  title: "Views/dashboard/components/DashboardLayoutContainer",
  component: DashboardLayoutContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof DashboardLayoutContainer>;

export const Default: Story = {
  args: {},
};
