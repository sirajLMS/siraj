import type { Meta, StoryObj } from "@storybook/react";
import { ReportsContainer } from "./ReportsContainer";

const meta: Meta<typeof ReportsContainer> = {
  title: "Views/dashboard/reports/ReportsContainer",
  component: ReportsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ReportsContainer>;

export const Default: Story = {
  args: {},
};
