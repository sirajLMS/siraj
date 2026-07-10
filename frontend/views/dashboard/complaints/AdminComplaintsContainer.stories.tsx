import type { Meta, StoryObj } from "@storybook/react";
import { AdminComplaintsContainer } from "@/frontend/views/dashboard/complaints/AdminComplaintsContainer";

const meta: Meta<typeof AdminComplaintsContainer> = {
  title: "Views/dashboard/complaints/AdminComplaintsContainer",
  component: AdminComplaintsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AdminComplaintsContainer>;

export const Default: Story = {
  args: {},
};
