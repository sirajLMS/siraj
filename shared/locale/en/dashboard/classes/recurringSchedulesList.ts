import type { RecurringSchedulesListLabels } from "@/shared/locale/types/dashboard/classes/recurringSchedulesList";

export const recurringSchedulesList: RecurringSchedulesListLabels = {
  shell: {
    pageTitle: "Recurring Schedules",
    subtitle: "Manage recurring class schedules",
    breadcrumbDashboard: "Dashboard",
    breadcrumbClasses: "Classes",
    emptyMessage: "No recurring schedules found",
    loadError: "Failed to load recurring schedules",
  },
  columns: {
    student: "Student",
    teacher: "Teacher",
    schedule: "Schedule",
    duration: "Duration",
    durationMinutesShort: minutes => `${minutes} min`,
    rate: "Rate",
    actions: "Actions",
  },
  actions: {
    view: "View",
    edit: "Edit",
  },
  filters: {
    searchPlaceholder: "Search by student or teacher...",
    searchLabel: "Search",
  },
};
