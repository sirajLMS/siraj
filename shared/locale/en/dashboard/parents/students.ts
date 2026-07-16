import type { ParentStudentsLabels } from "@/shared/locale/types/dashboard/parents";

export const dashboardParentStudentsEn: ParentStudentsLabels = {
  pageTitle: "Associated Students",
  pageSubtitle: "View and manage your associated students",
  noStudents: "No students associated with this account.",
  statusLabel: status => `Status: ${status}`,
  teacherLabel: teacher => `Teacher: ${teacher}`,
  quotaLabel: (remaining, total) => `Remaining: ${remaining}/${total} classes`,
  hoursLabel: hours => `${hours} Hours/Week`,
  errors: {
    failedToLoad: "Failed to load students. Please try again later.",
  },
};
