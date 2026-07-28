import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileBaseAvatar } from "@/frontend/mobile/components/ui/avatar/MobileBaseAvatar";

const mobileViewport = {
  defaultViewport: "mobile",
  viewports: {
    mobile: {
      name: "Mobile (375px)",
      styles: { width: "375px", height: "667px" },
    },
  },
} as const;

const meta: Meta<typeof MobileBaseAvatar> = {
  title: "UI/BaseAvatar/Mobile",
  component: MobileBaseAvatar,
  tags: ["ai-generated"],
  args: {
    label: "Ahmed Hassan",
    size: 40,
  },
  parameters: {
    viewport: mobileViewport,
  },
};

export default meta;
type Story = StoryObj<typeof MobileBaseAvatar>;

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
      <MobileBaseAvatar label="Small" size={28} />
      <MobileBaseAvatar label="Medium" size={40} />
      <MobileBaseAvatar label="Large" size={64} />
    </Stack>
  ),
};
