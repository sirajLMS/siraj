import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

export const DashboardAccountingProfitLoss = defineNamespace<ProfitLossLabels>("dashboard.accounting.profitLoss", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/accounting/profitLoss").then(
        module => module.dashboardAccountingProfitLossEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/accounting/profitLoss").then(
        module => module.dashboardAccountingProfitLossAr
      ),
  },
});
