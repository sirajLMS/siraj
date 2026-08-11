"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  MeetingConfigFields,
  type MeetingConfigFieldsLabels,
} from "@/frontend/common/views/dashboard/shared/onboarding/MeetingConfigFields";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

type MeetingConfigOnboardingSectionProps = {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: MeetingConfigFieldsLabels;
};

export function MeetingConfigOnboardingSection({
  register,
  control,
  errors,
  labels,
}: Readonly<MeetingConfigOnboardingSectionProps>) {
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
