import { AutoStoriesOutlined, GroupsOutlined } from "@mui/icons-material";
import { create } from "zustand";

export type ScheduleAlertType = "leave_quota_exceeded" | "missed_class_time";

export interface ScheduleAlert {
  readonly id: string;
  readonly type: ScheduleAlertType;
  readonly pulse?: boolean;
}

export type ClassSessionAction = "join_session" | "leave_disabled" | "leave_enabled" | "view_recording";

export type ClassSessionStatus = "active" | "upcoming" | "missed";

export interface AcademicClassRow {
  readonly id: string;
  readonly className: string;
  readonly classId: string;
  readonly instructor: string;
  readonly time: string;
  readonly room: string;
  readonly action: ClassSessionAction;
  readonly sessionStatus: ClassSessionStatus;
}

export interface AlertsMetric {
  readonly key: string;
  readonly value: number | string;
  readonly labelKey: string;
  readonly subLabelKey: string;
  readonly icon: typeof GroupsOutlined;
  readonly trend?: string;
}

interface ScheduleAlertsState {
  readonly alerts: readonly ScheduleAlert[];
  readonly metrics: readonly AlertsMetric[];
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses: number;
  readonly currentPage: number;
  readonly pageSize: number;
  joinSession: (id: string) => void;
  leaveClass: (id: string) => void;
  setPage: (page: number) => void;
}

const MOCK_ALERTS: ScheduleAlert[] = [
  { id: "a1", type: "leave_quota_exceeded", pulse: true },
  { id: "a2", type: "missed_class_time" },
];

const MOCK_METRICS: AlertsMetric[] = [
  {
    key: "totalStudents",
    value: 1284,
    labelKey: "dashboard.scheduleAlerts.metrics.totalStudents",
    subLabelKey: "dashboard.scheduleAlerts.metrics.totalStudentsTrend",
    icon: GroupsOutlined,
    trend: "+12%",
  },
  {
    key: "activeCourses",
    value: 42,
    labelKey: "dashboard.scheduleAlerts.metrics.activeCourses",
    subLabelKey: "dashboard.scheduleAlerts.metrics.activeCoursesSub",
    icon: AutoStoriesOutlined,
  },
];

const MOCK_CLASSES: AcademicClassRow[] = (
  [
    [
      "c1",
      "Advanced Mathematics II",
      "MTH-402",
      "Dr. Robert Vance",
      "08:00 AM - 09:30 AM",
      "Auditorium A",
      "leave_disabled",
      "active",
    ],
    [
      "c2",
      "Intro to Computer Science",
      "CS-101",
      "Prof. Elena Wright",
      "10:00 AM - 11:30 AM",
      "Lab 402",
      "join_session",
      "upcoming",
    ],
    [
      "c3",
      "Classical Literature",
      "LIT-205",
      "Dr. Simon Glass",
      "01:00 PM - 02:30 PM",
      "Room 12B",
      "leave_disabled",
      "active",
    ],
    [
      "c4",
      "Macroeconomics 101",
      "ECO-110",
      "Prof. Marcus Thorn",
      "03:00 PM - 04:30 PM",
      "Main Hall",
      "join_session",
      "upcoming",
    ],
  ] as const
).map(([id, name, cId, instr, time, room, act, stat]) => ({
  id,
  className: name,
  classId: cId,
  instructor: instr,
  time,
  room,
  action: act,
  sessionStatus: stat,
}));

export const useScheduleAlertsStore = create<ScheduleAlertsState>(set => ({
  alerts: MOCK_ALERTS,
  metrics: MOCK_METRICS,
  classes: MOCK_CLASSES,
  totalClasses: 12,
  currentPage: 1,
  pageSize: 4,

  joinSession: (_id: string) => {
    // Join session logic in future
  },

  leaveClass: (_id: string) => {
    // Leave class logic in future
  },

  setPage: (page: number) => {
    set({ currentPage: page });
  },
}));
