import { TextField } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { DesktopFieldWrapper } from "@/frontend/desktop/components/ui/form/field/DesktopFieldWrapper";

const meta: Meta<typeof DesktopFieldWrapper> = {
  title: "UI/FieldWrapper/Desktop",
  component: DesktopFieldWrapper,
  tags: ["ai-generated"],
  args: {
    label: "Email Address",
    children: <TextField fullWidth placeholder="Enter your email" size="small" />,
  },
};

export default meta;
type Story = StoryObj<typeof DesktopFieldWrapper>;

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
