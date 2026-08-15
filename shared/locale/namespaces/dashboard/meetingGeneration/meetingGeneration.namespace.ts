import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MeetingGenerationLabels } from "@/shared/locale/types/dashboard/meeting-generation";

export const DashboardMeetingGeneration = defineNamespace<MeetingGenerationLabels>("dashboard.meetingGeneration", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/meetingGeneration/meetingGeneration").then(
        module => module.dashboardMeetingGenerationEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/meetingGeneration/meetingGeneration").then(
        module => module.dashboardMeetingGenerationAr
      ),
  },
});
