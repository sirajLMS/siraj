import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ParentStudentsLabels } from "@/shared/locale/types/dashboard/parents/students";

export const DashboardParentStudents = defineNamespace<ParentStudentsLabels>("dashboard.parents.students", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/parents/students").then(module => module.dashboardParentStudentsEn),
    ar: () => import("@/shared/locale/ar/dashboard/parents/students").then(module => module.dashboardParentStudentsAr),
  },
});
