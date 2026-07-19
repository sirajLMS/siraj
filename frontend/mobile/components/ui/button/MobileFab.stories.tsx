import { AddOutlined } from "@mui/icons-material";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { MobileFab } from "@/frontend/mobile/components/ui/button/MobileFab";

const meta: Meta<typeof MobileFab> = {
  title: "UI/Fab/Mobile",
  component: MobileFab,
  tags: ["ai-generated"],
  args: {
    icon: <AddOutlined />,
    label: "Add item",
    onClick: fn(),
  },
  globals: {
    viewport: "mobile",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileFab>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
