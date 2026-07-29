import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ScheduleTrackingParentLabels } from "@/shared/locale/types/dashboard/schedule-tracking/main";

export const DashboardScheduleTrackingParent = defineNamespace<ScheduleTrackingParentLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/schedule-tracking/main").then(
        module => module.dashboardScheduleTrackingParentEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/schedule-tracking/main").then(
        module => module.dashboardScheduleTrackingParentAr
      ),
  },
});
