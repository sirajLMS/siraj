import type { Meta, StoryObj } from "@storybook/react";
import { ClassProfileLink } from "@/frontend/components/ui/display/classProfileLink/ClassProfileLink";

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

export const Linked: Story = {};

export const PlainText: Story = {
  args: {
    href: undefined,
    name: "Quran Basics - Level 1",
  },
};

export const WithAvatarImage: Story = {
  args: {
    name: "Advanced Tajweed",
    href: "/classes/456",
    avatarUrl: "https://i.pravatar.cc/150?u=class",
  },
};

export const NoAvatar: Story = {
  args: {
    name: "Private Class",
    href: "/classes/789",
    showAvatar: false,
  },
};

export const WithFallbackInitial: Story = {
  args: {
    name: "",
    href: "/classes/999",
    fallbackInitial: "?",
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    name: "أساسيات القرآن - المستوى الأول",
    href: "/ar/classes/123",
    label: "حلقة",
  },
};
