import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopBaseAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopBaseAvatar";

const meta: Meta<typeof DesktopBaseAvatar> = {
  title: "UI/BaseAvatar/Desktop",
  component: DesktopBaseAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Ahmed Hassan",
    size: 40,
  },
};

export default meta;
type Story = StoryObj<typeof DesktopBaseAvatar>;

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
      <DesktopBaseAvatar label="Small" size={28} />
      <DesktopBaseAvatar label="Medium" size={40} />
      <DesktopBaseAvatar label="Large" size={64} />
    </Stack>
  ),
};
