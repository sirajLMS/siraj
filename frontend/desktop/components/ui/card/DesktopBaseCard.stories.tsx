import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { BaseCard } from "@/frontend/common/components/ui";

const meta: Meta<typeof BaseCard> = {
  title: "UI/BaseCard/Desktop",
  component: BaseCard,
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
type Story = StoryObj<typeof BaseCard>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
  },
};
