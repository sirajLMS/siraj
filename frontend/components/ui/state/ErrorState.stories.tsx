import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState } from "@/frontend/components/ui/state/ErrorState";

const meta: Meta<typeof ErrorState> = {
  title: "UI/State/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
  argTypes: {
    onRetry: { action: "retry" },
  },
  args: {
    message: "Failed to load data. Please try again.",
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

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
