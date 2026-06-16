import type { Meta, StoryObj } from "@storybook/react";
import { StudentHistoryContainer } from "./StudentHistoryContainer";

const meta: Meta<typeof StudentHistoryContainer> = {
  title: "Views/dashboard/students/history/StudentHistoryContainer",
  component: StudentHistoryContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof StudentHistoryContainer>;

export const Default: Story = {
  args: {},
};
