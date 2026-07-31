import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ParentDashboardLabels } from "@/shared/locale/types/dashboard/core";

export const DashboardCoreParentDashboard = defineNamespace<ParentDashboardLabels>("dashboard.core.parentDashboard", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/core/parentDashboard").then(module => module.dashboardCoreParentDashboardEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/core/parentDashboard").then(module => module.dashboardCoreParentDashboardAr),
  },
});
