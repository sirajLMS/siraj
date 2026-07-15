import type { TeacherClassListLabels } from "@/shared/messages/types/dashboard/teachers/class-list";

export const classList: TeacherClassListLabels = {
  pageTitle: "Class List",
  pageSubtitle: "View and manage your scheduled classes",
  noClasses: "No classes found.",
  viewDetails: "View Details",
  viewClassAudit: "View Class Audit",
  joinVideo: "Join Video",
  durationMinutes: (minutes: number) => `${minutes} min`,
  errors: {
    failedToLoad: "Failed to load classes.",
  },
  statusLabels: {
    PENDING: "Pending",
    TAKEN: "Taken",
    ABSENT: "Absent",
    LEAVE: "Leave",
    NOT_ACTIVATED: "Not Activated",
    ACTIVATED: "Activated",
    RUNNING: "Running",
    COMPLETED: "Completed",
  },
};
