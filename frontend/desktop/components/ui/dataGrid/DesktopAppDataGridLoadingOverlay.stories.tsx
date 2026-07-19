import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { DesktopAppDataGridLoadingOverlay } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGridLoadingOverlay";

const meta: Meta<typeof DesktopAppDataGridLoadingOverlay> = {
  title: "UI/AppDataGridLoadingOverlay/Desktop",
  component: DesktopAppDataGridLoadingOverlay,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ height: 200, position: "relative" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DesktopAppDataGridLoadingOverlay>;

export const Default: Story = {
  args: {},
};
