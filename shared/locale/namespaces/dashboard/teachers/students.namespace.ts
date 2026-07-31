import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherStudentsLabels } from "@/shared/locale/types/dashboard/teachers/students";

export const DashboardTeacherStudents = defineNamespace<TeacherStudentsLabels>("dashboard.teachers.students", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/students").then(module => module.dashboardTeacherStudentsEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/students").then(module => module.dashboardTeacherStudentsAr),
  },
});
