import { create } from "zustand";
import type { MetricItem, ScheduleRow, TeacherFilterItem } from "@/frontend/views/dashboard/types/dashboard";

export interface DashboardFilters {
  readonly date: string;
  readonly teacherId: string;
  readonly searchQuery: string;
  readonly selectedStatus: string | null;
}

export interface Pagination {
  readonly page: number;
  readonly totalItems: number;
  readonly pageSize: number;
}

export interface DashboardState {
  readonly filters: DashboardFilters;
  readonly setDateFilter: (date: string) => void;
  readonly setTeacherFilter: (teacherId: string) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly setSelectedStatus: (status: string | null) => void;
  readonly resetFilters: () => void;

  // Mock properties (fully defined in both stores for clean type checking)
  readonly todayClasses: readonly MetricItem[];
  readonly lastUpdated: string;
  readonly scheduleRows: readonly ScheduleRow[];
  readonly teachers: readonly TeacherFilterItem[];
  readonly pagination: Pagination;
  readonly setPage: (page: number) => void;
}

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const useDashboardStore = create<DashboardState>(set => ({
  filters: {
    date: getTodayString(),
    teacherId: "",
    searchQuery: "",
    selectedStatus: null,
  },
  setDateFilter: date => set(state => ({ filters: { ...state.filters, date } })),
  setTeacherFilter: teacherId => set(state => ({ filters: { ...state.filters, teacherId } })),
  setSearchQuery: searchQuery => set(state => ({ filters: { ...state.filters, searchQuery } })),
  setSelectedStatus: selectedStatus => set(state => ({ filters: { ...state.filters, selectedStatus } })),
  resetFilters: () =>
    set({
      filters: {
        date: getTodayString(),
        teacherId: "",
        searchQuery: "",
        selectedStatus: null,
      },
    }),

  // Unused default mock values for the production store
  todayClasses: [],
  lastUpdated: "",
  scheduleRows: [],
  teachers: [],
  pagination: { page: 0, totalItems: 0, pageSize: 10 },
  setPage: _page => {},
}));
