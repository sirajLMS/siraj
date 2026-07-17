import type { Meta, StoryObj } from "@storybook/react";
import { StudentStatusView } from "@/frontend/common/views/dashboard/students/status/StudentStatusContainer";

const meta: Meta<typeof StudentStatusView> = {
  title: "Views/dashboard/students/status/StudentStatusView",
  component: StudentStatusView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof StudentStatusView>;

export const Default: Story = {
  args: {},
};
