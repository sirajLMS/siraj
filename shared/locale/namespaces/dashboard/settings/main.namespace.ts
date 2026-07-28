import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SettingsLabels } from "@/shared/locale/types/dashboard/settings/main";

export const DashboardSettings = defineNamespace<SettingsLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/settings/main").then(module => module.dashboardSettingsEn),
    ar: () => import("@/shared/locale/ar/dashboard/settings/main").then(module => module.dashboardSettingsAr),
  },
});
