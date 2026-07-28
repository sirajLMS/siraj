import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopFormSuccessSnackbar } from "@/frontend/desktop/components/ui/form/snackbar/DesktopFormSuccessSnackbar";

const meta: Meta<typeof DesktopFormSuccessSnackbar> = {
  title: "UI/FormSuccessSnackbar/Desktop",
  component: DesktopFormSuccessSnackbar,
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
type Story = StoryObj<typeof DesktopFormSuccessSnackbar>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    message: "All changes have been saved to the server and notifications were sent to the parents.",
  },
};
