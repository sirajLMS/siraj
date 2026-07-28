import { Button, Typography } from "@mui/material";
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
