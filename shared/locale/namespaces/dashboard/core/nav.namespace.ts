import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { DashboardNavigationLabels } from "@/shared/locale/types/dashboard/core";

export const DashboardCoreNav = defineNamespace<DashboardNavigationLabels>("dashboard.core.nav", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/core/nav").then(module => module.dashboardCoreNavEn),
    ar: () => import("@/shared/locale/ar/dashboard/core/nav").then(module => module.dashboardCoreNavAr),
  },
});
