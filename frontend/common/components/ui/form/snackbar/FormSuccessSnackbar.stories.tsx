import type { Meta, StoryObj } from "@storybook/react";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";

const meta: Meta<typeof FormSuccessSnackbar> = {
  title: "UI/FormSuccessSnackbar",
  component: FormSuccessSnackbar,
  tags: ["ai-generated"],
  args: {
    open: true,
    message: "Profile updated successfully!",
  },
  argTypes: {
    onClose: { action: "closed" },
  },
};

export default meta;
type Story = StoryObj<typeof FormSuccessSnackbar>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    message: "All changes have been saved to the server and notifications were sent to the parents.",
  },
};
