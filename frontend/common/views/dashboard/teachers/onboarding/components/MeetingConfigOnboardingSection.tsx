"use client";

import { type Control, Controller, type FieldErrors, type UseFormRegister } from "react-hook-form";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MeetingConfigFieldsLabels } from "@/frontend/common/views/dashboard/shared/onboarding/MeetingConfigFields";
import { MeetingConfigOnboardingSection as SharedMeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/shared/onboarding/MeetingConfigOnboardingSection";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";

type MeetingConfigOnboardingSectionForTeacherProps = {
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
}: Readonly<MeetingConfigOnboardingSectionForTeacherProps>) {
  return (
    <Controller
      control={control}
      name="meetingProvider"
      render={({ field }) => (
        <SharedMeetingConfigOnboardingSection
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
