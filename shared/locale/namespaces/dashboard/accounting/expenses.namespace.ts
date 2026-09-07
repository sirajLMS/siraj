import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export const DashboardAccountingExpenses = defineNamespace<ExpensesLabels>("dashboard.accounting.expenses", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/accounting/expenses").then(module => module.dashboardAccountingExpensesEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/accounting/expenses").then(module => module.dashboardAccountingExpensesAr),
  },
});
