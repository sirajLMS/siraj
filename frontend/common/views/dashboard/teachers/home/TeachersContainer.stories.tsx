import type { Meta, StoryObj } from "@storybook/react";
import { TeachersContainer } from "@/frontend/common/views/dashboard/teachers/home/TeachersContainer";

const meta: Meta<typeof TeachersContainer> = {
  title: "Views/dashboard/teachers/home/TeachersContainer",
  component: TeachersContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TeachersContainer>;

export const Default: Story = {
  args: {},
};
