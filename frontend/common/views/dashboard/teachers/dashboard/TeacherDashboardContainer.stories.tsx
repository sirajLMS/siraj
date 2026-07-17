import type { Meta, StoryObj } from "@storybook/react";
import { TeacherDashboardContainer } from "@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer";

const meta: Meta<typeof TeacherDashboardContainer> = {
  title: "Views/dashboard/teachers/dashboard/TeacherDashboardContainer",
  component: TeacherDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TeacherDashboardContainer>;

export const Default: Story = {
  args: {},
};
