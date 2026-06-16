import {
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventBusyOutlined,
  EventRepeatOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { create } from "zustand";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

export type TrackingClassStatus = "rescheduled" | "pending_leave";

export interface TrackingRow {
  readonly id: string;
  readonly teacherName: string;
  readonly teacherId: string;
  readonly teacherInitials: string;
  readonly teacherAvatarUrl?: string;
  readonly studentClass: string;
  readonly scheduledDate: string;
  readonly dateLabel: "new_date" | "leave_request";
  readonly timeSlot: string;
  readonly status: TrackingClassStatus;
}

interface RescheduleTrackingFilters {
  readonly searchQuery: string;
  readonly status: TrackingClassStatus | "";
}

interface Pagination {
  readonly page: number;
  readonly totalItems: number;
  readonly pageSize: number;
}

interface RescheduleTrackingState {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly TrackingRow[];
  readonly filters: RescheduleTrackingFilters;
  readonly pagination: Pagination;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: TrackingClassStatus | "") => void;
  approveLeave: (id: string) => void;
  rejectLeave: (id: string) => void;
}

const MOCK_METRICS: MetricItem[] = [
  {
    key: "pending",
    count: 24,
    labelKey: "dashboard.rescheduleTracking.metrics.pendingRequests",
    icon: PendingActionsOutlined,
  },
  {
    key: "approved",
    count: 156,
    labelKey: "dashboard.rescheduleTracking.metrics.approvedClasses",
    icon: CheckCircleOutlineOutlined,
  },
  {
    key: "leave",
    count: 8,
    labelKey: "dashboard.rescheduleTracking.metrics.leaveRequests",
    icon: EventBusyOutlined,
  },
  {
    key: "rescheduled",
    count: 12,
    labelKey: "dashboard.rescheduleTracking.metrics.reScheduled",
    icon: EventRepeatOutlined,
    variant: "highlight",
  },
  {
    key: "cancelled",
    count: 3,
    labelKey: "dashboard.rescheduleTracking.metrics.cancelled",
    icon: CancelOutlined,
    variant: "danger",
  },
];

const MOCK_ROWS: TrackingRow[] = (
  [
    [
      "1",
      "Mohammad Al-Farsi",
      "T-10293",
      "MA",
      "01.png",
      "Grade 10 - Advanced Arabic",
      "Oct 24, 2023",
      "new_date",
      "04:00 PM - 05:00 PM",
      "rescheduled",
    ],
    [
      "2",
      "Sarah Omar",
      "T-10452",
      "SM",
      "02.png",
      "Grade 8 - Islamic Studies",
      "Oct 25, 2023",
      "leave_request",
      "02:30 PM - 03:30 PM",
      "pending_leave",
    ],
    [
      "3",
      "Rai Khan",
      "T-10881",
      "ZK",
      "07.png",
      "Grade 12 - Memo Program",
      "Oct 26, 2023",
      "new_date",
      "05:00 PM - 06:00 PM",
      "rescheduled",
    ],
    [
      "4",
      "Aisha Al-R",
      "T-10932",
      "AA",
      "04.png",
      "Grade 7 - Quran Memorization",
      "Oct 27, 2023",
      "leave_request",
      "09:00 AM - 10:00 AM",
      "pending_leave",
    ],
    [
      "5",
      "Omar Ahmed",
      "T-11001",
      "OF",
      "03.png",
      "Grade 11 - Islamic History",
      "Oct 28, 2023",
      "new_date",
      "01:00 PM - 02:00 PM",
      "rescheduled",
    ],
  ] as const
).map(([id, name, tId, init, avatar, cls, date, label, slot, status]) => ({
  id,
  teacherName: name,
  teacherId: tId,
  teacherInitials: init,
  teacherAvatarUrl: `/demo/avatars/${avatar}`,
  studentClass: cls,
  scheduledDate: date,
  dateLabel: label,
  timeSlot: slot,
  status,
}));

export const useRescheduleTrackingStore = create<RescheduleTrackingState>(set => ({
  metrics: MOCK_METRICS,
  rows: MOCK_ROWS,
  filters: {
    searchQuery: "",
    status: "",
  },
  pagination: {
    page: 0,
    totalItems: 20,
    pageSize: 5,
  },
  setSearchQuery: (searchQuery: string) => {
    set(state => ({ filters: { ...state.filters, searchQuery } }));
  },
  setStatusFilter: (status: TrackingClassStatus | "") => {
    set(state => ({ filters: { ...state.filters, status } }));
  },
  approveLeave: (id: string) => {
    set(state => ({
      rows: state.rows.map(row =>
        row.id === id ? { ...row, status: "rescheduled", dateLabel: "new_date" as const } : row
      ),
    }));
  },
  rejectLeave: (id: string) => {
    set(state => ({
      rows: state.rows.filter(row => row.id !== id),
    }));
  },
}));
