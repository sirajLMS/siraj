import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SettingsSessionTabLabels } from "@/shared/locale/types/dashboard/settings/session";

export const DashboardSettingsSession = defineNamespace<SettingsSessionTabLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/settings/session").then(module => module.dashboardSettingsSessionEn),
    ar: () => import("@/shared/locale/ar/dashboard/settings/session").then(module => module.dashboardSettingsSessionAr),
  },
});
