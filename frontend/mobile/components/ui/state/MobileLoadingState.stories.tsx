import type { Meta, StoryObj } from "@storybook/react";
import { MobileLoadingState } from "@/frontend/mobile/components/ui/state/MobileLoadingState";

const meta: Meta<typeof MobileLoadingState> = {
  title: "UI/LoadingState/Mobile",
  component: MobileLoadingState,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileLoadingState>;

export const Default: Story = {};
