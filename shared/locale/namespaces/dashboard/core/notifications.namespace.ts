import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { DashboardCoreNotificationsLabels } from "@/shared/locale/types/dashboard/core/notifications";

export const DashboardCoreNotifications = defineNamespace<DashboardCoreNotificationsLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/core/notifications").then(module => module.dashboardCoreNotificationsEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/core/notifications").then(module => module.dashboardCoreNotificationsAr),
  },
});
