import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LinkedClassInstancesList } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/LinkedClassInstancesList";
import type { MeetingConfigLinkedClassInstancesLabels } from "@/shared/locale/types/ui";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/LinkedClassInstancesList",
  component: LinkedClassInstancesList,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof LinkedClassInstancesList>;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: MeetingConfigLinkedClassInstancesLabels = {
  viewBookingsLink: "View bookings",
  linkedClassInstancesTitle: "Linked class instances",
  linkedClassInstancesEmpty: "No class instances linked to this meeting config.",
  urlPendingBadge: "URL pending",
  classInstanceTitle: "Untitled class instance",
  startTime: "Start time",
  meetingUrl: "Meeting URL",
};

const instances = [
  {
    id: "ci-1",
    title: "Arabic Grammar — Lesson 5",
    startTime: "2026-08-03T10:00:00Z",
    meetingJoinUrl: "https://zoom.us/j/123456789?pwd=abc",
  },
  {
    id: "ci-2",
    title: "Quran Recitation — Lesson 12",
    startTime: "2026-08-05T14:00:00Z",
    meetingJoinUrl: null,
  },
  {
    id: "ci-3",
    title: "",
    startTime: null,
    meetingJoinUrl: "https://zoom.us/j/987654321?pwd=def",
  },
];

export const WithInstances: Story = {
  args: {
    meetingConfigId: "mc-1",
    instances,
    labels,
  },
};

export const Empty: Story = {
  args: {
    meetingConfigId: "mc-2",
    instances: [],
    labels,
  },
};

export const EmptyWithCustomMessage: Story = {
  args: {
    meetingConfigId: "mc-3",
    instances: [],
    emptyMessage: "No upcoming classes scheduled for this configuration.",
    labels,
  },
};

export const Loading: Story = {
  args: {
    meetingConfigId: "mc-4",
    instances: [],
    loading: true,
    labels,
  },
};
