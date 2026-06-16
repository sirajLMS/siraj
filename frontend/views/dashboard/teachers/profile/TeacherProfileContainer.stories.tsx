import type { Meta, StoryObj } from "@storybook/react";
import { TeacherProfileContainer } from "./TeacherProfileContainer";

const meta: Meta<typeof TeacherProfileContainer> = {
  title: "Views/dashboard/teachers/profile/TeacherProfileContainer",
  component: TeacherProfileContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TeacherProfileContainer>;

export const Default: Story = {
  args: {},
};
