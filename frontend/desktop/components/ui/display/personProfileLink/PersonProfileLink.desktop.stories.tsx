import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildProfileLinkStories } from "@/frontend/common/components/ui/display/__shared__/profileLinkStories";
import { DesktopPersonProfileLink } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLink.desktop";

const meta: Meta<typeof DesktopPersonProfileLink> = {
  title: "UI/PersonProfileLink/Desktop",
  component: DesktopPersonProfileLink,
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
      <Stack sx={{ width: 320, p: 2 }}>
        <Story />
      </Stack>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DesktopPersonProfileLink>;

const stories = buildProfileLinkStories({
  plainTextName: "Sara Al-Rashid",
  withAvatarImageName: "Ahmed Hassan",
  withAvatarImageHref: "/teachers/456",
  withAvatarImageUrl: "https://i.pravatar.cc/150?u=ahmed",
  noAvatarName: "Khalid Mohammed",
  noAvatarHref: "/parents/789",
  fallbackHref: "/students/999",
  arabicName: "سارة الراشد",
  arabicHref: "/ar/students/123",
  arabicLabel: "طالب",
});

export const Linked: Story = stories.Linked;
export const PlainText: Story = stories.PlainText;
export const WithAvatarImage: Story = stories.WithAvatarImage;
export const NoAvatar: Story = stories.NoAvatar;
export const WithFallbackInitial: Story = stories.WithFallbackInitial;
export const Arabic: Story = stories.Arabic;
