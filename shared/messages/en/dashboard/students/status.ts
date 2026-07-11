import type { StudentStatusLabels } from "@/shared/messages/types/dashboard/students";

export const status: StudentStatusLabels = {
  pageTitle: "Student Status & Schedule Hold",
  studentId: "ID: #{id}",
  breadcrumbs: {
    students: "Students",
    statusHold: "Status & Hold",
  },
  sections: {
    adminHold: "Administrative Hold",
    policyOverview: "Policy Overview",
    upcomingClasses: "Upcoming Classes",
    upcomingClassesMobile: "Upcoming Classes",
  },
  fields: {
    accountStatus: "New Account Status",
    statusReason: "Reason for Change",
    statusReasonPlaceholder: "Enter administrative justification...",
    quickReasons: "Quick Reasons",
  },
  validation: {
    reasonMinLength: "Reason must be at least 5 characters long",
  },
  statusOptions: {
    REGULAR: "Regular / Active",
    SUSPENDED: "Suspended (Financial/Disciplinary)",
    ON_LEAVE: "On Leave (Medical/Planned)",
    ON_TRIAL: "On Trial",
    DEACTIVATED: "Deactivated",
  },
  reasons: {
    unpaidInvoice: "Unpaid Invoice",
    misconduct: "Misconduct",
    vacation: "Vacation",
  },
  actions: {
    applyChange: "Apply Status Change",
    viewHistory: "View History",
    contactParent: "Contact Parent",
    viewAll: "View All",
  },
  table: {
    subjectInstructor: "Subject / Instructor",
    dateTime: "Date & Time",
    holdStatus: "Hold status",
    status: "Status",
    pendingHolds: "{count} pending holds",
    footerInfo: "End of upcoming classes for {id}",
    noUpcomingClasses: "No upcoming classes",
    frozen: "Frozen",
    active: "Active",
    minutesShort: "{minutes}m",
    sessionEnded: "Session ended",
    joinSession: "Join Session",
  },
  policies: {
    suspensionTitle: "Suspension",
    suspensionDesc: "Stops the billing engine completely and closes all student portal access permissions immediately.",
    onLeaveTitle: "On Leave",
    onLeaveDesc: "Preserves enrollment records but pauses class scheduling. Billing may be prorated.",
  },
  warning: {
    title: "Warning: Account Suspension Pending",
    description:
      "Changing status to 'Suspended' will trigger an immediate full system lock. All upcoming classes will be frozen, preventing teachers from starting sessions. The billing engine for this ID will be halted until manually reactivated.",
  },
  successMessage: "Student status updated successfully.",
  errors: {
    invalidId: "Invalid student ID.",
  },
};
