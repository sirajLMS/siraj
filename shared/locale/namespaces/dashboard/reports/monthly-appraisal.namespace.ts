import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MonthlyAppraisalLabels } from "@/shared/locale/types/dashboard/reports/monthly-appraisal";

export const DashboardMonthlyAppraisal = defineNamespace<MonthlyAppraisalLabels>(
  "dashboard.reports.monthly-appraisal",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/reports/monthly-appraisal").then(module => module.monthlyAppraisalEn),
      ar: () =>
        import("@/shared/locale/ar/dashboard/reports/monthly-appraisal").then(module => module.monthlyAppraisalAr),
    },
  }
);
