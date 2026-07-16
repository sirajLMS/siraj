import type { ScheduleAlertsLabels } from "@/shared/locale/types/dashboard/core";

export const dashboardCoreScheduleAlertsEn: ScheduleAlertsLabels = {
  pageTitle: "Schedule Alerts",
  pageSubtitle: "Monitor schedule alerts and daily classes.",
  alerts: {
    leaveQuotaExceeded: "You have reached the maximum leave quota.",
    missedClassTime: "Class time has passed",
  },
  metrics: {
    totalStudents: "Total Students",
    totalStudentsTrend: "+12% vs last month",
    activeCourses: "Active Classes",
    activeCoursesSub: "Across 8 sections",
  },
  report: {
    title: "Institutional Report 2024",
    description: "Review comprehensive academic and financial performance for Spring semester.",
    descriptionMobile: "Full audit of academic & financial performance.",
    downloadPdf: "Download PDF",
  },
  section: {
    title: "Academic Schedule",
    subtitle: "Manage today's classes and attendance",
  },
  table: {
    className: "Class Name",
    instructor: "Teacher",
    time: "Time",
    room: "Room",
    status: "Status",
  },
  actions: {
    filter: "Filter",
    export: "Export",
    joinSession: "Join Session",
    leaveClass: "Leave Class",
    leaveDisabledReason: "Leave quota reached.",
    viewClassAudit: "View Class Audit",
    contactAdmin: "Contact Admin (Hold)",
  },
  sessionStatus: {
    active: "Active",
    upcoming: "Upcoming",
    missed: "Missed",
    hold: "On Hold",
  },
  showingOf: (shown, total) => `Showing ${shown} of ${total} classes`,
  noEntries: "No classes found",
  endOfSchedule: "End of main schedule",
  loading: "Loading...",
};
