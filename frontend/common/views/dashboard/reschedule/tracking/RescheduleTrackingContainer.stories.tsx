import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOCK_VIEW_MODEL } from "@/frontend/common/views/dashboard/reschedule/tracking/RescheduleTrackingContainer.stories.fixtures";
import { RescheduleTrackingView } from "@/frontend/common/views/dashboard/reschedule/tracking/RescheduleTrackingView";

export function MockRescheduleTrackingView() {
  return <RescheduleTrackingView {...MOCK_VIEW_MODEL} />;
}

const meta: Meta<typeof MockRescheduleTrackingView> = {
  title: "Views/dashboard/reschedule/tracking/RescheduleTrackingView",
  component: MockRescheduleTrackingView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockRescheduleTrackingView>;

export const Default: Story = {
  args: {},
};
