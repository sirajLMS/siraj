import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

const meta = {
  title: "Mobile/Input/TeacherAutocomplete",
  component: TeacherAutocompleteMobile,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TeacherAutocompleteMobile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: null,
    onChange: () => undefined,
  },
};
