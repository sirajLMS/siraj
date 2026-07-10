import type { Meta, StoryObj } from "@storybook/react";
import { LoadingState } from "@/frontend/components/ui/state/LoadingState";

const meta: Meta<typeof LoadingState> = {
  title: "UI/State/LoadingState",
  component: LoadingState,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {};
