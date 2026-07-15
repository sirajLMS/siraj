import type { ParentDashboardLabels } from "@/shared/locale/types/dashboard/core";

export const parentDashboard: ParentDashboardLabels = {
  pageTitle: "Dashboard",
  welcome: name => `Welcome, ${name}`,
  welcomeBack: "Welcome back,",
  pendingMessages: count => `${count} pending messages from teachers`,
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
    duration: minutes => `Duration: ${minutes} min`,
    teacherLabel: name => `Teacher: ${name}`,
    joinVideo: "Join Video Session",
    frozen: "Frozen",
    contactAdmin: "Contact admin (hold)",
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
    completion: percent => `${percent}% completion`,
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
