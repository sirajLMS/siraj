import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding";
import type { MeetingConfigJoinLabels, MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

interface ParentOnboardingMeetingLabels {
  readonly manager: MeetingConfigManagerLabels;
  readonly join: MeetingConfigJoinLabels;
}

export interface ParentOnboardingLabelsBySection {
  readonly form: ParentOnboardingLabels;
  readonly meeting: ParentOnboardingMeetingLabels;
}
