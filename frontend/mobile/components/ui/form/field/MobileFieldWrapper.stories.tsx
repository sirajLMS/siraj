import { TextField } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { MobileFieldWrapper } from "@/frontend/mobile/components/ui/form/field/MobileFieldWrapper";

const meta: Meta<typeof MobileFieldWrapper> = {
  title: "UI/FieldWrapper/Mobile",
  component: MobileFieldWrapper,
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
  args: {
    label: "Email Address",
    children: <TextField fullWidth placeholder="Enter your email" size="small" />,
  },
};

export default meta;
type Story = StoryObj<typeof MobileFieldWrapper>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const ValidationError: Story = {
  args: {
    required: true,
    error: "Invalid email format.",
  },
};
