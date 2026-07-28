import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students/history";

export const DashboardStudentHistory = defineNamespace<StudentHistoryLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/students/history").then(module => module.dashboardStudentHistoryEn),
    ar: () => import("@/shared/locale/ar/dashboard/students/history").then(module => module.dashboardStudentHistoryAr),
  },
});
