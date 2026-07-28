import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui/form/snackbar/DesktopFormErrorSnackbar";

const meta: Meta<typeof DesktopFormErrorSnackbar> = {
  title: "UI/FormErrorSnackbar/Desktop",
  component: DesktopFormErrorSnackbar,
  tags: ["ai-generated"],
  args: {
    open: true,
    message: "Failed to save changes. Please try again.",
  },
  argTypes: {
    onClose: { action: "closed" },
  },
};

export default meta;
type Story = StoryObj<typeof DesktopFormErrorSnackbar>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    message: "Unable to submit the form because one or more fields are invalid and the server rejected the request.",
  },
};
