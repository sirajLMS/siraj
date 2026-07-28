import { SettingsOutlined } from "@mui/icons-material";
import { Button, Stack, TextField, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopAdminControlPanel } from "@/frontend/desktop/components/ui/container/DesktopAdminControlPanel";

const meta: Meta<typeof DesktopAdminControlPanel> = {
  title: "UI/AdminControlPanel/Desktop",
  component: DesktopAdminControlPanel,
  tags: ["ai-generated"],
  args: {
    title: "Admin Controls",
    children: (
      <Typography variant="bodyMd">
        Manage institutional settings, permissions, and lifecycle controls from this panel.
      </Typography>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof DesktopAdminControlPanel>;

export const Default: Story = {};

export const WithFormContent: Story = {
  args: {
    title: "Status Management",
    children: (
      <Stack sx={{ gap: 2 }}>
        <TextField label="Reason" size="small" fullWidth />
        <Stack sx={{ flexDirection: "row", gap: 1.5, justifyContent: "flex-end" }}>
          <Button variant="outlined">Cancel</Button>
          <Button variant="contained">Apply</Button>
        </Stack>
      </Stack>
    ),
  },
};

export const CustomIcon: Story = {
  args: {
    title: "System Settings",
    icon: SettingsOutlined,
    children: <Typography variant="bodyMd">Configure platform-wide defaults and operational preferences.</Typography>,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    title: "لوحة التحكم الإدارية",
    children: (
      <Typography variant="bodyMd">إدارة الإعدادات المؤسسية والصلاحيات وضوابط دورة الحياة من هذه اللوحة.</Typography>
    ),
  },
};
