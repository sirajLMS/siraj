import { create } from "zustand";
import type {
  ParentDashboardMetrics,
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/views/dashboard/parents/dashboard/types/parentDashboardTypes";

const DEFAULT_PAGE_SIZE = 10;

interface ParentDashboardState {
  readonly metrics: ParentDashboardMetrics;
  readonly scheduleRows: readonly ParentScheduleRow[];
  readonly studentProgress: readonly StudentProgressItem[];
  readonly workshopPromo: WorkshopPromo;
  readonly page: number;
  readonly pageSize: number;
  readonly scheduleTotalCount: number;
  setPage: (page: number) => void;
  setScheduleTotalCount: (count: number) => void;
}

export const useParentDashboardStore = create<ParentDashboardState>(set => ({
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
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  scheduleTotalCount: 0,
  setPage: page => set({ page }),
  setScheduleTotalCount: scheduleTotalCount => set({ scheduleTotalCount }),
}));
