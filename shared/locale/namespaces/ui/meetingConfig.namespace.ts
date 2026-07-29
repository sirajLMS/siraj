import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MeetingConfigLabels } from "@/shared/locale/types/ui";

export const UiMeetingConfig = defineNamespace<MeetingConfigLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/meeting-config").then(module => module.uiMeetingConfigEn),
    ar: () => import("@/shared/locale/ar/ui/meeting-config").then(module => module.uiMeetingConfigAr),
  },
});
