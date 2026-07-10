import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { BaseAvatar } from "@/frontend/components/ui/avatar/BaseAvatar";

const meta: Meta<typeof BaseAvatar> = {
  title: "UI/Avatar/BaseAvatar",
  component: BaseAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Ahmed Hassan",
    size: 40,
  },
};

export default meta;
type Story = StoryObj<typeof BaseAvatar>;

export const WithInitials: Story = {};

export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?u=ahmed",
    label: "Ahmed Hassan",
  },
};

export const Rounded: Story = {
  args: {
    label: "Quran Level 1",
    variant: "rounded",
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <BaseAvatar label="Small" size={28} />
      <BaseAvatar label="Medium" size={40} />
      <BaseAvatar label="Large" size={64} />
    </Stack>
  ),
};
