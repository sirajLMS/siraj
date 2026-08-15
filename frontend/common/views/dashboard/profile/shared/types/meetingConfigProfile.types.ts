import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";
import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigDisplayLabels,
  MeetingConfigEnhancementLabels,
  MeetingConfigLinkedClassInstancesLabels,
  MeetingConfigManagerLabels,
  MeetingConfigReauthNeededLabels,
  MeetingConfigSummaryLabels,
} from "@/shared/locale/types/ui";

export type MeetingConfigProfileLabels = {
  readonly manager: MeetingConfigManagerLabels;
  readonly classScope: MeetingConfigClassScopeLabels;
  readonly display: MeetingConfigDisplayLabels;
  readonly summary: MeetingConfigSummaryLabels;
  readonly reauthNeeded: MeetingConfigReauthNeededLabels;
  readonly linkedClassInstances: MeetingConfigLinkedClassInstancesLabels;
  readonly autoGeneration: ProfileNotificationsLabels["autoGeneration"];
  readonly connectAccount: ProfileNotificationsLabels["connectAccount"];
  readonly enhancements: MeetingConfigEnhancementLabels;
};
