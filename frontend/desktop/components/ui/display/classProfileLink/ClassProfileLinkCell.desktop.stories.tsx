import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";

const meta: Meta<typeof DesktopClassProfileLinkCell> = {
  title: "UI/ClassProfileLinkCell/Desktop",
  component: DesktopClassProfileLinkCell,
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
type Story = StoryObj<typeof DesktopClassProfileLinkCell>;

export const Default: Story = {
  render: args => (
    <Stack spacing={1} sx={{ width: 240, p: 1 }}>
      <DesktopClassProfileLinkCell {...args} />
    </Stack>
  ),
};

export const CellRows: Story = {
  render: () => (
    <Stack spacing={1.5} sx={{ width: 240, p: 1 }}>
      <DesktopClassProfileLinkCell
        name="Quran Basics - Level 1"
        href="/classes/123"
        label="Class"
        avatarSize={28}
        fontWeight={600}
        typographyVariant="bodyMd"
      />
      <DesktopClassProfileLinkCell
        name="Advanced Tajweed"
        href="/classes/456"
        avatarUrl="https://i.pravatar.cc/150?u=class"
        label="Class"
        avatarSize={28}
        fontWeight={600}
        typographyVariant="bodyMd"
      />
      <DesktopClassProfileLinkCell
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
    <Stack spacing={1} sx={{ width: 240, p: 1 }}>
      <DesktopClassProfileLinkCell {...args} />
    </Stack>
  ),
};
