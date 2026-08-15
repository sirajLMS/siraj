import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MeetingUrlStatusLabels } from "@/shared/locale/types/dashboard/meeting-url-status";

export const DashboardMeetingUrlStatus = defineNamespace<MeetingUrlStatusLabels>("dashboard.meetingUrlStatus", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/meetingUrlStatus/meetingUrlStatus").then(
        module => module.dashboardMeetingUrlStatusEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/meetingUrlStatus/meetingUrlStatus").then(
        module => module.dashboardMeetingUrlStatusAr
      ),
  },
});
