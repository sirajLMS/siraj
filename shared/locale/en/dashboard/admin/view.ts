import type { AdminViewLabels } from "@/shared/locale/types/dashboard/admin/view";

export const dashboardAdminViewEn: AdminViewLabels = {
  admin: {
    pageTitle: "Admin Dashboard",
    roleLabel: "Admin Role",
  },
  timezone: {
    title: "Timezone",
    prefix: "Local time",
    suffix: "GMT+3",
  },
  adminActions: {
    administrativeActions: "Administrative Actions",
    generateLog: "Generate Log",
    reschedule: "Reschedule",
    forceActivate: "Force Activate",
    stopPause: "Stop / Pause",
    deleteInstance: "Delete Instance",
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
  },
  classInfo: {
    liveInstance: "Live Instance",
    activeConnection: "Active Connection",
    student: "Student",
    moduleInstructor: "Module Instructor",
    viewSubject: "View subject",
  },
  metadata: {
    metadata: "Metadata",
    scheduledDate: "Scheduled Date",
    duration: "Duration",
    latency: "Latency",
    authorization: "Authorization",
    minutes: "minutes",
    optimal: "Optimal",
    unavailable: "Unavailable",
  },
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
};
