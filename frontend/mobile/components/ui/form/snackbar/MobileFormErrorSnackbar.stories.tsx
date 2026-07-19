import type { Meta, StoryObj } from "@storybook/react";
import { MobileFormErrorSnackbar } from "@/frontend/mobile/components/ui/form/snackbar/MobileFormErrorSnackbar";

const meta: Meta<typeof MobileFormErrorSnackbar> = {
  title: "UI/FormErrorSnackbar/Mobile",
  component: MobileFormErrorSnackbar,
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
