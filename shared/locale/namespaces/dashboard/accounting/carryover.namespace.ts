import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

export const DashboardAccountingCarryover = defineNamespace<CarryoverLabels>("dashboard.accounting.carryover", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/accounting/carryover").then(module => module.dashboardAccountingCarryoverEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/accounting/carryover").then(module => module.dashboardAccountingCarryoverAr),
  },
});
