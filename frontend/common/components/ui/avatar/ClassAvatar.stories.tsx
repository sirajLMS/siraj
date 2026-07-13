import type { Meta, StoryObj } from "@storybook/react";
import { ClassAvatar } from "@/frontend/common/components/ui/avatar/ClassAvatar";

const meta: Meta<typeof ClassAvatar> = {
  title: "UI/Avatar/ClassAvatar",
  component: ClassAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Quran Memorization",
    size: 40,
  },
};

export default meta;
type Story = StoryObj<typeof ClassAvatar>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    src: "https://picsum.photos/seed/quran/80",
    label: "Quran Memorization",
  },
};
