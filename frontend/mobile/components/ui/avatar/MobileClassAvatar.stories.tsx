import type { Meta, StoryObj } from "@storybook/react";
import { MobileClassAvatar } from "@/frontend/mobile/components/ui/avatar/MobileClassAvatar";

const meta: Meta<typeof MobileClassAvatar> = {
  title: "UI/ClassAvatar/Mobile",
  component: MobileClassAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Quran Memorization",
    size: 40,
  },
  parameters: {
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
type Story = StoryObj<typeof MobileClassAvatar>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    src: "https://picsum.photos/seed/quran/80",
    label: "Quran Memorization",
  },
};
