import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date/DesktopAppDatePicker";

const meta: Meta<typeof DesktopAppDatePicker> = {
  title: "UI/AppDatePicker/Desktop",
  component: DesktopAppDatePicker,
  tags: ["ai-generated"],
  args: {
    label: "Select Date",
  },
};

export default meta;
type Story = StoryObj<typeof DesktopAppDatePicker>;

export const Default: Story = {};

export const Arabic: Story = {
  globals: { locale: "ar" },
  args: {
    label: "اختر التاريخ",
  },
};
