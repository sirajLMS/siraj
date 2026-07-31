import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { MeetingConfigRecurringScheduleLabels } from "@/shared/locale/types/ui";

export const UiMeetingConfigRecurringSchedule = defineNamespace<MeetingConfigRecurringScheduleLabels>(
  "ui.meetingConfigRecurringSchedule",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/ui/meetingConfig/recurringSchedule").then(
          module => module.uiMeetingConfigRecurringScheduleEn
        ),
      ar: () =>
        import("@/shared/locale/ar/ui/meetingConfig/recurringSchedule").then(
          module => module.uiMeetingConfigRecurringScheduleAr
        ),
    },
  }
);
