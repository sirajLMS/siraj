import type { Meta, StoryObj } from "@storybook/react";
import { buildProfileLinkStories } from "@/frontend/common/components/ui/display/__shared__/profileLinkStories";
import { PersonProfileLink } from "@/frontend/common/components/ui/display/personProfileLink/PersonProfileLink";

const meta: Meta<typeof PersonProfileLink> = {
  title: "UI/Display/PersonProfileLink",
  component: PersonProfileLink,
  tags: ["autodocs"],
  args: {
    name: "Sara Al-Rashid",
    href: "/students/123",
    avatarUrl: "",
    label: "Student",
    avatarSize: 28,
    fontWeight: 600,
    typographyVariant: "bodyMd",
  },
};

export default meta;
type Story = StoryObj<typeof PersonProfileLink>;

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
