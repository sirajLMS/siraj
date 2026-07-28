import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createMobileStoryMeta } from "@/frontend/common/stories";
import { MobileAppDataGridLoadingOverlay } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGridLoadingOverlay";

const meta: Meta<typeof MobileAppDataGridLoadingOverlay> = {
  ...createMobileStoryMeta(MobileAppDataGridLoadingOverlay, "UI/AppDataGridLoadingOverlay/Mobile"),
  decorators: [
    Story => (
      <Box sx={{ height: 200, position: "relative" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileAppDataGridLoadingOverlay>;

export const Default: Story = {
  args: {},
};
