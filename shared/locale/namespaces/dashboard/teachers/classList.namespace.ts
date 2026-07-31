import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherClassListLabels } from "@/shared/locale/types/dashboard/teachers/classList";

export const DashboardTeacherClassList = defineNamespace<TeacherClassListLabels>("dashboard.teachers.classList", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/classList").then(module => module.dashboardTeacherClassListEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/classList").then(module => module.dashboardTeacherClassListAr),
  },
});
