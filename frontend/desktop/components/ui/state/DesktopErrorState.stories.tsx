import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopErrorState } from "@/frontend/desktop/components/ui/state/DesktopErrorState";

const meta: Meta<typeof DesktopErrorState> = {
  title: "UI/ErrorState/Desktop",
  component: DesktopErrorState,
  tags: ["ai-generated"],
  argTypes: {
    onRetry: { action: "retry" },
  },
  args: {
    message: "Failed to load data. Please try again.",
  },
};

export default meta;
type Story = StoryObj<typeof DesktopErrorState>;

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
