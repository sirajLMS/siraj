import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

const meta = {
  title: "Desktop/Input/TeacherAutocomplete",
  component: TeacherAutocompleteDesktop,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TeacherAutocompleteDesktop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: null,
    onChange: () => undefined,
  },
};
