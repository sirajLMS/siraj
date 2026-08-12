import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { createMobileStoryMeta, mobileBaseCardCorePreview } from "@/frontend/common/stories";

/**
 * Low-level mobile BaseCard (not barrel-exported as MobileBaseCard).
 * Distinct from UI/Card/Mobile/BaseCard which covers MobileBaseCard.
 */
const meta: Meta<typeof BaseCard> = {
  ...createMobileStoryMeta(BaseCard, "UI/BaseCardCore/Mobile"),
  args: {
    children: mobileBaseCardCorePreview(),
  },
};

export default meta;
type Story = StoryObj<typeof BaseCard>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
  },
};

export const EdgeToEdge: Story = {
  args: {
    edgeToEdge: true,
  },
};
