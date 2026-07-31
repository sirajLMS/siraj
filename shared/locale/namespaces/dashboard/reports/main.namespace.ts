import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ReportsLabels } from "@/shared/locale/types/dashboard/reports/main";

export const DashboardReports = defineNamespace<ReportsLabels>("dashboard.reports.main", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/reports/main").then(module => module.dashboardReportsEn),
    ar: () => import("@/shared/locale/ar/dashboard/reports/main").then(module => module.dashboardReportsAr),
  },
});
