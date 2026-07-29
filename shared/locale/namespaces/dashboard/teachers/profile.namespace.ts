import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherProfileLabels } from "@/shared/locale/types/dashboard/teachers/profile";

export const DashboardTeacherProfile = defineNamespace<TeacherProfileLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/teachers/profile").then(module => module.dashboardTeacherProfileEn),
    ar: () => import("@/shared/locale/ar/dashboard/teachers/profile").then(module => module.dashboardTeacherProfileAr),
  },
});
