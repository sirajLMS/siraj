"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import {
  MeetingConfigFields,
  type MeetingConfigFieldsLabels,
} from "@/frontend/common/views/dashboard/shared/onboarding/MeetingConfigFields";

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
        <MeetingConfigFields
          labels={labels}
          meetingProviderValue={field.value ?? null}
          onMeetingProviderChange={value => field.onChange(value)}
          meetingLabelInputProps={{ ...register("meetingLabel") }}
          meetingUrlInputProps={{ ...register("meetingUrl") }}
          meetingUrlError={errors.meetingUrl}
        />
      )}
    />
  );
}
