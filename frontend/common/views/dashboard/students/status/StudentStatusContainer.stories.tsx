import type { Meta, StoryObj } from "@storybook/react";
import { StudentStatusContainer } from "@/frontend/common/views/dashboard/students/status/StudentStatusContainer";

const meta: Meta<typeof StudentStatusContainer> = {
  title: "Views/dashboard/students/status/StudentStatusContainer",
  component: StudentStatusContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof StudentStatusContainer>;

export const Default: Story = {
  args: {},
};
