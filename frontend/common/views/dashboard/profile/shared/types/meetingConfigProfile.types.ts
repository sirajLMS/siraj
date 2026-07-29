import type {
  MeetingConfigClassScopeLabels,
  MeetingConfigDisplayLabels,
  MeetingConfigManagerLabels,
  MeetingConfigSummaryLabels,
} from "@/shared/locale/types/ui";

export type MeetingConfigProfileLabels = {
  readonly manager: MeetingConfigManagerLabels;
  readonly classScope: MeetingConfigClassScopeLabels;
  readonly display: MeetingConfigDisplayLabels;
  readonly summary: MeetingConfigSummaryLabels;
};
