import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { DashboardCoreLayoutLabels } from "@/shared/locale/types/dashboard/core";

export const DashboardCoreLayout = defineNamespace<DashboardCoreLayoutLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/core/layout").then(module => module.dashboardCoreLayoutEn),
    ar: () => import("@/shared/locale/ar/dashboard/core/layout").then(module => module.dashboardCoreLayoutAr),
  },
});
