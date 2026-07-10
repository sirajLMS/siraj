import type { Meta, StoryObj } from "@storybook/react";
import { UserAvatar } from "@/frontend/components/ui/avatar/UserAvatar";

const meta: Meta<typeof UserAvatar> = {
  title: "UI/Avatar/UserAvatar",
  component: UserAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Sara Al-Rashid",
    size: 40,
  },
};

export default meta;
type Story = StoryObj<typeof UserAvatar>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?u=sara",
    label: "Sara Al-Rashid",
  },
};
