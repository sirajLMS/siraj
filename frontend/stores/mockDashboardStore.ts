import { create } from "zustand";
import { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/dashboard/types/schedule";
import { buildAdminDashboardMetrics } from "@/frontend/views/dashboard/dashboard/utils/adminDashboardMetrics";
import type { TeacherFilterItem } from "@/frontend/views/dashboard/types/dashboard";
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

const MOCK_SCHEDULE: DailyScheduleRow[] = [
  {
    id: "9082",
    yourTime: "10:00 AM - 11:00 AM",
    teacherTime: "11:00 AM - 12:00 PM",
    studentTime: "10:00 AM - 11:00 AM",
    duration: 60,
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.NotActivated,
    student: { id: "student-1", name: "Omar Khalid" },
    teacher: { id: "teacher-ahmed", name: "Ahmed Mohammed" },
  },
  {
    id: "9083",
    yourTime: "11:30 AM - 12:30 PM",
    teacherTime: "12:30 PM - 01:30 PM",
    studentTime: "11:30 AM - 12:30 PM",
    duration: 60,
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.Running,
    student: { id: "student-2", name: "Layla Ismail" },
    teacher: { id: "teacher-sarah", name: "Sarah Johnson" },
  },
  {
    id: "9084",
    yourTime: "02:00 PM - 03:00 PM",
    teacherTime: "03:00 PM - 04:00 PM",
    studentTime: "02:00 PM - 03:00 PM",
    duration: 60,
    outcome: ClassOutcome.Taken,
    executionState: ClassExecutionState.Completed,
    student: { id: "student-3", name: "Omar Ahmed" },
    teacher: { id: "teacher-ahmed", name: "Ahmed Mohammed" },
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
