import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherDueLabels } from "@/shared/locale/types/dashboard/lms/teacherDues";

export const DashboardLmsTeacherDues = defineNamespace<TeacherDueLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/lms/teacherDues").then(module => module.dashboardLmsTeacherDuesEn),
    ar: () => import("@/shared/locale/ar/dashboard/lms/teacherDues").then(module => module.dashboardLmsTeacherDuesAr),
  },
});
