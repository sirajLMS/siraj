import type { Meta, StoryObj } from "@storybook/react";
import { StudentStatusContainer } from "./StudentStatusContainer";

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
