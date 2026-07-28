import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createMobileStoryMeta } from "@/frontend/common/stories";
import { MobileAppDataGridNoRowsOverlay } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGridNoRowsOverlay";

const meta: Meta<typeof MobileAppDataGridNoRowsOverlay> = {
  ...createMobileStoryMeta(MobileAppDataGridNoRowsOverlay, "UI/AppDataGridNoRowsOverlay/Mobile"),
  decorators: [
    Story => (
      <Box sx={{ height: 200, position: "relative" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileAppDataGridNoRowsOverlay>;

export const Default: Story = {
  args: {
    message: "No rows to display",
  },
};
