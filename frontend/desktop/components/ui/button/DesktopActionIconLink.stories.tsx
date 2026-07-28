import { SettingsOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopActionIconLink } from "@/frontend/desktop/components/ui/button/DesktopActionIconLink";

const meta: Meta<typeof DesktopActionIconLink> = {
  title: "UI/ActionIconLink/Desktop",
  component: DesktopActionIconLink,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof DesktopActionIconLink>;

export const Default: Story = {
  render: () => (
    <DesktopActionIconLink href="/settings" aria-label="Settings">
      <SettingsOutlined fontSize="small" />
    </DesktopActionIconLink>
  ),
};

export const InRowWithText: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <DesktopActionIconLink href="/profile" aria-label="Profile">
        <SettingsOutlined fontSize="small" />
      </DesktopActionIconLink>
      <Typography variant="bodyMd">Row with icon link and text</Typography>
    </Stack>
  ),
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: () => (
    <DesktopActionIconLink href="/ar/settings" aria-label="الإعدادات">
      <SettingsOutlined fontSize="small" />
    </DesktopActionIconLink>
  ),
};
