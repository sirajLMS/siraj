import type { TeacherStudentsLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeacherStudentsEn: TeacherStudentsLabels = {
  pageTitle: "My Students",
  pageSubtitle: "View and manage your students",
  noStudents: "No students assigned.",
  statusLabel: status => `Status: ${status}`,
  quotaLabel: (remaining, total) => `Remaining quota: ${remaining} / ${total}`,
  hoursLabel: hours => `${hours} hours weekly`,
  errors: {
    failedToLoad: "Failed to load students.",
  },
};
