import type { TeacherClassListLabels } from "@/shared/locale/types/dashboard/teachers";

export const classList: TeacherClassListLabels = {
  pageTitle: "Class List",
  pageSubtitle: "View and manage your scheduled classes",
  noClasses: "No classes found.",
  viewDetails: "View Details",
  viewClassAudit: "View Class Audit",
  durationMinutes: minutes => `${minutes} min`,
  errors: {
    failedToLoad: "Failed to load classes.",
  },
};
