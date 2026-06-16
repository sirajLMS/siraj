import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { AppDataGridNoRowsOverlay } from "./AppDataGridNoRowsOverlay";

const meta: Meta<typeof AppDataGridNoRowsOverlay> = {
  title: "UI/AppDataGridNoRowsOverlay",
  component: AppDataGridNoRowsOverlay,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ height: 200, position: "relative" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppDataGridNoRowsOverlay>;

export const Default: Story = {
  args: {
    message: "No rows to display",
  },
};
