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
  carryover: {
    bulkAction: "Carryover Balance",
    linkedColumn: "Carryover",
    linkedChip: "Linked",
    dialog: {
      title: "Create carryover balances",
      intro:
        "The selected sessions are grouped per teacher and converted into carryover balances. Every session must be audited and not already linked.",
      teacherLine: (teacherName, count) => {
        if (count === 1) return `${teacherName} — 1 session`;
        return `${teacherName} — ${count} sessions`;
      },
      totalSessions: count => {
        if (count === 1) return "1 session selected";
        return `${count} sessions selected`;
      },
      confirm: "Create carryovers",
      cancel: "Cancel",
    },
  },
  emptyState: {
    title: "No session events match the current filters.",
    titleNoFilters: "No session events yet.",
    cta: "Clear filters",
  },
  accessDenied: {
    title: "You don't have permission to view this report",
    descriptionPrefix: "Ask an administrator to grant you the",
    descriptionSuffix: "permission to access session event audits.",
    statusChip: "403 · INSUFFICIENT_PERMISSIONS",
    backToDashboard: "Back to Dashboard",
    contactSupport: "Contact support",
  },
};
