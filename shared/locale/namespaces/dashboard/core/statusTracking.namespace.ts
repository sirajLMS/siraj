import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StatusTrackingLabels } from "@/shared/locale/types/dashboard/core";

export const DashboardCoreStatusTracking = defineNamespace<StatusTrackingLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/core/statusTracking").then(module => module.dashboardCoreStatusTrackingEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/core/statusTracking").then(module => module.dashboardCoreStatusTrackingAr),
  },
});
