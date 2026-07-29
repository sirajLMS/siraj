"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { StudentIdentityFields } from "@/frontend/common/views/dashboard/students/onboarding/components/StudentIdentityFields";
import {
  type StudentPersonalFieldLabels,
  StudentPersonalFields,
} from "@/frontend/common/views/dashboard/students/onboarding/components/StudentPersonalFields";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";

interface StudentInfoSectionLabels extends StudentPersonalFieldLabels {
  readonly sectionTitle: string;
  readonly name: string;
  readonly namePlaceholder: string;
  readonly nameMinLength: string;
  readonly avatar: string;
}

interface StudentInfoSectionProps {
  readonly register: UseFormRegister<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly control: Control<StudentOnboardingFormData>;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly labels: StudentInfoSectionLabels;
}

export function StudentInfoSection({
  register,
  errors,
  control,
  labels,
  onUploadAvatar,
}: Readonly<StudentInfoSectionProps>) {
  return (
    <MobileSectionPanel title={labels.sectionTitle} contentInset={false}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <StudentIdentityFields
          register={register}
          control={control}
          errors={errors}
          labels={labels}
          onUploadAvatar={onUploadAvatar}
        />
        <StudentPersonalFields register={register} errors={errors} control={control} labels={labels} />
      </Grid>
    </MobileSectionPanel>
  );
}
