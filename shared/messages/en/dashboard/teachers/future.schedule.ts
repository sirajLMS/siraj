import type { TeacherFutureScheduleLabels } from "@/shared/messages/types/dashboard/teachers";

export const futureSchedule: TeacherFutureScheduleLabels = {
  pageTitle: "Future Schedule",
  monthlyFilter: {
    jumpToDate: "Jump to Date",
  },
  quotaInfo: {
    leaveQuota: "Leave Quota",
    totalClasses: "Total Classes",
    futureClasses: "Future Classes",
  },
  classTable: {
    headers: {
      available: "Available",
      regular: "Regular",
      reScheduled: "Rescheduled",
      requestLeave: "Request Leave",
      viewMaterials: "View Materials",
    },
  },
  quotaAlerts: {
    quotaReached: "You have reached your leave quota.",
    remaining: "Remaining quota: {count}",
  },
  notes: {
    importantNotes: "Important Notes",
    supportContact: "Contact Support",
    contactAdmin: "Contact an administrator for assistance.",
    defaultLeaveReason: "Not specified",
  },
  monthDisplay: "{month} {year}",
  leaveQuotaDesc: "You can request leave for {count} classes.",
  totalClassesDesc: "You have {count} classes scheduled.",
  loading: "Loading schedule...",
  students: "Students",
  errors: {
    quotaExceeded: "Cannot request leave: quota exceeded.",
    leaveRequestFailed: "Failed to request leave.",
    failedToLoad: "Failed to load schedule.",
    supportRequestFailed: "Failed to submit support request.",
  },
  notifications: {
    noSubjectAssigned: "This class has no subject assigned.",
    supportRequestSent: "Support request sent.",
    leaveRequested: "Leave request submitted.",
  },
};
