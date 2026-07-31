import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers/reassignment";

export const DashboardTeacherReassignment = defineNamespace<TeacherReassignmentLabels>(
  "dashboard.teachers.reassignment",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/teachers/reassignment").then(
          module => module.dashboardTeacherReassignmentEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/teachers/reassignment").then(
          module => module.dashboardTeacherReassignmentAr
        ),
    },
  }
);
