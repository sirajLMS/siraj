import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileAppDataGridLoadingOverlay } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGridLoadingOverlay";

const meta: Meta<typeof MobileAppDataGridLoadingOverlay> = {
  title: "UI/AppDataGridLoadingOverlay/Mobile",
  component: MobileAppDataGridLoadingOverlay,
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
      <Box sx={{ height: 200, position: "relative" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileAppDataGridLoadingOverlay>;

export const Default: Story = {
  args: {},
};
