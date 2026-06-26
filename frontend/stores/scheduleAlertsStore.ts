// cspell:disable
import { create } from "zustand";
import type { AcademicClassRow, AlertsMetric, ScheduleAlert } from "@/frontend/views/dashboard/schedule/alerts/types";

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

export const useScheduleAlertsStore = create<ScheduleAlertsState>(set => ({
  alerts: [],
  metrics: [],
  classes: [],
  totalClasses: 0,
  currentPage: 1,
  pageSize: 4,
  joinSession: (_id: string) => {},
  leaveClass: (_id: string) => {},
  setPage: (page: number) => {
    set({ currentPage: page });
  },
}));
