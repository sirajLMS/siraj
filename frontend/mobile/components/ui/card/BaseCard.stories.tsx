import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { BaseCard } from "@/frontend/mobile/components/ui/card/BaseCard";

/**
 * Low-level mobile BaseCard (not barrel-exported as MobileBaseCard).
 * Distinct from UI/Card/Mobile/BaseCard which covers MobileBaseCard.
 */
const meta: Meta<typeof BaseCard> = {
  title: "UI/BaseCardCore/Mobile",
  component: BaseCard,
  tags: ["ai-generated"],
  args: {
    children: (
      <Typography variant="body1">
        Low-level mobile BaseCard — theme radius, border, and shadow. Used internally by MobileMetricCard.
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
type Story = StoryObj<typeof BaseCard>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
  },
};

export const EdgeToEdge: Story = {
  args: {
    edgeToEdge: true,
  },
};
