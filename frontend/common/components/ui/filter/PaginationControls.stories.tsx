import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PaginationControls } from "@/frontend/common/components/ui/filter/PaginationControls";

const meta: Meta<typeof PaginationControls> = {
  title: "UI/Filter/PaginationControls",
  component: PaginationControls,
  tags: ["autodocs"],
  argTypes: {
    onPageChange: { action: "pageChanged" },
  },
  args: {
    page: 0,
    pageCount: 10,
    rowCount: 95,
    pageSize: 10,
    embedded: false,
  },
  decorators: [
    Story => (
      <Box sx={{ width: 800, p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PaginationControls>;

export const Default: Story = {};

export const MiddlePage: Story = {
  args: {
    page: 4,
    pageCount: 10,
    rowCount: 95,
    pageSize: 10,
  },
};

export const LastPage: Story = {
  args: {
    page: 9,
    pageCount: 10,
    rowCount: 95,
    pageSize: 10,
  },
};

export const Empty: Story = {
  args: {
    page: 0,
    pageCount: 0,
    rowCount: 0,
    pageSize: 10,
  },
};

export const Embedded: Story = {
  args: {
    page: 2,
    pageCount: 8,
    rowCount: 75,
    pageSize: 10,
    embedded: true,
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    page: 3,
    pageCount: 10,
    rowCount: 95,
    pageSize: 10,
  },
};
