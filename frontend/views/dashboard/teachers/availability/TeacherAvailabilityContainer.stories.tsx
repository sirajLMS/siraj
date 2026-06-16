import type { Meta, StoryObj } from "@storybook/react";
import { TeacherAvailabilityContainer } from "./TeacherAvailabilityContainer";

const meta: Meta<typeof TeacherAvailabilityContainer> = {
  title: "Views/dashboard/teachers/availability/TeacherAvailabilityContainer",
  component: TeacherAvailabilityContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TeacherAvailabilityContainer>;

export const Default: Story = {
  args: {},
};
