import type { ParentStudentsLabels } from "@/shared/messages/types/dashboard/parents/students";

export const parentStudents: ParentStudentsLabels = {
  pageTitle: "Associated Students",
  pageSubtitle: "View and manage your associated students",
  noStudents: "No students associated with this account.",
  statusLabel: "Status: {status}",
  teacherLabel: "Teacher: {teacher}",
  quotaLabel: "Remaining: {remaining}/{total} classes",
  hoursLabel: "{hours} Hours/Week",
  errors: {
    failedToLoad: "Failed to load students. Please try again later.",
  },
};
