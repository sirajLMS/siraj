import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SettingsEnvironmentLabels } from "@/shared/locale/types/dashboard/settings/environment";

export const DashboardSettingsEnvironment = defineNamespace<SettingsEnvironmentLabels>(
  "dashboard.settings.environment",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/settings/environment").then(
          module => module.dashboardSettingsEnvironmentEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/settings/environment").then(
          module => module.dashboardSettingsEnvironmentAr
        ),
    },
  }
);
