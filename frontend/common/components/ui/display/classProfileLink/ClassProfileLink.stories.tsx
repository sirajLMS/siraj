import type { Meta, StoryObj } from "@storybook/react";
import { buildProfileLinkStories } from "@/frontend/common/components/ui/display/__shared__/profileLinkStories";
import { ClassProfileLink } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";

const meta: Meta<typeof ClassProfileLink> = {
  title: "UI/Display/ClassProfileLink",
  component: ClassProfileLink,
  tags: ["autodocs"],
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
type Story = StoryObj<typeof ClassProfileLink>;

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
