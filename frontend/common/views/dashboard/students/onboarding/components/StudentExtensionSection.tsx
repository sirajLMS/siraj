"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import {
  type StudentExtensionFieldLabels,
  StudentExtensionFields,
} from "@/frontend/common/views/dashboard/students/onboarding/components/StudentExtensionFields";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

export type { StudentExtensionFieldLabels };

interface StudentExtensionSectionProps {
  readonly register: UseFormRegister<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly control: Control<StudentOnboardingFormData>;
  readonly labels: StudentExtensionFieldLabels;
}

export function StudentExtensionSection({ register, errors, control, labels }: Readonly<StudentExtensionSectionProps>) {
  return (
    <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
      <StudentExtensionFields register={register} errors={errors} control={control} labels={labels} />
    </Grid>
  );
}
