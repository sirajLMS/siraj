import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

export const DashboardAccountingPayments = defineNamespace<PaymentsLabels>("dashboard.accounting.payments", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/accounting/payments").then(module => module.dashboardAccountingPaymentsEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/accounting/payments").then(module => module.dashboardAccountingPaymentsAr),
  },
});
