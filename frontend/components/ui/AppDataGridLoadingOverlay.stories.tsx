import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { AppDataGridLoadingOverlay } from "./AppDataGridLoadingOverlay";

const meta: Meta<typeof AppDataGridLoadingOverlay> = {
  title: "UI/AppDataGridLoadingOverlay",
  component: AppDataGridLoadingOverlay,
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
type Story = StoryObj<typeof AppDataGridLoadingOverlay>;

export const Default: Story = {
  args: {},
};
