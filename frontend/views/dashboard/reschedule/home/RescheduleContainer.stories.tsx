import type { Meta, StoryObj } from "@storybook/react";
import { IanaTimezone } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useRescheduleStore } from "@/frontend/common/stores/rescheduleStore";
import { RescheduleView } from "@/frontend/views/dashboard/reschedule/home/RescheduleView";

useRescheduleStore.setState({
  session: {
    sessionId: "cls-001",
    teacherName: "Fatima Al-Rashid",
    studentName: "Ahmed Hassan",
    teacherTimezone: IanaTimezone.AsiaRiyadh,
  },
});

export function MockRescheduleContainer() {
  const session = useRescheduleStore(state => state.session);
  const isSubmitting = useRescheduleStore(state => state.isSubmitting);

  return (
    <RescheduleView
      session={session}
      defaultDate="2023-10-24"
      defaultTime="22:30"
      isSubmitting={isSubmitting}
      onSubmit={() => {}}
      onCancel={() => {}}
    />
  );
}

const meta: Meta<typeof MockRescheduleContainer> = {
  title: "Views/dashboard/reschedule/home/RescheduleContainer",
  component: MockRescheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockRescheduleContainer>;

export const Default: Story = {
  args: {},
};
