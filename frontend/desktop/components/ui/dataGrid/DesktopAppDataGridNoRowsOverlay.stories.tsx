import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { DesktopAppDataGridNoRowsOverlay } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGridNoRowsOverlay";

const meta: Meta<typeof DesktopAppDataGridNoRowsOverlay> = {
  title: "UI/AppDataGridNoRowsOverlay/Desktop",
  component: DesktopAppDataGridNoRowsOverlay,
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
type Story = StoryObj<typeof DesktopAppDataGridNoRowsOverlay>;

export const Default: Story = {
  args: {
    message: "No rows to display",
  },
};
