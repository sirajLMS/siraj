import type { Meta, StoryObj } from "@storybook/react";
import { StudentQuotaContainer } from "./StudentQuotaContainer";

const meta: Meta<typeof StudentQuotaContainer> = {
  title: "Views/dashboard/students/quota/StudentQuotaContainer",
  component: StudentQuotaContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof StudentQuotaContainer>;

export const Default: Story = {
  args: {},
};
