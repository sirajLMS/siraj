import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import type { Meta, StoryObj } from "@storybook/react";
import {
  DesktopExportButton,
  DesktopFilterButton,
  DesktopPrimaryPageAction,
} from "@/frontend/desktop/components/ui/button/DesktopActionButtons";

const meta: Meta = {
  title: "UI/ActionButtons/Desktop",
  tags: ["ai-generated"],
};

export default meta;

export const PrimaryAction: StoryObj<typeof DesktopPrimaryPageAction> = {
  render: args => <DesktopPrimaryPageAction {...args} />,
  args: {
    children: "Add New Student",
    startIcon: <AddIcon />,
  },
};

export const Filter: StoryObj<typeof DesktopFilterButton> = {
  render: args => <DesktopFilterButton {...args} />,
  args: {
    children: "Filter",
    startIcon: <FilterListIcon />,
  },
};

export const Export: StoryObj<typeof DesktopExportButton> = {
  render: args => <DesktopExportButton {...args} />,
  args: {
    children: "Export CSV",
    startIcon: <DownloadIcon />,
  },
};
