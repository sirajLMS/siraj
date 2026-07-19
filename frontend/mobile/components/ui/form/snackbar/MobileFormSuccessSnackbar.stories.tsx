import type { Meta, StoryObj } from "@storybook/react";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar/MobileFormSuccessSnackbar";

const meta: Meta<typeof MobileFormSuccessSnackbar> = {
  title: "UI/FormSuccessSnackbar/Mobile",
  component: MobileFormSuccessSnackbar,
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
