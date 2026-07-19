import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { Meta, StoryObj } from "@storybook/react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";

// cspell:ignore Lannister, Cersei, Targaryen, Daenerys

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "firstName", headerName: "First name", width: 150 },
  { field: "lastName", headerName: "Last name", width: 150 },
  { field: "age", headerName: "Age", type: "number", width: 110 },
];

const rows = [
  { id: 1, lastName: "Snow", firstName: "Jon", age: 35 },
  { id: 2, lastName: "Lannister", firstName: "Cersei", age: 42 },
  { id: 3, lastName: "Lannister", firstName: "Jaime", age: 45 },
  { id: 4, lastName: "Stark", firstName: "Arya", age: 16 },
  { id: 5, lastName: "Targaryen", firstName: "Daenerys", age: null },
];

const meta: Meta<typeof AppDataGrid> = {
  title: "UI/AppDataGrid",
  component: AppDataGrid,
  tags: ["ai-generated"],
  decorators: [
    Story => (
      <Box sx={{ height: 400, width: "100%" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppDataGrid>;

export const Default: Story = {
  args: {
    rows,
    columns,
    paginationOptions: { mode: "client" },
  },
};

export const Loading: Story = {
  args: {
    rows: [],
    columns,
    loading: true,
    paginationOptions: { mode: "client" },
  },
};

export const Empty: Story = {
  args: {
    rows: [],
    columns,
    emptyMessage: "No users found in the system.",
    paginationOptions: { mode: "client" },
  },
};
