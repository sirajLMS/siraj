import type { StudentDashboardLabels } from "@/shared/messages/types/dashboard/studentPortal/studentDashboard";

export const studentDashboard: StudentDashboardLabels = {
  pageTitle: "My Dashboard",
  welcomeMessage: (name: string) => `Welcome, ${name}`,
  nextClass: "Next Class",
  joinNow: "Join Now",
  noUpcomingClasses: "No upcoming classes scheduled",
  creditBalance: "Credit Balance",
  classesRemaining: "Classes Remaining",
  classesTotal: "Total Classes",
  recentLessonReports: "Recent Lesson Reports",
  viewAllHistory: "View All History",
  viewCredits: "View Credits",
  addReflection: "Add Reflection",
  upcomingToday: "Today's Classes",
  upcomingThisWeek: "This Week",
  noLessonReports: "No lesson reports yet",
  loadingMessage: "Loading...",
};
