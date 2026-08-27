import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

export const DashboardAccountingPackagePlans = defineNamespace<PackagePlansLabels>(
  "dashboard.accounting.package-plans",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/accounting/package-plans").then(
          module => module.dashboardAccountingPackagePlansEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/accounting/package-plans").then(
          module => module.dashboardAccountingPackagePlansAr
        ),
    },
  }
);
