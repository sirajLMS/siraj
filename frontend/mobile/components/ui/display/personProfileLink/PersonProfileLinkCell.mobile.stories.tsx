import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobilePersonProfileLinkCell } from "@/frontend/mobile/components/ui/display/personProfileLink/PersonProfileLinkCell.mobile";

const meta: Meta<typeof MobilePersonProfileLinkCell> = {
  title: "UI/PersonProfileLinkCell/Mobile",
  component: MobilePersonProfileLinkCell,
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
    name: "Sara Al-Rashid",
    href: "/students/123",
    avatarUrl: "",
    label: "Student",
    avatarSize: 24,
    fontWeight: 600,
    typographyVariant: "bodySm",
  },
  decorators: [
    (Story) => (
      <Stack sx={{ width: 220, maxWidth: "100%", p: 1 }}>
        <Story />
      </Stack>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobilePersonProfileLinkCell>;

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
