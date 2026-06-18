import {
  AssignmentTurnedInOutlined,
  CalendarToday,
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventRepeatOutlined,
  GroupAddOutlined,
  HistoryOutlined,
  MenuBookOutlined,
  PendingActionsOutlined,
  PersonOffOutlined,
  QuizOutlined,
  ScienceOutlined,
} from "@mui/icons-material";
import { create } from "zustand";
import type { MetricItem, ScheduleRow, TeacherFilterItem } from "@/frontend/views/dashboard/types/dashboard";
import type { DashboardState } from "./dashboardStore";

const MOCK_TEACHERS: TeacherFilterItem[] = [
  { id: "teacher-ahmed", name: "Ahmed Mohammed" },
  { id: "teacher-sarah", name: "Sarah Johnson" },
];

const MOCK_METRICS: MetricItem[] = [
  { key: "total", count: 42, labelKey: "dashboard.admin.metrics.total", icon: CalendarToday },
  { key: "regular", count: 28, labelKey: "dashboard.admin.metrics.regular", icon: MenuBookOutlined },
  { key: "trial", count: 8, labelKey: "dashboard.admin.metrics.trial", icon: ScienceOutlined },
  { key: "evaluation", count: 4, labelKey: "dashboard.admin.metrics.evaluation", icon: AssignmentTurnedInOutlined },
  { key: "makeup", count: 2, labelKey: "dashboard.admin.metrics.makeup", icon: HistoryOutlined },
  { key: "testing", count: 5, labelKey: "dashboard.admin.metrics.testing", icon: QuizOutlined },
  { key: "pending", count: 12, labelKey: "dashboard.admin.metrics.pending", icon: PendingActionsOutlined },
  { key: "done", count: 22, labelKey: "dashboard.admin.metrics.done", icon: CheckCircleOutlineOutlined },
  { key: "rescheduled", count: 3, labelKey: "dashboard.admin.metrics.rescheduled", icon: EventRepeatOutlined },
  { key: "cancelled", count: 1, labelKey: "dashboard.admin.metrics.cancelled", icon: CancelOutlined },
  { key: "noShow", count: 4, labelKey: "dashboard.admin.metrics.noShow", icon: PersonOffOutlined },
  { key: "needCover", count: 1, labelKey: "dashboard.admin.metrics.needCover", icon: GroupAddOutlined },
];

const MOCK_SCHEDULE: ScheduleRow[] = [
  {
    classId: "#CLS-9082",
    student: "Omar Khalid",
    teacher: "Ahmed Mohammed",
    time: "10:00 AM - 11:00 AM",
    status: "scheduled",
  },
  {
    classId: "#CLS-9083",
    student: "Layla Ismail",
    teacher: "Sarah Johnson",
    time: "11:30 AM - 12:30 PM",
    status: "in_progress",
  },
  {
    classId: "#CLS-9084",
    student: "Omar Ahmed",
    teacher: "Ahmed Mohammed",
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
