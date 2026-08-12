"use client";

import type { ComponentProps } from "react";
import {
  MeetingConfigFields,
  type MeetingConfigFieldsLabels,
} from "@/frontend/common/views/dashboard/shared/onboarding/MeetingConfigFields";

type MeetingConfigFieldsProps = ComponentProps<typeof MeetingConfigFields>;

export type MeetingConfigOnboardingSectionProps = Pick<
  MeetingConfigFieldsProps,
  | "meetingProviderValue"
  | "onMeetingProviderChange"
  | "meetingLabelInputProps"
  | "meetingUrlInputProps"
  | "meetingUrlError"
> & {
  readonly labels: MeetingConfigFieldsLabels;
};

export function MeetingConfigOnboardingSection({
  meetingProviderValue,
  onMeetingProviderChange,
  meetingLabelInputProps,
  meetingUrlInputProps,
  meetingUrlError,
  labels,
}: Readonly<MeetingConfigOnboardingSectionProps>): React.ReactNode {
  return (
    <MeetingConfigFields
      labels={labels}
      meetingProviderValue={meetingProviderValue}
      onMeetingProviderChange={onMeetingProviderChange}
      meetingLabelInputProps={meetingLabelInputProps}
      meetingUrlInputProps={meetingUrlInputProps}
      meetingUrlError={meetingUrlError}
    />
  );
}
