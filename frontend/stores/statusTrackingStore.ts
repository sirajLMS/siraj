// cspell:disable
import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  EventAvailableOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { create } from "zustand";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

export type SessionStatus = "regular" | "suspended_pending" | "on_leave" | "pending_verification";

export interface StatusSessionRow {
  readonly id: string;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly studentAvatarUrl?: string;
  readonly className: string;
  readonly teacherName: string;
  readonly schedule: string;
  readonly status: SessionStatus;
  readonly holdNote?: string;
}

interface StatusTrackingState {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly StatusSessionRow[];
  readonly totalSessions: number;
  activateSession: (id: string) => void;
  verifySession: (id: string) => void;
}

const STATUS_METRICS: MetricItem[] = [
  {
    key: "regular",
    count: 1248,
    labelKey: "dashboard.statusTracking.metrics.regular",
    icon: CheckCircleOutlineOutlined,
  },
  {
    key: "pending",
    count: 84,
    labelKey: "dashboard.statusTracking.metrics.pending",
    icon: PendingActionsOutlined,
  },
  {
    key: "suspended",
    count: 32,
    labelKey: "dashboard.statusTracking.metrics.suspended",
    icon: BlockOutlined,
    variant: "error",
  },
  {
    key: "on_leave",
    count: 15,
    labelKey: "dashboard.statusTracking.metrics.onLeave",
    icon: EventAvailableOutlined,
  },
];

const MOCK_ROWS: StatusSessionRow[] = [
  {
    id: "s1",
    studentName: "Zaid Al-Harbi",
    studentInitials: "ZA",
    studentAvatarUrl: "/demo/avatars/01.png",
    className: "Intermediate Quran - Tajweed",
    teacherName: "Sheikh Omar Farouk",
    schedule: "10:30 AM - 11:30 AM",
    status: "regular",
  },
  {
    id: "s2",
    studentName: "Maryam Khan",
    studentInitials: "MK",
    studentAvatarUrl: "/demo/avatars/02.png",
    className: "Beginner Arabic Level 1",
    teacherName: "Ustaza Fatima Ali",
    schedule: "11:00 AM - 12:00 PM",
    status: "suspended_pending",
    holdNote: "Account suspended due to outstanding balance or policy violation. Contact billing.",
  },
  {
    id: "s3",
    studentName: "Sami Yusuf",
    studentInitials: "SY",
    studentAvatarUrl: "/demo/avatars/03.png",
    className: "Advanced Hifdh Section A",
    teacherName: "Hafiz Abdul Rahman",
    schedule: "11:45 AM - 01:00 PM",
    status: "on_leave",
  },
  {
    id: "s4",
    studentName: "Omar Saeed",
    studentInitials: "OS",
    className: "Islamic Studies Foundations",
    teacherName: "Dr. Ibrahim Khalil",
    schedule: "02:00 PM - 03:00 PM",
    status: "suspended_pending",
    holdNote: "Manual lock applied by Management. Session cannot be resumed without verification.",
  },
  {
    id: "s5",
    studentName: "Noor Ahmed",
    studentInitials: "NA",
    studentAvatarUrl: "/demo/avatars/05.png",
    className: "Female Only Tajweed Circle",
    teacherName: "Ustaza Sara Mansour",
    schedule: "03:30 PM - 04:30 PM",
    status: "pending_verification",
  },
];

export const useStatusTrackingStore = create<StatusTrackingState>(set => ({
  metrics: STATUS_METRICS,
  rows: MOCK_ROWS,
  totalSessions: 142,

  activateSession: (id: string) => {
    set(state => ({
      rows: state.rows.map(row => (row.id === id ? { ...row, status: "regular" as const } : row)),
    }));
  },

  verifySession: (id: string) => {
    set(state => ({
      rows: state.rows.map(row => (row.id === id ? { ...row, status: "regular" as const } : row)),
    }));
  },
}));
