import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileAppDataGrid } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGrid";

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

const meta: Meta<typeof MobileAppDataGrid> = {
  title: "UI/AppDataGrid/Mobile",
  component: MobileAppDataGrid,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: {
        mobile1: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobile2: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
  decorators: [
    Story => (
      <Box sx={{ height: 400, width: "100%" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileAppDataGrid>;

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
