import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { buildProfileLinkStories } from "@/frontend/common/components/ui/display/__shared__/profileLinkStories";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink/PersonProfileLink.mobile";

const meta: Meta<typeof MobilePersonProfileLink> = {
  title: "UI/PersonProfileLink/Mobile",
  component: MobilePersonProfileLink,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobileLarge: {
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
    name: "Sara Al-Rashid",
    href: "/students/123",
    avatarUrl: "",
    label: "Student",
    avatarSize: 24,
    fontWeight: 600,
    typographyVariant: "bodySm",
  },
  decorators: [
    Story => (
      <Stack sx={{ width: 280, p: 2 }}>
        <Story />
      </Stack>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobilePersonProfileLink>;

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
