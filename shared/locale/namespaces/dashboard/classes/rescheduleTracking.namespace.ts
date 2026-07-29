import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes/rescheduleTracking";

export const DashboardRescheduleTracking = defineNamespace<RescheduleTrackingLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/classes/rescheduleTracking").then(
        module => module.dashboardRescheduleTrackingEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/classes/rescheduleTracking").then(
        module => module.dashboardRescheduleTrackingAr
      ),
  },
});
