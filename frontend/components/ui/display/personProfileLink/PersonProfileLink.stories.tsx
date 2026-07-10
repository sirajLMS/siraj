import type { Meta, StoryObj } from "@storybook/react";
import { PersonProfileLink } from "@/frontend/components/ui/display/personProfileLink/PersonProfileLink";

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
