import { Box, Button, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";

const meta: Meta<typeof DesktopSectionPanel> = {
  title: "UI/SectionPanel/Desktop",
  component: DesktopSectionPanel,
  tags: ["ai-generated"],
  args: {
    title: "Student Information",
    subTitle: "Personal details and academic records.",
    children: (
      <Typography variant="bodyMd">
        Content of the section panel goes here. It is wrapped in a M3-compliant Paper component with a specific
        background and border.
      </Typography>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof DesktopSectionPanel>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: <Button variant="text">Edit Info</Button>,
  },
};

export const ContentOnly: Story = {
  args: {
    title: undefined,
    subTitle: undefined,
  },
};

export const FlushContent: Story = {
  args: {
    title: undefined,
    subTitle: undefined,
    contentPadding: false,
    children: (
      <Box
        sx={theme => ({
          borderTop: `1px solid ${theme.palette.outlineVariant}`,
          p: 2,
          typography: "bodyMd",
        })}
      >
        Edge-to-edge content (e.g. data grids) with no inner panel padding.
      </Box>
    ),
  },
};

export const GridWithTitleBar: Story = {
  args: {
    title: "Parent Records",
    contentPadding: false,
    actions: <Button variant="text">Export</Button>,
    children: (
      <Box
        sx={theme => ({
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: `1px solid ${theme.palette.outlineVariant}`,
          typography: "bodyMd",
          color: theme.palette.text.secondary,
        })}
      >
        Data grid renders flush here (no side/bottom padding).
      </Box>
    ),
  },
};
