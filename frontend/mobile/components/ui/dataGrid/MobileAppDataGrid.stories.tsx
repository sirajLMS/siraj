import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createMobileStoryMeta, SAMPLE_GRID_COLUMNS, SAMPLE_GRID_ROWS } from "@/frontend/common/stories";
import { MobileAppDataGrid } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGrid";

// cspell:ignore Lannister, Cersei, Targaryen, Daenerys

const meta = {
  ...createMobileStoryMeta(MobileAppDataGrid, "UI/AppDataGrid/Mobile"),
  decorators: [
    Story => (
      <Box sx={{ height: 400, width: "100%" }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof MobileAppDataGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rows: SAMPLE_GRID_ROWS,
    columns: SAMPLE_GRID_COLUMNS,
    paginationOptions: { mode: "client" },
  },
};

export const Loading: Story = {
  args: {
    rows: [],
    columns: SAMPLE_GRID_COLUMNS,
    loading: true,
    paginationOptions: { mode: "client" },
  },
};

export const Empty: Story = {
  args: {
    rows: [],
    columns: SAMPLE_GRID_COLUMNS,
    emptyMessage: "No users found in the system.",
    paginationOptions: { mode: "client" },
  },
};
