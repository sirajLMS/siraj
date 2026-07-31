import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { AdminViewLabels } from "@/shared/locale/types/dashboard/admin/view";

export const DashboardAdminView = defineNamespace<AdminViewLabels>("dashboard.admin.view", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/admin/view").then(module => module.dashboardAdminViewEn),
    ar: () => import("@/shared/locale/ar/dashboard/admin/view").then(module => module.dashboardAdminViewAr),
  },
});
