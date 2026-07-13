import type { Meta, StoryObj } from "@storybook/react";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time/AppTimePicker";

const meta: Meta<typeof AppTimePicker> = {
  title: "Form/AppTimePicker",
  component: AppTimePicker,
  tags: ["ai-generated"],
  args: {
    label: "Select Time",
  },
};

export default meta;
type Story = StoryObj<typeof AppTimePicker>;

export const Default: Story = {};

export const Arabic: Story = {
  parameters: {
    locale: "ar",
  },
  args: {
    label: "اختر الوقت",
  },
};
