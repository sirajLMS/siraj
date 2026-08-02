import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export const DashboardCron = defineNamespace<CronLabels>("dashboard.cron.main", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/cron/main").then(module => module.dashboardCronEn),
    ar: () => import("@/shared/locale/ar/dashboard/cron/main").then(module => module.dashboardCronAr),
  },
});
