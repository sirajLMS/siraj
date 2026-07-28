import { SettingsOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileActionIconLink } from "@/frontend/mobile/components/ui/button/MobileActionIconLink";

const meta: Meta<typeof MobileActionIconLink> = {
  title: "UI/ActionIconLink/Mobile",
  component: MobileActionIconLink,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileActionIconLink>;

export const Default: Story = {
  render: () => (
    <MobileActionIconLink href="/settings" aria-label="Settings">
      <SettingsOutlined fontSize="small" />
    </MobileActionIconLink>
  ),
};

export const InRowWithText: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <MobileActionIconLink href="/profile" aria-label="Profile">
        <SettingsOutlined fontSize="small" />
      </MobileActionIconLink>
      <Typography variant="bodyMd">Row with icon link and text</Typography>
    </Stack>
  ),
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  render: () => (
    <MobileActionIconLink href="/ar/settings" aria-label="الإعدادات">
      <SettingsOutlined fontSize="small" />
    </MobileActionIconLink>
  ),
};
