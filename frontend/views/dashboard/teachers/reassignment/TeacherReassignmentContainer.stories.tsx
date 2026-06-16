import type { Meta, StoryObj } from "@storybook/react";
import { TeacherReassignmentContainer } from "./TeacherReassignmentContainer";

const meta: Meta<typeof TeacherReassignmentContainer> = {
  title: "Views/dashboard/teachers/reassignment/TeacherReassignmentContainer",
  component: TeacherReassignmentContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TeacherReassignmentContainer>;

export const Default: Story = {
  args: {},
};
