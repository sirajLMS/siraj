import { create } from "zustand";
import type {
  ParentDashboardMetrics,
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/views/dashboard/parents/dashboard/types/parentDashboardTypes";

interface ParentDashboardState {
  readonly metrics: ParentDashboardMetrics;
  readonly scheduleRows: readonly ParentScheduleRow[];
  readonly studentProgress: readonly StudentProgressItem[];
  readonly workshopPromo: WorkshopPromo;
}

export const useParentDashboardStore = create<ParentDashboardState>(() => ({
  metrics: {
    totalStudents: 0,
    todaysClasses: 0,
    pendingInvoicesCount: 0,
    pendingInvoicesAmount: "",
    performanceAvg: 0,
    performanceAvgMobile: 0,
    pendingMessages: 0,
  },
  scheduleRows: [],
  studentProgress: [],
  workshopPromo: { title: "", description: "", imageUrl: "" },
}));
