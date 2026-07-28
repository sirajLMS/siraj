import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";

const meta: Meta<typeof DesktopPersonProfileLinkCell> = {
  title: "UI/PersonProfileLinkCell/Desktop",
  component: DesktopPersonProfileLinkCell,
  tags: ["ai-generated"],
  args: {
    name: "Sara Al-Rashid",
    href: "/students/123",
    avatarUrl: "",
    label: "Student",
    avatarSize: 28,
    fontWeight: 600,
    typographyVariant: "bodyMd",
  },
  decorators: [
    Story => (
      <Stack sx={{ width: 240, maxWidth: "100%", p: 1 }}>
        <Story />
      </Stack>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DesktopPersonProfileLinkCell>;

export const Linked: Story = {};

export const PlainText: Story = {
  args: {
    href: undefined,
    name: "Sara Al-Rashid",
  },
};

export const WithAvatarImage: Story = {
  args: {
    name: "Ahmed Hassan",
    href: "/teachers/456",
    avatarUrl: "https://i.pravatar.cc/150?u=ahmed",
  },
};

export const NoAvatar: Story = {
  args: {
    name: "Khalid Mohammed",
    href: "/parents/789",
    showAvatar: false,
  },
};

export const WithFallbackInitial: Story = {
  args: {
    name: "",
    href: "/students/999",
    fallbackInitial: "?",
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    name: "سارة الراشد",
    href: "/ar/students/123",
    label: "طالب",
  },
};
