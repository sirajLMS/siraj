import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreateRecurringClassContainer } from "@/frontend/common/views/dashboard/classes/recurring/CreateRecurringClassContainer";

const meta: Meta<typeof CreateRecurringClassContainer> = {
  title: "Views/dashboard/classes/recurring/CreateRecurringClassContainer",
  component: CreateRecurringClassContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CreateRecurringClassContainer>;

export const Default: Story = {
  args: {},
};
