import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createMobileStoryMeta, mobileBaseCardPreview } from "@/frontend/common/stories";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card/MobileBaseCard";

const meta: Meta<typeof MobileBaseCard> = {
  ...createMobileStoryMeta(MobileBaseCard, "UI/BaseCard/Mobile"),
  args: {
    children: mobileBaseCardPreview(),
  },
};

export default meta;
type Story = StoryObj<typeof MobileBaseCard>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
  },
};

export const Rounded: Story = {
  args: {
    edgeToEdge: false,
  },
};
