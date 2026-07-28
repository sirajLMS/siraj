import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopLoadingState } from "@/frontend/desktop/components/ui/state/DesktopLoadingState";

const meta: Meta<typeof DesktopLoadingState> = {
  title: "UI/LoadingState/Desktop",
  component: DesktopLoadingState,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof DesktopLoadingState>;

export const Default: Story = {};
