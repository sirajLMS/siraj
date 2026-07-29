import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ScheduleAlertsLabels } from "@/shared/locale/types/dashboard/core";

export const DashboardCoreScheduleAlerts = defineNamespace<ScheduleAlertsLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/core/scheduleAlerts").then(module => module.dashboardCoreScheduleAlertsEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/core/scheduleAlerts").then(module => module.dashboardCoreScheduleAlertsAr),
  },
});
