import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

export const DashboardBillingPayroll = defineNamespace<PayrollLabels>("dashboard.billing.payroll", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/billing/payroll").then(module => module.dashboardBillingPayrollEn),
    ar: () => import("@/shared/locale/ar/dashboard/billing/payroll").then(module => module.dashboardBillingPayrollAr),
  },
});
