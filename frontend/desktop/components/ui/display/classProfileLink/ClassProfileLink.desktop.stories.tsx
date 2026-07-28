import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildProfileLinkStories } from "@/frontend/common/components/ui/display/__shared__/profileLinkStories";
import { DesktopClassProfileLink } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLink.desktop";

const meta: Meta<typeof DesktopClassProfileLink> = {
  title: "UI/ClassProfileLink/Desktop",
  component: DesktopClassProfileLink,
  tags: ["ai-generated"],
  args: {
    name: "Quran Basics - Level 1",
    href: "/classes/123",
    avatarUrl: "",
    label: "Class",
    avatarSize: 28,
    fontWeight: 600,
    typographyVariant: "bodyMd",
  },
};

export default meta;
type Story = StoryObj<typeof DesktopClassProfileLink>;

const stories = buildProfileLinkStories({
  plainTextName: "Quran Basics - Level 1",
  withAvatarImageName: "Advanced Tajweed",
  withAvatarImageHref: "/classes/456",
  withAvatarImageUrl: "https://i.pravatar.cc/150?u=class",
  noAvatarName: "Private Class",
  noAvatarHref: "/classes/789",
  fallbackHref: "/classes/999",
  arabicName: "أساسيات القرآن - المستوى الأول",
  arabicHref: "/ar/classes/123",
  arabicLabel: "حلقة",
});

export const Linked: Story = stories.Linked;
export const PlainText: Story = stories.PlainText;
export const WithAvatarImage: Story = stories.WithAvatarImage;
export const NoAvatar: Story = stories.NoAvatar;
export const WithFallbackInitial: Story = stories.WithFallbackInitial;
export const Arabic: Story = stories.Arabic;
