import { create } from "zustand";
import type { DailyScheduleList } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  AdminMetricKey,
  DashboardFilters,
  MetricItem,
  Pagination,
  TeacherFilterItem,
} from "@/frontend/common/types/shared.types";

export interface DashboardState {
  readonly filters: DashboardFilters;
  readonly setDateFilter: (date: string) => void;
  readonly setTeacherFilter: (teacherId: string) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly setDebouncedSearchQuery: (query: string) => void;
  readonly setSelectedStatus: (status: AdminMetricKey | null) => void;
  readonly resetFilters: () => void;

  // Mock properties (fully defined in both stores for clean type checking)
  readonly todayClasses: readonly MetricItem[];
  readonly lastUpdated: string;
  readonly scheduleRows: readonly DailyScheduleList[];
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
    debouncedSearchQuery: "",
    selectedStatus: null,
  },
  setDateFilter: date => set(state => ({ filters: { ...state.filters, date } })),
  setTeacherFilter: teacherId => set(state => ({ filters: { ...state.filters, teacherId } })),
  setSearchQuery: searchQuery => set(state => ({ filters: { ...state.filters, searchQuery } })),
  setDebouncedSearchQuery: debouncedSearchQuery =>
    set(state => ({ filters: { ...state.filters, debouncedSearchQuery } })),
  setSelectedStatus: selectedStatus => set(state => ({ filters: { ...state.filters, selectedStatus } })),
  resetFilters: () =>
    set({
      filters: {
        date: getTodayString(),
        teacherId: "",
        searchQuery: "",
        debouncedSearchQuery: "",
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
