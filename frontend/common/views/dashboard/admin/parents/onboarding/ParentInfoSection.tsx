"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { UserIdentityFields, UserPersonalFields } from "@/frontend/common/components/onboarding/sections";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { Translation, useAppTranslation } from "@/shared/locale";

interface Props {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export function ParentInfoSection({ register, control, errors, onUploadAvatar }: Props) {
  const t = useAppTranslation(Translation.Dashboard.ParentOnboarding);

  return (
    <SectionPanel title={t.sections.parentInfo}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <UserIdentityFields
          register={register}
          control={control}
          errors={errors}
          translate={t}
          phoneRequired={false}
          onUploadAvatar={onUploadAvatar}
        />
        <UserPersonalFields register={register} control={control} errors={errors} translate={t} hideQualifications />
      </Grid>
    </SectionPanel>
  );
}
