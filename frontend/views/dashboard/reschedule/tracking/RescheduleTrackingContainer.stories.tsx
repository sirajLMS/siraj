import type { Meta, StoryObj } from "@storybook/react";
import { RescheduleTrackingContainer } from "./RescheduleTrackingContainer";

const meta: Meta<typeof RescheduleTrackingContainer> = {
  title: "Views/dashboard/reschedule/tracking/RescheduleTrackingContainer",
  component: RescheduleTrackingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof RescheduleTrackingContainer>;

export const Default: Story = {
  args: {},
};
