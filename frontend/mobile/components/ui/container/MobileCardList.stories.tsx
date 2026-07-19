import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card/MobileCardListItem";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";

interface SampleRow {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
}

const sampleRows: SampleRow[] = [
  { id: "1", title: "Ahmed Hassan", subtitle: "Active · 12 classes remaining" },
  { id: "2", title: "Sara Al-Mansour", subtitle: "Pending · 8 classes remaining" },
  { id: "3", title: "Omar Khalid", subtitle: "Active · 20 classes remaining" },
];

const meta: Meta<typeof MobileCardList<SampleRow>> = {
  title: "UI/CardList/Mobile",
  component: MobileCardList,
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
  args: {
    rows: sampleRows,
    getKey: (row: SampleRow) => row.id,
    renderItem: (row: SampleRow) => (
      <MobileCardListItem variant="edge-to-edge">
        <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>{row.title}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {row.subtitle}
        </Typography>
      </MobileCardListItem>
    ),
    layout: "edge-to-edge",
    gap: 2,
    paginationOptions: { mode: "client" },
  },
};

export default meta;
type Story = StoryObj<typeof MobileCardList<SampleRow>>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    rows: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    rows: [],
    emptyMessage: "No students found matching your filters.",
  },
};

export const WithPagination: Story = {
  args: {
    paginationOptions: {
      mode: "server",
      page: 1,
      pageSize: 10,
      totalCount: 48,
      onPageChange: () => {},
    },
  },
};

export const RoundedLayout: Story = {
  args: {
    layout: "rounded",
    renderItem: (row: SampleRow) => (
      <MobileCardListItem variant="rounded">
        <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>{row.title}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {row.subtitle}
        </Typography>
      </MobileCardListItem>
    ),
  },
};
