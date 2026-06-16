import type { Meta, StoryObj } from "@storybook/react";
import { TeacherOnboardingContainer } from "./TeacherOnboardingContainer";

const meta: Meta<typeof TeacherOnboardingContainer> = {
  title: "Views/dashboard/teachers/onboarding/TeacherOnboardingContainer",
  component: TeacherOnboardingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TeacherOnboardingContainer>;

export const Default: Story = {
  args: {},
};
