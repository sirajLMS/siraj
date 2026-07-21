import type { Meta, StoryObj } from "@storybook/react";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MobileFormErrorSnackbar } from "@/frontend/mobile/components/ui/form/snackbar/MobileFormErrorSnackbar";

const meta: Meta<typeof MobileFormErrorSnackbar> = {
  title: "UI/FormErrorSnackbar/Mobile",
  component: MobileFormErrorSnackbar,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
  args: {
    open: true,
    message: "Failed to save changes. Please try again.",
  },
  argTypes: {
    onClose: { action: "closed" },
  },
};

export default meta;
type Story = StoryObj<typeof MobileFormErrorSnackbar>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    message: "Unable to submit the form because one or more fields are invalid and the server rejected the request.",
  },
};
