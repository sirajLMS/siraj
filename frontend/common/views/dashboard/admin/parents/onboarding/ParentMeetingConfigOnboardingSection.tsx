"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { ParentOnboardingFormData } from "@/frontend/common/types/shared.types";
import type { MeetingConfigFieldsLabels } from "@/frontend/common/views/dashboard/shared/onboarding/MeetingConfigFields";
import { MeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/shared/onboarding/MeetingConfigOnboardingSection";

type ParentMeetingConfigOnboardingSectionProps = {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly labels: MeetingConfigFieldsLabels;
};

export function ParentMeetingConfigOnboardingSection({
  register,
  control,
  errors,
  labels,
}: Readonly<ParentMeetingConfigOnboardingSectionProps>) {
  return (
    <Controller
      control={control}
      name="meetingProvider"
      render={({ field }) => (
        <MeetingConfigOnboardingSection
          meetingProviderValue={field.value ?? null}
          onMeetingProviderChange={(value: MeetingProviderFieldsFragment | null) => field.onChange(value)}
          meetingLabelInputProps={{ ...register("meetingLabel") }}
          meetingUrlInputProps={{ ...register("meetingUrl") }}
          meetingUrlError={errors.meetingUrl}
          labels={labels}
        />
      )}
    />
  );
}
