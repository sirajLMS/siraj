import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SubjectsLabels } from "@/shared/locale/types/dashboard/subjects/main";

export const DashboardSubjects = defineNamespace<SubjectsLabels>("dashboard.subjects.main", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/subjects/main").then(module => module.dashboardSubjectsEn),
    ar: () => import("@/shared/locale/ar/dashboard/subjects/main").then(module => module.dashboardSubjectsAr),
  },
});
