"use client";

import { Grid, TextField } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { OnboardingSectionTranslations } from "@/frontend/common/components/onboarding/sections";
import {
  UserContactFields,
  UserIdentityFields,
  UserPersonalFields,
} from "@/frontend/common/components/onboarding/sections";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import type { TeacherOnboardingLabels } from "@/shared/locale/types/dashboard/teachers/onboarding";

interface TeacherInfoSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: TeacherOnboardingLabels;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

function toSectionTranslations(labels: TeacherOnboardingLabels): OnboardingSectionTranslations {
  return {
    fields: labels.fields,
    placeholders: labels.placeholders,
    validation: labels.validation,
  };
}

export function TeacherInfoSection({
  register,
  control,
  errors,
  labels,
  onUploadAvatar,
}: Readonly<TeacherInfoSectionProps>) {
  const translate = toSectionTranslations(labels);

  return (
    <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
      <UserIdentityFields
        register={register}
        control={control}
        errors={errors}
        translate={translate}
        hidePhone
        onUploadAvatar={onUploadAvatar}
      />
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register("nationalId")}
          label={labels.fields.nationalId}
          placeholder={labels.placeholders.nationalId}
          error={!!errors.nationalId}
          helperText={errors.nationalId?.message}
          fullWidth
          sx={outlinedInputSx}
        />
      </Grid>
      <UserContactFields control={control} errors={errors} translate={translate} phoneRequired />
      <UserPersonalFields register={register} control={control} errors={errors} translate={translate} />
    </Grid>
  );
}
