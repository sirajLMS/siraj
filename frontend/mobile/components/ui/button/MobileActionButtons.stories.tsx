import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MobileExportButton,
  MobileFilterButton,
  MobilePrimaryPageAction,
} from "@/frontend/mobile/components/ui/button/MobileActionButtons";

const mobileViewport = {
  defaultViewport: "mobile",
  viewports: {
    mobile: {
      name: "Mobile (375px)",
      styles: { width: "375px", height: "667px" },
    },
  },
} as const;

const meta: Meta = {
  title: "UI/ActionButtons/Mobile",
  tags: ["ai-generated"],
  parameters: {
    viewport: mobileViewport,
  },
};

export default meta;

export const PrimaryAction: StoryObj<typeof MobilePrimaryPageAction> = {
  render: args => <MobilePrimaryPageAction {...args} />,
  args: {
    children: "Add New Student",
    startIcon: <AddIcon />,
  },
};

export const Filter: StoryObj<typeof MobileFilterButton> = {
  render: args => <MobileFilterButton {...args} />,
  args: {
    children: "Filter",
    startIcon: <FilterListIcon />,
  },
};

export const Export: StoryObj<typeof MobileExportButton> = {
  render: args => <MobileExportButton {...args} />,
  args: {
    children: "Export CSV",
    startIcon: <DownloadIcon />,
  },
};
