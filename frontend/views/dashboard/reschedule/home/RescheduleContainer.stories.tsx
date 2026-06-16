import type { Meta, StoryObj } from "@storybook/react";
import { RescheduleContainer } from "./RescheduleContainer";

const meta: Meta<typeof RescheduleContainer> = {
  title: "Views/dashboard/reschedule/home/RescheduleContainer",
  component: RescheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof RescheduleContainer>;

export const Default: Story = {
  args: {},
};
