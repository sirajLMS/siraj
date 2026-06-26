import type { Meta, StoryObj } from "@storybook/react";
import { create } from "zustand";
import type { FutureClass } from "@/frontend/graphql/generated/gql/graphql-types";
import { logger } from "@/frontend/utils/logger";
import { FutureScheduleView } from "./FutureScheduleView";

interface FutureSchedule {
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
  readonly classes: readonly FutureClass[];
}

interface TeacherScheduleState {
  readonly futureSchedule: FutureSchedule | null;
  setFutureSchedule: (futureSchedule: FutureSchedule) => void;
}

const MOCK_FUTURE_SCHEDULE: FutureSchedule = {
  leaveQuotaUsed: 0,
  leaveQuotaTotal: 2,
  totalClasses: 12,
  classes: [
    {
      __typename: "FutureClass",
      id: "fc-1",
      courseName: "Advanced Mathematics - Group A",
      isRescheduled: true,
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      scheduledDate: "2023-10-24",
      location: "Virtual Room 12",
      studentCount: 18,
      durationMinutes: 90,
      leaveRequestDisabled: true,
      leaveRequestDisabledReason: "time",
    },
    {
      __typename: "FutureClass",
      id: "fc-2",
      courseName: "Physics 101: Mechanics",
      isRescheduled: false,
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      scheduledDate: "2023-10-24",
      location: "Hall B - Campus",
      studentCount: 24,
      durationMinutes: 90,
      leaveRequestDisabled: false,
      leaveRequestDisabledReason: null,
    },
    {
      __typename: "FutureClass",
      id: "fc-3",
      courseName: "Intro to Arabic Literature",
      isRescheduled: true,
      startTime: "02:00 PM",
      endTime: "03:30 PM",
      scheduledDate: "2023-10-25",
      location: "Virtual Room 04",
      studentCount: 12,
      durationMinutes: 90,
      leaveRequestDisabled: true,
      leaveRequestDisabledReason: "quota",
    },
  ],
};

const useTeacherScheduleStore = create<TeacherScheduleState>(set => ({
  futureSchedule: MOCK_FUTURE_SCHEDULE,
  setFutureSchedule: futureSchedule => {
    set({ futureSchedule });
  },
}));

export function MockFutureScheduleContainer() {
  const futureSchedule = useTeacherScheduleStore(state => state.futureSchedule);

  if (!futureSchedule) return null;

  return (
    <FutureScheduleView
      classes={futureSchedule.classes}
      leaveQuotaUsed={futureSchedule.leaveQuotaUsed}
      leaveQuotaTotal={futureSchedule.leaveQuotaTotal}
      totalClasses={futureSchedule.totalClasses}
      onRequestLeave={async id => {
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
