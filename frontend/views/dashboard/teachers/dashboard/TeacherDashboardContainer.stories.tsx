import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { create } from "zustand";
import type {
  StudentProgressFeedItem,
  TeacherDashboardState,
  TeacherScheduleRow,
} from "@/frontend/stores/teacherDashboardTypes";
import { useUserStore } from "@/frontend/stores/userStore";
import { getTodayScheduleFilterDate } from "@/frontend/utils/scheduleFilterDate";
import { TeacherDashboardActiveView } from "./TeacherDashboardActiveView";
import { TeacherDashboardView } from "./TeacherDashboardView";
import { buildTeacherDashboardLabels } from "./utils/buildTeacherDashboardLabels";

const STANDARD_INITIAL_STATE: TeacherDashboardState = {
  metrics: {
    totalClasses: 8,
    missedSlots: 2,
    completed: 3,
    studentsToday: 14,
  },
  scheduleRows: [
    {
      id: "teacher-session-1",
      rowNumber: 1,
      classId: "SLMS-9821",
      studentName: "Zaid Salman",
      studentInitials: "ZS",
      timeRange: "08:00 AM - 09:00 AM",
      status: "missed",
      videoEnabled: true,
      activateEnabled: false,
    },
    {
      id: "teacher-session-2",
      rowNumber: 2,
      classId: "SLMS-4412",
      studentName: "Laila Mansour",
      studentInitials: "LM",
      timeRange: "10:30 AM - 11:30 AM",
      status: "upcoming",
      videoEnabled: true,
      activateEnabled: false,
    },
    {
      id: "teacher-session-3",
      rowNumber: 3,
      classId: "SLMS-3390",
      studentName: "Omar Abbas",
      studentInitials: "OA",
      timeRange: "12:00 PM - 01:00 PM",
      status: "upcoming",
      videoEnabled: true,
      activateEnabled: false,
    },
    {
      id: "teacher-session-4",
      rowNumber: 4,
      classId: "SLMS-1102",
      studentName: "Fatima Hadi",
      studentInitials: "FH",
      timeRange: "02:30 PM - 03:30 PM",
      status: "completed",
      videoEnabled: false,
      activateEnabled: false,
    },
  ],
  missedAlert: {
    classId: "SLMS-9821",
    scheduledTime: "08:00 AM",
  },
  scheduleDateLabel: "Monday, October 23, 2023",
  totalScheduledToday: 8,
};

interface TeacherDashboardActiveState extends TeacherDashboardState {
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly welcomeDateSummary: string;
  readonly sessionsScheduledToday: number;
  readonly activateSession: (id: string) => void;
}

const ACTIVE_INITIAL_ROWS: TeacherScheduleRow[] = [
  {
    id: "teacher-active-live",
    rowNumber: 1,
    classId: "SLMS-4412",
    studentName: "Laila Mansour",
    studentInitials: "LM",
    timeRange: "10:00 AM",
    courseTitle: "Advanced Data Structures",
    locationLabel: "Batch A-2023 \u2022 Room 402",
    durationMinutes: 60,
    status: "activated",
    videoEnabled: true,
    activateEnabled: false,
    isLive: true,
    isCurrent: true,
  },
  {
    id: "teacher-active-done",
    rowNumber: 2,
    classId: "SLMS-1102",
    studentName: "Ahmed Khalid",
    studentInitials: "AK",
    timeRange: "08:00 AM",
    durationMinutes: 60,
    status: "completed",
    videoEnabled: false,
    activateEnabled: false,
  },
  {
    id: "teacher-active-upcoming",
    rowNumber: 3,
    classId: "SLMS-3390",
    studentName: "Omar Abbas",
    studentInitials: "OA",
    timeRange: "11:30 AM",
    courseTitle: "Discrete Mathematics",
    locationLabel: "Batch B-2023 \u2022 Room 105",
    durationMinutes: 90,
    status: "pending",
    videoEnabled: true,
    activateEnabled: true,
  },
];

const ACTIVE_PROGRESS_FEED: StudentProgressFeedItem[] = [
  {
    id: "feed-1",
    studentName: "John Doe",
    studentInitials: "JD",
    summary: "Submitted Assignment: Graph Theory Basics",
    timeAgo: "2m ago",
    icon: "description",
  },
  {
    id: "feed-2",
    studentName: "Sarah Miller",
    studentInitials: "SM",
    summary: "Passed Quiz: Linear Algebra (92%)",
    timeAgo: "15m ago",
    icon: "grade",
  },
  {
    id: "feed-3",
    studentName: "Ryan Khan",
    studentInitials: "RK",
    summary: "Joined Advanced Data Structures session",
    timeAgo: "1h ago",
    icon: "login",
  },
];

function applyConnectingState(rows: readonly TeacherScheduleRow[], id: string): TeacherScheduleRow[] {
  return rows.map(row => {
    if (row.id === id && row.status === "pending") {
      return { ...row, status: "connecting", activateEnabled: false };
    }
    return row;
  });
}

function applyActivatedState(rows: readonly TeacherScheduleRow[], id: string): TeacherScheduleRow[] {
  return rows.map(row => {
    if (row.id === id && row.status === "connecting") {
      return {
        ...row,
        status: "activated",
        activateEnabled: false,
        videoEnabled: true,
        isLive: true,
        isCurrent: true,
      };
    }
    return row;
  });
}

const useTeacherDashboardStore = create<TeacherDashboardState>(() => STANDARD_INITIAL_STATE);

const useTeacherDashboardActiveStore = create<TeacherDashboardActiveState>(set => ({
  metrics: {
    totalClasses: 148,
    activeSessions: 6,
    missedSlots: 2,
    completed: 112,
    studentsToday: 12,
  },
  scheduleRows: ACTIVE_INITIAL_ROWS,
  missedAlert: null,
  scheduleDateLabel: "Tuesday, 24th October 2023",
  totalScheduledToday: 6,
  welcomeDateSummary: "Tuesday, 24th October 2023",
  sessionsScheduledToday: 6,
  progressFeed: ACTIVE_PROGRESS_FEED,
  activateSession: (id: string) => {
    set(state => ({
      scheduleRows: applyConnectingState(state.scheduleRows, id),
    }));

    setTimeout(() => {
      set(state => ({
        scheduleRows: applyActivatedState(state.scheduleRows, id),
      }));
    }, 1500);
  },
}));

interface MockTeacherDashboardContainerProps {
  readonly mode?: "standard" | "active";
}

export function MockTeacherDashboardContainer({ mode = "standard" }: MockTeacherDashboardContainerProps) {
  const t = useTranslations("dashboard.teacherDashboard");
  const userName = useUserStore(state => state.name);

  const standardStore = useTeacherDashboardStore();
  const activeStore = useTeacherDashboardActiveStore();
  const labels = buildTeacherDashboardLabels(t);

  if (mode === "active") {
    const feed = activeStore.progressFeed.map(f => ({
      id: f.id,
      studentName: f.studentName,
      studentInitials: f.studentInitials,
      summary: f.summary,
      timeAgo: f.timeAgo,
      icon: f.icon,
    }));

    return (
      <TeacherDashboardActiveView
        userName={userName}
        metrics={activeStore.metrics}
        scheduleRows={activeStore.scheduleRows}
        progressFeed={feed}
        welcomeDateSummary={activeStore.welcomeDateSummary}
        sessionsScheduledToday={activeStore.sessionsScheduledToday}
        labels={labels}
        lastUpdated="Updated just now"
        onActivate={id => alert(`Activated session ${id}`)}
        onNewSession={() => alert("New session clicked")}
        onStartSession={id => alert(`Start session ${id}`)}
        onMarkAbsent={id => alert(`Mark absent ${id}`)}
        onRequestLeave={id => alert(`Request leave ${id}`)}
        dateValue={getTodayScheduleFilterDate()}
        onDateChange={() => {}}
      />
    );
  }

  return (
    <TeacherDashboardView
      metrics={standardStore.metrics}
      scheduleRows={standardStore.scheduleRows}
      missedAlert={standardStore.missedAlert}
      scheduleDateLabel={standardStore.scheduleDateLabel}
      labels={labels}
      lastUpdated="Updated just now"
      canActivate={true}
      canManualEntry={true}
      canPrintSchedule={true}
      onPrintSchedule={() => globalThis.print()}
      onManualEntry={() => alert("Manual entry clicked")}
      onJoinVideo={id => alert(`Join video for ${id}`)}
      onActivate={id => alert(`Activated session ${id}`)}
      onDownloadHandbook={() => alert("Download handbook clicked")}
      onContactCoordinator={() => alert("Contact coordinator clicked")}
      onSupport={() => alert("Live support clicked")}
      dateValue={getTodayScheduleFilterDate()}
      onDateChange={() => {}}
    />
  );
}

const meta: Meta<typeof MockTeacherDashboardContainer> = {
  title: "Views/dashboard/teachers/dashboard/TeacherDashboardContainer",
  component: MockTeacherDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockTeacherDashboardContainer>;

export const Standard: Story = {
  args: {
    mode: "standard",
  },
};

export const Active: Story = {
  args: {
    mode: "active",
  },
};
