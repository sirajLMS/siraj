import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherDashboardLabels } from "@/shared/locale/types/dashboard/teachers/dashboard";

export const DashboardTeacherDashboard = defineNamespace<TeacherDashboardLabels>("dashboard.teachers.dashboard", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/dashboard").then(module => module.dashboardTeacherDashboardEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/dashboard").then(module => module.dashboardTeacherDashboardAr),
  },
});
