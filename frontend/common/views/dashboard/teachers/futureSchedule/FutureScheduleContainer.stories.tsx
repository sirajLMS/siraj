import type { Meta, StoryObj } from "@storybook/react";
import { FutureScheduleContainer } from "@/frontend/common/views/dashboard/teachers/futureSchedule/FutureScheduleContainer";

export function MockFutureScheduleContainer() {
  return <FutureScheduleContainer teacherId="mock-teacher-id" />;
}

const meta: Meta<typeof MockFutureScheduleContainer> = {
  title: "Views/dashboard/teachers/futureSchedule/FutureScheduleContainer",
  component: MockFutureScheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockFutureScheduleContainer>;

export const Default: Story = {
  args: {},
};
