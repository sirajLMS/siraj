import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopClassAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopClassAvatar";

const meta: Meta<typeof DesktopClassAvatar> = {
  title: "UI/ClassAvatar/Desktop",
  component: DesktopClassAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Quran Memorization",
    size: 40,
  },
};

export default meta;
type Story = StoryObj<typeof DesktopClassAvatar>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    src: "https://picsum.photos/seed/quran/80",
    label: "Quran Memorization",
  },
};
