import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { DesktopBaseCard } from "@/frontend/desktop/components/ui/card/DesktopBaseCard";

const meta: Meta<typeof DesktopBaseCard> = {
  title: "UI/BaseCard/Desktop",
  component: DesktopBaseCard,
  tags: ["ai-generated"],
  args: {
    children: (
      <Typography variant="body1">
        This is a BaseCard component. It provides a standard container with theme-compliant radius, border, and shadow.
      </Typography>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof DesktopBaseCard>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
  },
};
