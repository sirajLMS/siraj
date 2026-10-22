import { InboxOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "@/frontend/common/components/ui/state/EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "UI/State/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: { title: "No sessions scheduled", icon: <InboxOutlined /> },
};

export const WithSubtitle: Story = {
  args: { title: "Nothing here yet", subtitle: "Content will appear once it is available." },
};

export const WithAction: Story = {
  args: {
    title: "No classes created",
    subtitle: "Get started by creating your first class schedule.",
    icon: <InboxOutlined />,
    action: <Button variant="contained">Create Class</Button>,
  },
};
