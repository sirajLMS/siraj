import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";

const meta: Meta<typeof DesktopUserAvatar> = {
  title: "UI/UserAvatar/Desktop",
  component: DesktopUserAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Sara Al-Rashid",
    size: 40,
  },
};

export default meta;
type Story = StoryObj<typeof DesktopUserAvatar>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?u=sara",
    label: "Sara Al-Rashid",
  },
};
