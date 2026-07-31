import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MeetingProvidersLabels } from "@/shared/locale/types/dashboard/meeting-providers/main";

export const DashboardMeetingProviders = defineNamespace<MeetingProvidersLabels>("dashboard.meeting-providers.main", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/meeting-providers/main").then(module => module.dashboardMeetingProvidersEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/meeting-providers/main").then(module => module.dashboardMeetingProvidersAr),
  },
});
