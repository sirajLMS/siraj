import { TextField } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { FieldWrapper } from "@/frontend/common/components/ui/form/field/FieldWrapper";

const meta: Meta<typeof FieldWrapper> = {
  title: "Form/FieldWrapper",
  component: FieldWrapper,
  tags: ["ai-generated"],
  args: {
    label: "Email Address",
    children: <TextField fullWidth placeholder="Enter your email" size="small" />,
  },
};

export default meta;
type Story = StoryObj<typeof FieldWrapper>;

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
