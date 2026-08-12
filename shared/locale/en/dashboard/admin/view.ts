import type { AdminViewLabels } from "@/shared/locale/types/dashboard/admin/view";

// Shared sub-objects — also used by classes/details.ts to avoid duplicate translations
const adminActions = {
  administrativeActions: "Administrative Actions",
  generateLog: "Generate Log",
  reschedule: "Reschedule",
  forceActivate: "Force Activate",
  stopPause: "Stop / Pause",
  deleteInstance: "Delete Instance",
  overrideRateButton: "Override Rate",
  disabledTooltips: {
    forceActivate: {
      activated: "Already activated",
      running: "Running - cannot force activate",
      completed: "Already completed",
    },
    stop: {
      notActivated: "Not yet activated",
      activated: "Activated but not started",
      completed: "Already completed",
    },
  },
} as const;

const classInfo = {
  liveInstance: "Live Instance",
  activeConnection: "Active Connection",
  student: "Student",
  moduleInstructor: "Module Instructor",
  viewSubject: "View subject",
} as const;

const metadata = {
  metadata: "Metadata",
  scheduledDate: "Scheduled Date",
  duration: "Duration",
  latency: "Latency",
  authorization: "Authorization",
  minutes: "minutes",
  optimal: "Optimal",
  unavailable: "Unavailable",
} as const;

const rate = {
  rateSectionTitle: "Effective Rate",
  effectiveRateLabel: "Hourly Rate",
  rateCurrencyLabel: "Currency",
  rateSourceLabel: "Rate Source",
  rateSourceOverride: "Override",
  rateSourceRecurring: "Recurring",
  rateSourceSubject: "Subject",
  rateSourceTeacher: "Teacher",
  overrideRateButton: "Override Rate",
  clearOverrideButton: "Clear Override",
  overrideRateDialogTitle: "Override Class Instance Rate",
  overrideRateDialogDescription:
    "Set a custom hourly rate for this specific class instance. Leave empty to clear override.",
  hourlyRateLabel: "Hourly Rate",
  currencyLabel: "Currency",
  saveButton: "Save",
  cancelButton: "Cancel",
  overrideSuccess: "Rate override applied successfully",
  overrideError: "Failed to apply rate override",
  clearSuccess: "Rate override cleared successfully",
  clearError: "Failed to clear rate override",
} as const;

export { adminActions, classInfo, metadata, rate };

export const dashboardAdminViewEn: AdminViewLabels = {
  admin: {
    pageTitle: "Admin Dashboard",
    roleLabel: "Admin Role",
  },
  timezone: {
    title: "Timezone Conflict Detected",
    message: (studentTimezone, teacherTimezone) =>
      `Student's local time (${studentTimezone}) differs from the teacher's (${teacherTimezone}). Attendance logging may lag.`,
  },
  adminActions,
  classInfo,
  metadata,
  performance: {
    livePerformanceOverview: "Live Performance Overview",
    last30Mins: "Last 30 mins",
    engagementScore: "Engagement Score",
    assessmentProgress: "Assessment Progress",
    focusLevel: "Focus Level",
    sessionHealth: "Session Health",
    noData: "No Data",
  },
  heatmap: {
    activityHeatmap: "Activity Heatmap",
    studentInput: "Student Input",
    teacherResponse: "Teacher Response",
    noData: "No Data",
  },
  rate,
};
