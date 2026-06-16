import type { Meta, StoryObj } from "@storybook/react";
import { ParentBillingContainer } from "./ParentBillingContainer";

const meta: Meta<typeof ParentBillingContainer> = {
  title: "Views/dashboard/billing/ParentBillingContainer",
  component: ParentBillingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ParentBillingContainer>;

export const Default: Story = {
  args: {},
};
