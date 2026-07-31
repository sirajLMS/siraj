import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

export const DashboardAdminDstMigration = defineNamespace<DstMigrationLabels>("dashboard.admin.dstMigration", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/admin/dstMigration").then(module => module.dashboardDstMigrationEn),
    ar: () => import("@/shared/locale/ar/dashboard/admin/dstMigration").then(module => module.dashboardDstMigrationAr),
  },
});
