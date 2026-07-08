import { Button, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { SectionPanel } from "../container/SectionPanel";

const meta: Meta<typeof SectionPanel> = {
  title: "UI/SectionPanel",
  component: SectionPanel,
  tags: ["ai-generated"],
  args: {
    title: "Student Information",
    subTitle: "Personal details and academic records.",
    children: (
      <Typography variant="body1">
        Content of the section panel goes here. It is wrapped in a M3-compliant Paper component with a specific
        background and border.
      </Typography>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof SectionPanel>;

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
