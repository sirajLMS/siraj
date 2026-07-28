import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PermissionsLabels } from "@/shared/locale/types/dashboard/permissions/main";

export const DashboardPermissions = defineNamespace<PermissionsLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/permissions/main").then(module => module.dashboardPermissionsEn),
    ar: () => import("@/shared/locale/ar/dashboard/permissions/main").then(module => module.dashboardPermissionsAr),
  },
});
