import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status";

export const DashboardStudentStatus = defineNamespace<StudentStatusLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/students/status").then(module => module.dashboardStudentStatusEn),
    ar: () => import("@/shared/locale/ar/dashboard/students/status").then(module => module.dashboardStudentStatusAr),
  },
});
