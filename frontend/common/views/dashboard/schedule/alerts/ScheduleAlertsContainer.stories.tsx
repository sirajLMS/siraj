import type { Meta, StoryObj } from "@storybook/react";
import { ScheduleAlertsContainer } from "@/frontend/common/views/dashboard/schedule/alerts/ScheduleAlertsContainer";

const meta: Meta<typeof ScheduleAlertsContainer> = {
  title: "Views/dashboard/schedule/alerts/ScheduleAlertsContainer",
  component: ScheduleAlertsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ScheduleAlertsContainer>;

export const Default: Story = {
  args: {},
};
