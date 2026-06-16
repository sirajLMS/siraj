// cspell:disable
import { create } from "zustand";
import type { StudentProgressFeedItem, TeacherDashboardState, TeacherScheduleRow } from "./teacherDashboardTypes";

interface TeacherDashboardActiveState extends TeacherDashboardState {
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly welcomeDateSummary: string;
  readonly sessionsScheduledToday: number;
  readonly activateSession: (id: string) => void;
}

const INITIAL_ROWS: TeacherScheduleRow[] = [
  {
    id: "teacher-active-live",
    rowNumber: 1,
    classId: "SLMS-4412",
    studentName: "Laila Mansour",
    studentInitials: "LM",
    timeRange: "10:00 AM",
    courseTitle: "Advanced Data Structures",
    locationLabel: "Batch A-2023 • Room 402",
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
    locationLabel: "Batch B-2023 • Room 105",
    durationMinutes: 90,
    status: "pending",
    videoEnabled: true,
    activateEnabled: true,
  },
];

const PROGRESS_FEED: StudentProgressFeedItem[] = [
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

export const useTeacherDashboardActiveStore = create<TeacherDashboardActiveState>(set => ({
  metrics: {
    totalClasses: 148,
    activeSessions: 6,
    missedSlots: 2,
    completed: 112,
    studentsToday: 12,
  },
  scheduleRows: INITIAL_ROWS,
  missedAlert: null,
  scheduleDateLabel: "Tuesday, 24th October 2023",
  totalScheduledToday: 6,
  welcomeDateSummary: "Tuesday, 24th October 2023",
  sessionsScheduledToday: 6,
  progressFeed: PROGRESS_FEED,
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
