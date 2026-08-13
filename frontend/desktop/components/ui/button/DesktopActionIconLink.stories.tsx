import { SettingsOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActionIconLink } from "@/frontend/common/components/ui/button/ActionIconLink";

const meta: Meta<typeof ActionIconLink> = {
  title: "UI/ActionIconLink/Desktop",
  component: ActionIconLink,
  tags: ["ai-generated"],
};

export default meta;
type Story = StoryObj<typeof ActionIconLink>;

export const Default: Story = {
  render: () => (
    <ActionIconLink href="/settings" aria-label="Settings">
      <SettingsOutlined fontSize="small" />
    </ActionIconLink>
  ),
};

export const InRowWithText: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <ActionIconLink href="/profile" aria-label="Profile">
        <SettingsOutlined fontSize="small" />
      </ActionIconLink>
      <Typography variant="bodyMd">Row with icon link and text</Typography>
    </Stack>
  ),
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: () => (
    <ActionIconLink href="/ar/settings" aria-label="الإعدادات">
      <SettingsOutlined fontSize="small" />
    </ActionIconLink>
  ),
};
