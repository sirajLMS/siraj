import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MonthlyReportLabels } from "@/shared/locale/types/dashboard/lms/monthlyReports";

export const DashboardLmsMonthlyReports = defineNamespace<MonthlyReportLabels>("dashboard.lms.monthlyReports", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/lms/monthlyReports").then(module => module.dashboardLmsMonthlyReportsEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/lms/monthlyReports").then(module => module.dashboardLmsMonthlyReportsAr),
  },
});
