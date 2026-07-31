import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherOwnProfileLabels } from "@/shared/locale/types/dashboard/teachers/ownProfile";

export const DashboardTeacherOwnProfile = defineNamespace<TeacherOwnProfileLabels>("dashboard.teachers.ownProfile", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/ownProfile").then(module => module.dashboardTeacherOwnProfileEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/ownProfile").then(module => module.dashboardTeacherOwnProfileAr),
  },
});
