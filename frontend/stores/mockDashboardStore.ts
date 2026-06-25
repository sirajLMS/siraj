import { create } from "zustand";
import type { ScheduleRow, TeacherFilterItem } from "@/frontend/views/dashboard/types/dashboard";
import { buildAdminDashboardMetrics } from "@/frontend/views/dashboard/dashboard/utils/adminDashboardMetrics";
import type { DashboardState } from "./dashboardStore";

const MOCK_TEACHERS: TeacherFilterItem[] = [
  { id: "teacher-ahmed", name: "Ahmed Mohammed" },
  { id: "teacher-sarah", name: "Sarah Johnson" },
];

const MOCK_METRICS = buildAdminDashboardMetrics({
  id: "metrics-mock",
  total: 42,
  regular: 28,
  trial: 8,
  advance: 4,
  rescheduled: 3,
  suspended: 1,
  taken: 22,
  pending: 12,
  activated: 5,
  running: 2,
  absent: 4,
  leave: 1,
});

const MOCK_SCHEDULE: ScheduleRow[] = [
  {
    id: "9082",
    classId: "#CLS-9082",
    student: "Omar Khalid",
    teacher: "Ahmed Mohammed",
    yourTime: "10:00 AM - 11:00 AM",
    teacherTime: "11:00 AM - 12:00 PM",
    studentTime: "10:00 AM - 11:00 AM",
    time: "10:00 AM - 11:00 AM",
    status: "scheduled",
  },
  {
    id: "9083",
    classId: "#CLS-9083",
    student: "Layla Ismail",
    teacher: "Sarah Johnson",
    yourTime: "11:30 AM - 12:30 PM",
    teacherTime: "12:30 PM - 01:30 PM",
    studentTime: "11:30 AM - 12:30 PM",
    time: "11:30 AM - 12:30 PM",
    status: "in_progress",
  },
  {
    id: "9084",
    classId: "#CLS-9084",
    student: "Omar Ahmed",
    teacher: "Ahmed Mohammed",
    yourTime: "02:00 PM - 03:00 PM",
    teacherTime: "03:00 PM - 04:00 PM",
    studentTime: "02:00 PM - 03:00 PM",
    time: "02:00 PM - 03:00 PM",
    status: "pending",
  },
];

export const useMockDashboardStore = create<DashboardState>(set => ({
  todayClasses: MOCK_METRICS,
  lastUpdated: "dashboard.admin.updatedMinutesAgo",
  filters: {
    date: "2023-10-27",
    teacherId: "",
    searchQuery: "",
    debouncedSearchQuery: "",
    selectedStatus: null,
  },
  scheduleRows: MOCK_SCHEDULE,
  teachers: MOCK_TEACHERS,
  pagination: {
    page: 0,
    totalItems: 42,
    pageSize: 3,
  },
  setDateFilter: (date: string) => {
    set(state => ({ filters: { ...state.filters, date } }));
  },
  setTeacherFilter: (teacherId: string) => {
    set(state => ({ filters: { ...state.filters, teacherId } }));
  },
  setSearchQuery: (searchQuery: string) => {
    set(state => ({ filters: { ...state.filters, searchQuery } }));
  },
  setDebouncedSearchQuery: (debouncedSearchQuery: string) => {
    set(state => ({ filters: { ...state.filters, debouncedSearchQuery } }));
  },
  setSelectedStatus: (selectedStatus: string | null) => {
    set(state => ({ filters: { ...state.filters, selectedStatus } }));
  },
  resetFilters: () => {
    set({
      filters: {
        date: "2023-10-27",
        teacherId: "",
        searchQuery: "",
        debouncedSearchQuery: "",
        selectedStatus: null,
      },
    });
  },
  setPage: (page: number) => {
    set(state => ({ pagination: { ...state.pagination, page } }));
  },
}));
