import type { Meta, StoryObj } from "@storybook/react";
import { StudentsContainer } from "./StudentsContainer";

const meta: Meta<typeof StudentsContainer> = {
  title: "Views/dashboard/students/home/StudentsContainer",
  component: StudentsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof StudentsContainer>;

export const Default: Story = {
  args: {},
};
