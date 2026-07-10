import type { Meta, StoryObj } from "@storybook/react";
import { ParentSuggestionsContainer } from "@/frontend/views/dashboard/suggestions/ParentSuggestionsContainer";

const meta: Meta<typeof ParentSuggestionsContainer> = {
  title: "Views/dashboard/suggestions/ParentSuggestionsContainer",
  component: ParentSuggestionsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ParentSuggestionsContainer>;

export const Default: Story = {
  args: {},
};
