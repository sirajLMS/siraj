import type { Meta, StoryObj } from "@storybook/react";
import { ParentComplaintsContainer } from "@/frontend/views/dashboard/complaints/ParentComplaintsContainer";

const meta: Meta<typeof ParentComplaintsContainer> = {
  title: "Views/dashboard/complaints/ParentComplaintsContainer",
  component: ParentComplaintsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ParentComplaintsContainer>;

export const Default: Story = {
  args: {},
};
