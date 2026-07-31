import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ResourcesLabels } from "@/shared/locale/types/dashboard/resources";

export const DashboardResources = defineNamespace<ResourcesLabels>("dashboard.resources.main", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/resources/main").then(module => module.dashboardResourcesEn),
    ar: () => import("@/shared/locale/ar/dashboard/resources/main").then(module => module.dashboardResourcesAr),
  },
});
