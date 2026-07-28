"use client";

import type { MeetingConfigProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/types/meetingConfigProfile.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useMeetingConfigProfileLabels(): MeetingConfigProfileLabels {
  const meetingConfig = useAppTranslation(Translation.Ui.MeetingConfig);
  return {
    manager: meetingConfig.manager,
    classScope: meetingConfig.classScope,
    display: meetingConfig.display,
    summary: meetingConfig.summary,
  };
}
