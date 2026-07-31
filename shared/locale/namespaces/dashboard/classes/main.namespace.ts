import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MainLabels } from "@/shared/locale/types/dashboard/classes/main";

export const DashboardClassesMain = defineNamespace<MainLabels>("dashboard.classes.main", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/classes/main").then(module => module.dashboardClassesMainEn),
    ar: () => import("@/shared/locale/ar/dashboard/classes/main").then(module => module.dashboardClassesMainAr),
  },
});
