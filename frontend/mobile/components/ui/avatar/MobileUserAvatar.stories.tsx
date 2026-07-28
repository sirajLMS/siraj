import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar/MobileUserAvatar";

const meta: Meta<typeof MobileUserAvatar> = {
  title: "UI/UserAvatar/Mobile",
  component: MobileUserAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Sara Al-Rashid",
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
type Story = StoryObj<typeof MobileUserAvatar>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?u=sara",
    label: "Sara Al-Rashid",
  },
};
