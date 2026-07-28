import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SettingsTimezonesLabels } from "@/shared/locale/types/dashboard/settings/timezones";

export const DashboardSettingsTimezones = defineNamespace<SettingsTimezonesLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/settings/timezones").then(module => module.dashboardSettingsTimezonesEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/settings/timezones").then(module => module.dashboardSettingsTimezonesAr),
  },
});
