import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card/MobileBaseCard";

const meta: Meta<typeof MobileBaseCard> = {
  title: "UI/BaseCard/Mobile",
  component: MobileBaseCard,
  tags: ["ai-generated"],
  args: {
    children: (
      <Typography variant="body1">
        This is a MobileBaseCard component. It provides a standard container with theme-compliant radius, border, and
        shadow.
      </Typography>
    ),
  },
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
};

export default meta;
type Story = StoryObj<typeof MobileBaseCard>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
  },
};

export const Rounded: Story = {
  args: {
    edgeToEdge: false,
  },
};
