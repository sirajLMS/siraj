import type { Meta, StoryObj } from "@storybook/react";
import { buildProfileLinkStories } from "@/frontend/common/components/ui/display/__shared__/profileLinkStories";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";

const meta: Meta<typeof MobileClassProfileLink> = {
  title: "UI/ClassProfileLink/Mobile",
  component: MobileClassProfileLink,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: {
        mobile1: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobile2: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
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
type Story = StoryObj<typeof MobileClassProfileLink>;

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
