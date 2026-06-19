import type { Meta, StoryObj } from "@storybook/react";
import { useTeacherScheduleStore } from "@/frontend/stores/mockTeacherScheduleStore";
import { logger } from "@/frontend/utils/logger";
import { FutureScheduleView } from "./FutureScheduleView";

export function MockFutureScheduleContainer() {
  const futureSchedule = useTeacherScheduleStore(state => state.futureSchedule);

  if (!futureSchedule) return null;

  return (
    <FutureScheduleView
      classes={futureSchedule.classes}
      leaveQuotaUsed={futureSchedule.leaveQuotaUsed}
      leaveQuotaTotal={futureSchedule.leaveQuotaTotal}
      totalClasses={futureSchedule.totalClasses}
      onRequestLeave={async (id) => {
        logger.info({ caller: "MockFutureScheduleContainer" }, `Request leave for: ${id}`);
      }}
      leaveError={null}
      onDismissError={() => {}}
    />
  );
}

const meta: Meta<typeof MockFutureScheduleContainer> = {
  title: "Views/dashboard/teachers/futureSchedule/FutureScheduleContainer",
  component: MockFutureScheduleContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockFutureScheduleContainer>;

export const Default: Story = {
  args: {},
};
