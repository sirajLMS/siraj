import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ClassDetailsLabels } from "@/shared/locale/types/dashboard/classes/details";

export const DashboardClassDetails = defineNamespace<ClassDetailsLabels>("dashboard.classes.details", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/classes/details").then(module => module.dashboardClassDetailsEn),
    ar: () => import("@/shared/locale/ar/dashboard/classes/details").then(module => module.dashboardClassDetailsAr),
  },
});
