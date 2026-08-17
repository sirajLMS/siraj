import type { AdminDashboardLabels } from "../../../types/dashboard/admin";

export const dashboardAdminEn: AdminDashboardLabels = {
  // ─── Static strings ────────────────────────────────────────────────
  pageTitle: "Dashboard",
  roleLabel: "Admin Dashboard",
  todayClasses: "Today's Classes",
  updatedJustNow: "Updated just now",
  scheduleOverview: "Schedule Overview",
  searchPlaceholder: "Search by student or class name...",
  listOfClassesOn: "List of Classes on",
  teacher: "Teacher",
  selectTeacher: "Select Teacher",
  submit: "Submit",
  classId: "Class ID",
  className: "Class",
  student: "Student",
  time: "Time",
  yourTime: "Your Time",
  teacherTime: "Teacher Time",
  studentTime: "Student Time",
  duration: "Duration",
  status: "Status",
  actions: "Actions",
  history: "History",
  details: "Details",
  joinVideo: "Join Class Session",
  noClasses: "No classes",
  loading: "Loading...",
  today: "Today",
  previousDay: "Previous Day",
  nextDay: "Next Day",
  previousPage: "Previous Page",
  nextPage: "Next Page",
  goToPage: "Go to page",
  dashboardOverview: "Dashboard Overview",
  viewAll: "View All",
  loadingTimeoutTitle: "Request Timeout",
  loadingTimeoutDesc: "Server took too long to respond. Please check your connection and try again.",
  unauthenticatedTitle: "Unauthenticated",
  unauthenticatedDesc: "Please sign in again to access the dashboard.",
  loadingFailedTitle: "Failed to Load Dashboard",
  loadingFailedDesc: "An unexpected error occurred while loading the schedule.",
  retryBtn: "Retry Loading",
  loginBtn: "Go to Login",

  timezoneOffsetDetail: {
    time: "Time",
    timezone: "Timezone",
    utcOffset: "UTC offset",
    yourOffset: "Your offset",
  },

  // ─── Interpolated → typed functions ────────────────────────────────

  // "{from}-{to} of {total}"
  paginationRange: (from, to, total) => `${from}–${to} of ${total}`,

  // "Page {current} of {total}"
  pageOf: (current, total) => `Page ${current} of ${total}`,

  // "Showing {shown} of {total} classes"
  showingOf: (shown, total) => `Showing ${shown} of ${total} classes`,

  /**
   * English plural rules (native TypeScript):
   *   1 → "Updated 1 minute ago"
   *   n → "Updated n minutes ago"
   */
  updatedMinutesAgo: minutes => (minutes === 1 ? "Updated 1 minute ago" : `Updated ${minutes} minutes ago`),

  // ─── Nested objects ─────────────────────────────────────────────────
  metrics: {
    total: "Total",
    regular: "Regular",
    trial: "Trial",
    advance: "Advance",
    rescheduled: "Rescheduled",
    suspended: "Suspended",
    taken: "Taken",
    pending: "Pending",
    activated: "Activated",
    running: "Running",
    absent: "Absent",
    leave: "Leave",
  },
  statusLabels: {
    PENDING: "Pending",
    TAKEN: "Taken",
    ABSENT: "Absent",
    LEAVE: "Leave",
    NOT_ACTIVATED: "Not Activated",
    ACTIVATED: "Activated",
    RUNNING: "Running",
    COMPLETED: "Completed",
    ON_DEMAND_CONFLICT_HELD: "Conflict Held",
    ON_DEMAND_NO_CREDITS_ABSENT: "No Credits (Absent)",
    ON_DEMAND_NO_CREDITS_CANCELLED: "No Credits (Cancelled)",
    ON_DEMAND_PENDING_CREDITS: "Pending Credit",
  },
};
