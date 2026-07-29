import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SettingsGeneralTabLabels } from "@/shared/locale/types/dashboard/settings/general";

export const DashboardSettingsGeneral = defineNamespace<SettingsGeneralTabLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/settings/general").then(module => module.dashboardSettingsGeneralEn),
    ar: () => import("@/shared/locale/ar/dashboard/settings/general").then(module => module.dashboardSettingsGeneralAr),
  },
});
