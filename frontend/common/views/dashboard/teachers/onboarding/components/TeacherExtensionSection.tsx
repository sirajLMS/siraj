"use client";

import { Grid, TextField } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { OnboardingSectionTranslations } from "@/frontend/common/components/onboarding/sections/types";
import {
  UserPersonalAddressField,
  UserPersonalDateOfBirthField,
  UserPersonalGenderField,
  UserPersonalNationalityField,
  UserPersonalQualificationsField,
} from "@/frontend/common/components/onboarding/sections/userPersonalFieldComponents";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import type { TeacherOnboardingLabels } from "@/shared/locale/types/dashboard/teachers/onboarding";

interface TeacherExtensionSectionProps {
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly labels: TeacherOnboardingLabels;
}

function toSectionTranslations(labels: TeacherOnboardingLabels): OnboardingSectionTranslations {
  return {
    fields: labels.fields,
    placeholders: labels.placeholders,
    validation: labels.validation,
  };
}

export function TeacherExtensionSection({ register, control, errors, labels }: Readonly<TeacherExtensionSectionProps>) {
  const translate = toSectionTranslations(labels);

  return (
    <Grid container spacing={3}>
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
      <UserPersonalNationalityField register={register} control={control} errors={errors} translate={translate} />
      <UserPersonalAddressField register={register} translate={translate} />
      <UserPersonalDateOfBirthField control={control} translate={translate} />
      <UserPersonalGenderField control={control} errors={errors} translate={translate} />
      <UserPersonalQualificationsField register={register} translate={translate} />
    </Grid>
  );
}
