import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SupervisorMonthlyReportsLabels } from "@/shared/locale/types/dashboard/supervisorPortal/monthlyReports";

export const DashboardSupervisorPortalMonthlyReports = defineNamespace<SupervisorMonthlyReportsLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/supervisorPortal/monthlyReports").then(
        module => module.dashboardSupervisorPortalMonthlyReportsEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/supervisorPortal/monthlyReports").then(
        module => module.dashboardSupervisorPortalMonthlyReportsAr
      ),
  },
});
