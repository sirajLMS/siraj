import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports/sessionAudit";

export const dashboardReportsSessionAuditEn: SessionAuditLabels = {
  title: "Full Reports — Session Audit",
  filters: {
    teacher: "Teacher",
    student: "Student",
    dateRange: "Date range",
    dateFrom: "From",
    dateTo: "To",
    status: "Session status",
    search: "Search teacher / student",
    clear: "Clear filters",
    all: "All statuses",
  },
  column: {
    scheduledStart: "Scheduled start",
    openSessionTime: "Room entry",
    endSessionTime: "Room exit",
    durationAssumed: "Scheduled duration (min)",
    calculatedDuration: "Calculated duration (min)",
    paidAmount: "Paid amount",
    calculationStatus: "Calculation status",
    note: "Note",
  },
  status: {
    open: "Open",
    end: "Ended",
    Absent: "Teacher absent",
    absent_student: "Student absent",
  },
  cell: {
    notJoined: "Not joined",
    inProgress: "In progress",
    notCalculated: "—",
    viewFullNote: "View full note",
  },
  aggregate: {
    totalPaid: "Total paid",
    paidRows: "Paid rows",
    unpaidRows: "Unpaid rows",
  },
  action: {
    openAuditPage: "Open audit page",
    exportCsv: "Export CSV",
  },
  exportTruncated: "Export truncated to 10 000 rows.",
  tooltip: {
    rawUtc: value => `Raw UTC: ${value}`,
    bookingTimezone: value => `Booking timezone: ${value}`,
  },
  error: { dateRangeInvalid: "From date cannot be after To date." },
  emptyState: {
    title: "No session events match the current filters.",
    titleNoFilters: "No session events yet.",
    cta: "Clear filters",
  },
};
