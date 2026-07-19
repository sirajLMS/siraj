import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobilePaginationControls } from "@/frontend/mobile/components/ui/filter/paginationControls.mobile";

const meta: Meta<typeof MobilePaginationControls> = {
  title: "UI/PaginationControls/Mobile",
  component: MobilePaginationControls,
  tags: ["ai-generated"],
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
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
        mobileLarge: {
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
      <Box sx={{ width: "100%", p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobilePaginationControls>;

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
