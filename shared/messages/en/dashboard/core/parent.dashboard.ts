import type { ParentDashboardLabels } from "@/shared/messages/types/dashboard/core";

export const parentDashboard: ParentDashboardLabels = {
  welcome: "Welcome, {name}",
  welcomeBack: "Welcome back,",
  pendingMessages: "{count} pending messages from teachers",
  metrics: {
    totalStudents: "Total Students",
    todaysClasses: "Today's Classes",
    pendingInvoices: "Pending Invoices",
    performanceAvg: "Average Performance",
  },
  schedule: {
    title: "Today's Schedule",
    titleMobile: "Today's Schedule",
    filter: "Filter",
    viewFullWeek: "View Full Week",
    viewAll: "View All",
    rowNumber: "#",
    classTime: "Class Time",
    studentName: "Student Name",
    teacherName: "Teacher Name",
    history: "History",
    status: "Status",
    contact: "Contact",
    classStatus: "Class Status",
    duration: "Duration: {minutes} min",
    teacherLabel: "Teacher: {name}",
    joinVideo: "Join Video Session",
    noEntries: "No classes scheduled for today",
  },
  bookingStatus: {
    confirmed: "Confirmed",
    rescheduled: "Rescheduled",
  },
  liveClassStatus: {
    startingSoon: "Starting soon",
    pending: "Pending",
    scheduled: "Scheduled",
  },
  progress: {
    title: "Academic Progress Summary",
    subtitle: "Weekly view for both students",
    completion: "{percent}% completion",
    downloadReport: "Download Full Report",
  },
  workshop: {
    badge: "Updates",
    learnMore: "Learn More",
  },
  support: {
    liveSupport: "Live Support",
  },
};
