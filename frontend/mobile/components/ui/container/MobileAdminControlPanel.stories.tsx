import { SecurityOutlined } from "@mui/icons-material";
import { Button, Stack, TextField, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileAdminControlPanel } from "@/frontend/mobile/components/ui/container/MobileAdminControlPanel";

const meta: Meta<typeof MobileAdminControlPanel> = {
  title: "UI/AdminControlPanel/Mobile",
  component: MobileAdminControlPanel,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  args: {
    title: "Admin Controls",
  },
};

export default meta;
type Story = StoryObj<typeof MobileAdminControlPanel>;

export const Default: Story = {
  render: args => (
    <MobileAdminControlPanel {...args}>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        Manage lifecycle settings, status transitions, and administrative actions for this record.
      </Typography>
    </MobileAdminControlPanel>
  ),
};

export const WithFormControls: Story = {
  args: {
    title: "Status Management",
  },
  render: args => (
    <MobileAdminControlPanel {...args}>
      <Stack spacing={2}>
        <TextField label="Reason" placeholder="Enter status change reason" fullWidth size="small" />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small">
            Approve
          </Button>
          <Button variant="outlined" size="small" color="error">
            Reject
          </Button>
        </Stack>
      </Stack>
    </MobileAdminControlPanel>
  ),
};

export const CustomIcon: Story = {
  args: {
    title: "Security Settings",
    icon: SecurityOutlined,
  },
  render: args => (
    <MobileAdminControlPanel {...args}>
      <Typography variant="bodyMd">
        Panel with a custom header icon instead of the default admin settings icon.
      </Typography>
    </MobileAdminControlPanel>
  ),
};

export const ArabicLocale: Story = {
  globals: { locale: "ar" },
  args: {
    title: "إعدادات الإدارة",
  },
  render: args => (
    <MobileAdminControlPanel {...args}>
      <Typography variant="bodyMd" sx={{ direction: "rtl" }}>
        لوحة تحكم إدارية مع عنوان ومحتوى باللغة العربية لاختبار التخطيط RTL.
      </Typography>
    </MobileAdminControlPanel>
  ),
};
