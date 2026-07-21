import type { Meta, StoryObj } from "@storybook/react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar/MobileFormSuccessSnackbar";

const meta: Meta<typeof MobileFormSuccessSnackbar> = {
  title: "UI/FormSuccessSnackbar/Mobile",
  component: MobileFormSuccessSnackbar,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  args: {
    open: true,
    message: "Profile updated successfully!",
  },
  argTypes: {
    onClose: { action: "closed" },
  },
};

export default meta;
type Story = StoryObj<typeof MobileFormSuccessSnackbar>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    message: "All changes have been saved to the server and notifications were sent to the parents.",
  },
};
