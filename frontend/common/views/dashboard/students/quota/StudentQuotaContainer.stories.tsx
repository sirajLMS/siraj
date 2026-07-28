import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StudentQuotaView } from "@/frontend/common/views/dashboard/students/quota/StudentQuotaContainer";

const meta: Meta<typeof StudentQuotaView> = {
  title: "Views/dashboard/students/quota/StudentQuotaView",
  component: StudentQuotaView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof StudentQuotaView>;

export const Default: Story = {
  args: {},
};
