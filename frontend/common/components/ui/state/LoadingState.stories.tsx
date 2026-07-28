import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoadingState } from "@/frontend/common/components/ui/state/LoadingState";

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
