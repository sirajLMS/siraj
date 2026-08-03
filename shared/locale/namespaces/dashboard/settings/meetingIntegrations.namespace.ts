import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export const DashboardSettingsMeetingIntegrations = defineNamespace<SettingsMeetingIntegrationsLabels>(
  "dashboard.settings.meetingIntegrations",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/settings/meeting-integrations").then(
          module => module.dashboardSettingsMeetingIntegrationsEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/settings/meeting-integrations").then(
          module => module.dashboardSettingsMeetingIntegrationsAr
        ),
    },
  }
);
