import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExportButton, FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button/ActionButtons";

const meta: Meta = {
  title: "UI/ActionButtons",
  tags: ["ai-generated"],
};

export default meta;

export const PrimaryAction: StoryObj<typeof PrimaryPageAction> = {
  render: args => <PrimaryPageAction {...args} />,
  args: {
    children: "Add New Student",
    startIcon: <AddIcon />,
  },
};

export const Filter: StoryObj<typeof FilterButton> = {
  render: args => <FilterButton {...args} />,
  args: {
    children: "Filter",
    startIcon: <FilterListIcon />,
  },
};

export const Export: StoryObj<typeof ExportButton> = {
  render: args => <ExportButton {...args} />,
  args: {
    children: "Export CSV",
    startIcon: <DownloadIcon />,
  },
};
