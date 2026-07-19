import type { Meta, StoryObj } from "@storybook/react";
import { MobileErrorState } from "@/frontend/mobile/components/ui/state/MobileErrorState";

const meta: Meta<typeof MobileErrorState> = {
  title: "UI/ErrorState/Mobile",
  component: MobileErrorState,
  tags: ["ai-generated"],
  argTypes: {
    onRetry: { action: "retry" },
  },
  args: {
    message: "Failed to load data. Please try again.",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
      viewports: {
        mobile: {
          name: "Mobile (375px)",
          styles: { width: "375px", height: "667px" },
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileErrorState>;

export const Embedded: Story = {
  args: {
    embedded: true,
  },
};

export const WithRetry: Story = {
  args: {
    embedded: true,
    message: "Failed to load data. Please try again.",
    retryLabel: "Retry",
  },
};

export const FullPage: Story = {
  args: {
    message: "Something went wrong on the server.",
  },
};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    embedded: true,
    message: "فشل تحميل البيانات. حاول مرة أخرى.",
    retryLabel: "إعادة",
  },
};
