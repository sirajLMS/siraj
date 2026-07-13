import type { Meta, StoryObj } from "@storybook/react";
import { AdminSuggestionsContainer } from "@/frontend/common/views/dashboard/suggestions/AdminSuggestionsContainer";

const meta: Meta<typeof AdminSuggestionsContainer> = {
  title: "Views/dashboard/suggestions/AdminSuggestionsContainer",
  component: AdminSuggestionsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AdminSuggestionsContainer>;

export const Default: Story = {
  args: {},
};
