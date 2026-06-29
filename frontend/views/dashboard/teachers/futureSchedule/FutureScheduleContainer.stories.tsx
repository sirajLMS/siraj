import type { Meta, StoryObj } from "@storybook/react";
import { logger } from "@/frontend/utils/logger";
import { FutureScheduleView } from "./FutureScheduleView";
import type { ImportantNoteItem, SupportContactData } from "./types";

const MOCK_NOTES: readonly ImportantNoteItem[] = [
  {
    id: "n-1",
    title: "Quarterly Review",
    body: "Oct 26 • All day event",
    priority: 1,
    startsAt: null,
    expiresAt: null,
  },
  { id: "n-2", title: "Final Exam Submission", body: "Due in 4 days", priority: 0, startsAt: null, expiresAt: null },
];

const MOCK_CONTACT: SupportContactData = {
  id: "sc-1",
  name: "Sarah Jenkins",
  role: "Faculty Coordinator",
  avatarUrl: "/demo/avatars/01.png",
  phone: null,
  skypeId: null,
};

const MOCK_CLASSES = [
  {
    __typename: "FutureClass" as const,
    id: "fc-1",
    courseName: "Advanced Mathematics - Group A",
    isRescheduled: true,
    startTime: "09:00 AM",
    endTime: "10:30 AM",
    scheduledDate: "2026-07-01",
    location: "Virtual Room 12",
    studentCount: 18,
    durationMinutes: 90,
    leaveRequestDisabled: true,
    leaveRequestDisabledReason: "time",
    subjectId: null,
    subjectName: null,
    classType: null,
    zoomMeetingUrl: null,
  },
  {
    __typename: "FutureClass" as const,
    id: "fc-2",
    courseName: "Physics 101: Mechanics",
    isRescheduled: false,
    startTime: "11:00 AM",
    endTime: "12:30 PM",
    scheduledDate: "2026-07-01",
    location: "Hall B - Campus",
    studentCount: 24,
    durationMinutes: 90,
    leaveRequestDisabled: false,
    leaveRequestDisabledReason: null,
    subjectId: null,
    subjectName: null,
    classType: null,
    zoomMeetingUrl: null,
  },
  {
    __typename: "FutureClass" as const,
    id: "fc-3",
    courseName: "Intro to Arabic Literature",
    isRescheduled: true,
    startTime: "02:00 PM",
    endTime: "03:30 PM",
    scheduledDate: "2026-07-02",
    location: "Virtual Room 04",
    studentCount: 12,
    durationMinutes: 90,
    leaveRequestDisabled: true,
    leaveRequestDisabledReason: "quota",
    subjectId: null,
    subjectName: null,
    classType: null,
    zoomMeetingUrl: null,
  },
];

export function MockFutureScheduleContainer() {
  return (
    <FutureScheduleView
      classes={MOCK_CLASSES}
      leaveQuotaUsed={0}
      leaveQuotaTotal={2}
      totalClasses={12}
      onRequestLeave={async id => {
        logger.info({ caller: "MockFutureScheduleContainer" }, `Request leave for: ${id}`);
      }}
      selectedDate={new Date().toISOString().split("T")[0]}
      onDateChange={() => {}}
      notes={MOCK_NOTES}
      contact={MOCK_CONTACT}
      onViewMaterials={() => {}}
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
