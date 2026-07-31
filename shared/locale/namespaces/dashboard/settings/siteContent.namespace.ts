import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

export const DashboardSettingsSiteContent = defineNamespace<SettingsSiteContentTabLabels>(
  "dashboard.settings.siteContent",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/settings/siteContent").then(
          module => module.dashboardSettingsSiteContentEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/settings/siteContent").then(
          module => module.dashboardSettingsSiteContentAr
        ),
    },
  }
);
