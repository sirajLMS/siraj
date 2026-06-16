import type { Meta, StoryObj } from "@storybook/react";
import { ParentOnboardingContainer } from "./ParentOnboardingContainer";

const meta: Meta<typeof ParentOnboardingContainer> = {
  title: "Views/dashboard/parents/onboarding/ParentOnboardingContainer",
  component: ParentOnboardingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ParentOnboardingContainer>;

export const Default: Story = {
  args: {},
};
