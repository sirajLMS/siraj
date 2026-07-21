import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileClassProfileLinkCell } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLinkCell.mobile";

const meta: Meta<typeof MobileClassProfileLinkCell> = {
  title: "UI/ClassProfileLinkCell/Mobile",
  component: MobileClassProfileLinkCell,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
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
type Story = StoryObj<typeof MobileClassProfileLinkCell>;

export const Default: Story = {
  render: args => (
    <Stack spacing={1} sx={{ width: 220, p: 1 }}>
      <MobileClassProfileLinkCell {...args} />
    </Stack>
  ),
};

export const CellRows: Story = {
  render: () => (
    <Stack spacing={1.5} sx={{ width: 220, p: 1 }}>
      <MobileClassProfileLinkCell
        name="Quran Basics - Level 1"
        href="/classes/123"
        label="Class"
        avatarSize={28}
        fontWeight={600}
        typographyVariant="bodyMd"
      />
      <MobileClassProfileLinkCell
        name="Advanced Tajweed"
        href="/classes/456"
        avatarUrl="https://i.pravatar.cc/150?u=class"
        label="Class"
        avatarSize={28}
        fontWeight={600}
        typographyVariant="bodyMd"
      />
      <MobileClassProfileLinkCell
        name="Private Class"
        href="/classes/789"
        showAvatar={false}
        label="Class"
        avatarSize={28}
        fontWeight={600}
        typographyVariant="bodyMd"
      />
    </Stack>
  ),
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    name: "أساسيات القرآن - المستوى الأول",
    href: "/ar/classes/123",
    label: "حلقة",
  },
  render: args => (
    <Stack spacing={1} sx={{ width: 220, p: 1 }}>
      <MobileClassProfileLinkCell {...args} />
    </Stack>
  ),
};
