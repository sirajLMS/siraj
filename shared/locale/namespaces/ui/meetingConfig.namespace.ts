import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MeetingConfigLabels } from "@/shared/locale/types/ui";

export const UiMeetingConfig = defineNamespace<MeetingConfigLabels>("ui.meetingConfig", {
  load: {
    en: () => import("@/shared/locale/en/ui/meetingConfig").then(module => module.uiMeetingConfigEn),
    ar: () => import("@/shared/locale/ar/ui/meetingConfig").then(module => module.uiMeetingConfigAr),
  },
});
