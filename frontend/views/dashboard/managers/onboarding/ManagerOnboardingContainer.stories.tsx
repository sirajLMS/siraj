import type { Meta, StoryObj } from "@storybook/react";
import { ManagerOnboardingContainer } from "./ManagerOnboardingContainer";

const meta: Meta<typeof ManagerOnboardingContainer> = {
  title: "Views/dashboard/managers/onboarding/ManagerOnboardingContainer",
  component: ManagerOnboardingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ManagerOnboardingContainer>;

export const Default: Story = {
  args: {},
};
