import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date/AppDatePicker";

const meta: Meta<typeof AppDatePicker> = {
  title: "Form/AppDatePicker",
  component: AppDatePicker,
  tags: ["ai-generated"],
  args: {
    label: "Select Date",
  },
};

export default meta;
type Story = StoryObj<typeof AppDatePicker>;

export const Default: Story = {};

export const Arabic: Story = {
  parameters: {
    locale: "ar",
  },
  args: {
    label: "اختر التاريخ",
  },
};
