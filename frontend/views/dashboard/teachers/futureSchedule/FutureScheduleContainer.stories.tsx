import type { Meta, StoryObj } from "@storybook/react";
import { FutureScheduleContainer } from "./FutureScheduleContainer";

const meta: Meta<typeof FutureScheduleContainer> = {
  title: "Views/dashboard/teachers/futureSchedule/FutureScheduleContainer",
  component: FutureScheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof FutureScheduleContainer>;

export const Default: Story = {
  args: {},
};
