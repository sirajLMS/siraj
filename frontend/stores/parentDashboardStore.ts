// cspell:disable
import { create } from "zustand";

export type ParentBookingStatus = "confirmed" | "rescheduled";

export type ParentLiveClassStatus = "starting_soon" | "pending" | "scheduled";

export interface ParentScheduleRow {
  readonly id: string;
  readonly rowNumber: number;
  readonly classTime: string;
  readonly durationMinutes: number;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly studentAvatarUrl?: string;
  readonly teacherName: string;
  readonly bookingStatus: ParentBookingStatus;
  readonly liveClassStatus: ParentLiveClassStatus;
  readonly videoEnabled: boolean;
}

export interface StudentProgressItem {
  readonly id: string;
  readonly name: string;
  readonly completionPercent: number;
}

export interface ParentDashboardMetrics {
  readonly totalStudents: number;
  readonly todaysClasses: number;
  readonly pendingInvoicesCount: number;
  readonly pendingInvoicesAmount: string;
  readonly performanceAvg: number;
  readonly performanceAvgMobile: number;
  readonly pendingMessages: number;
}

export interface WorkshopPromo {
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string;
}

interface ParentDashboardState {
  readonly metrics: ParentDashboardMetrics;
  readonly scheduleRows: readonly ParentScheduleRow[];
  readonly studentProgress: readonly StudentProgressItem[];
  readonly workshopPromo: WorkshopPromo;
}

const SCHEDULE_ROWS: ParentScheduleRow[] = [
  {
    id: "parent-class-1",
    rowNumber: 1,
    classTime: "09:00 AM",
    durationMinutes: 45,
    studentName: "Yasin Ahmed",
    studentInitials: "YA",
    studentAvatarUrl: "/demo/avatars/01.png",
    teacherName: "Dr. Sarah Johnson",
    bookingStatus: "confirmed",
    liveClassStatus: "starting_soon",
    videoEnabled: true,
  },
  {
    id: "parent-class-2",
    rowNumber: 2,
    classTime: "10:30 AM",
    durationMinutes: 60,
    studentName: "Sara Ahmed",
    studentInitials: "SA",
    studentAvatarUrl: "/demo/avatars/02.png",
    teacherName: "Mr. Robert Chen",
    bookingStatus: "confirmed",
    liveClassStatus: "pending",
    videoEnabled: true,
  },
  {
    id: "parent-class-3",
    rowNumber: 3,
    classTime: "01:00 PM",
    durationMinutes: 45,
    studentName: "Yasin Ahmed",
    studentInitials: "YA",
    studentAvatarUrl: "/demo/avatars/01.png",
    teacherName: "Dr. Sarah Johnson",
    bookingStatus: "rescheduled",
    liveClassStatus: "scheduled",
    videoEnabled: false,
  },
];

const STUDENT_PROGRESS: StudentProgressItem[] = [
  { id: "progress-yasin", name: "Yasin Ahmed", completionPercent: 88 },
  { id: "progress-sara", name: "Sara Ahmed", completionPercent: 96 },
];

export const useParentDashboardStore = create<ParentDashboardState>(() => ({
  metrics: {
    totalStudents: 2,
    todaysClasses: 4,
    pendingInvoicesCount: 1,
    pendingInvoicesAmount: "120 SAR",
    performanceAvg: 92,
    performanceAvgMobile: 94,
    pendingMessages: 3,
  },
  scheduleRows: SCHEDULE_ROWS,
  studentProgress: STUDENT_PROGRESS,
  workshopPromo: {
    title: "New STEM Workshop Series",
    description: "Enroll Sara and Yasin in our upcoming weekend robotics and coding sessions starting next month.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida/AP1WRLvY6ZPHVzJaFbjC_8RwmqIIpmcmg6fFRULdEcSukhfaFr9AxByQTsM4jVxalR2O5KlUeC0V_akgjn1eavspeqqKbNmFX32tCWh3Zl4jbYcQDw9dYhx5IyTpkcgCsxuq5tMIjvr2x2jehv3G36JLqpKyXF28sZ4T3qAekBCfZf34ASTdbmCwJ8x2ztx1w9cSZ-NqOykd4ZpnRhOVN5GMxL6gHygGT4tg_SxvfHY0hZLliT28-IRjmtBxjo1j",
  },
}));
