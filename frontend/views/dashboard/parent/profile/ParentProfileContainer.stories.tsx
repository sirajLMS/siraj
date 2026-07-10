import type { Meta, StoryObj } from "@storybook/react";
import ParentProfileContainer from "@/frontend/views/dashboard/parent/profile/ParentProfileContainer";

const meta: Meta<typeof ParentProfileContainer> = {
  title: "Views/dashboard/parents/profile/ParentProfileContainer",
  component: ParentProfileContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ParentProfileContainer>;

export const Default: Story = {
  args: {},
};
