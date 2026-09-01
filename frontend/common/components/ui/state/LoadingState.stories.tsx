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

export const WithMessage: Story = {
  args: { message: "Loading sessions..." },
};

export const Compact: Story = {
  args: { size: 24, minHeight: 120 },
};

export const Embedded: Story = {
  args: { embedded: true, size: 20, message: "Loading…" },
};
