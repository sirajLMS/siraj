import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TeacherWeeklyScheduleContainer from "@/frontend/common/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer";

const meta: Meta<typeof TeacherWeeklyScheduleContainer> = {
  title: "Views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer",
  component: TeacherWeeklyScheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TeacherWeeklyScheduleContainer>;

export const Default: Story = {
  args: {},
};
