import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopAppTimePicker } from "@/frontend/desktop/components/ui/form/time/DesktopAppTimePicker";

const meta: Meta<typeof DesktopAppTimePicker> = {
  title: "UI/AppTimePicker/Desktop",
  component: DesktopAppTimePicker,
  tags: ["ai-generated"],
  args: {
    label: "Select Time",
  },
};

export default meta;
type Story = StoryObj<typeof DesktopAppTimePicker>;

export const Default: Story = {};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    label: "اختر الوقت",
  },
};
