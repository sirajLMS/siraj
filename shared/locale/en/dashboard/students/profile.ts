import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students";

export const dashboardStudentProfileEn: StudentProfileLabels = {
  title: "Student Profile",
  subtitle: "View and manage student information",
  restrictedIdentity: id => `Student ${id}`,
  restrictedIdentityGeneric: "Student profile",
  loading: "Loading student profile...",
  notFoundTitle: "Student not found",
  notFoundDescription: "We couldn't find this student. They may have been removed or you may not have access.",
  tabs: {
    profile: "Profile",
    status: "Status",
    classes: "Classes",
    quota: "Quota",
    history: "History",
  },
};
