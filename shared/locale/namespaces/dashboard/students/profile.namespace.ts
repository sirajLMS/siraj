import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students/profile";

export const DashboardStudentProfile = defineNamespace<StudentProfileLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/students/profile").then(module => module.dashboardStudentProfileEn),
    ar: () => import("@/shared/locale/ar/dashboard/students/profile").then(module => module.dashboardStudentProfileAr),
  },
});
