import type { Meta, StoryObj } from "@storybook/react";
import { StatusTrackingContainer } from "./StatusTrackingContainer";

const meta: Meta<typeof StatusTrackingContainer> = {
  title: "Views/dashboard/classes/status/tracking/StatusTrackingContainer",
  component: StatusTrackingContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof StatusTrackingContainer>;

export const Default: Story = {
  args: {},
};
