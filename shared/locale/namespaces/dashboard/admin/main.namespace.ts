import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";

export const DashboardAdmin = defineNamespace<AdminDashboardLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/admin/index").then(module => module.dashboardAdminEn),
    ar: () => import("@/shared/locale/ar/dashboard/admin/index").then(module => module.dashboardAdminAr),
  },
});
